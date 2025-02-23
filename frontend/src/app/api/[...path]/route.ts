import { NextRequest, NextResponse } from 'next/server';
import { RouteContext } from '@/types';

// Proxy request handler with improved error handling and security
async function handleProxyRequest(req: NextRequest, path: string[] = []) {
  const djangoBaseUrl = process.env.DJANGO_API_URL || 'http://backend:8000';
  const fullPath = path.join('/');
  const url = new URL(`${djangoBaseUrl}/${fullPath}`);

  // Append query parameters from the original request
  req.nextUrl.searchParams.forEach((value: string, key: string) => {
    url.searchParams.append(key, value);
  });

  try {
    // Forward the request to the Django backend
    const headers = new Headers(req.headers);

    // Remove potentially problematic headers
    ['host', 'connection', 'content-length'].forEach(header => {
      headers.delete(header);
    });

    headers.set('Content-Type', req.headers.get('content-type') || 'application/json');

    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text();
    }

    const res = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });

    // Copy headers from the Django response
    const responseHeaders = new Headers(res.headers);

    // Set CORS headers more securely
    const origin = req.headers.get('origin');
    if (origin) {
      // Check if origin is in allowed list (add your own logic)
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        responseHeaders.set('Access-Control-Allow-Origin', origin);
      }
    }

    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', message: 'Failed to connect to backend service' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Generic function to handle the params
async function handleMethod(req: NextRequest, context: RouteContext) {
  const { params } = context;
  if (!params || !params.path) {
    return new NextResponse(
      JSON.stringify({ error: 'Bad Request', message: 'Invalid path parameters' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Ensure params.path is always treated as an array
  const pathArray = Array.isArray(params.path) ? params.path : [params.path];
  return handleProxyRequest(req, pathArray);
}

// HTTP method handlers with proper type definitions
export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return handleMethod(request, context as RouteContext);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return handleMethod(request, context as RouteContext);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return handleMethod(request, context as RouteContext);
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return handleMethod(request, context as RouteContext);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return handleMethod(request, context as RouteContext);
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const headers = new Headers();

  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return new NextResponse(null, { status: 204, headers });
}