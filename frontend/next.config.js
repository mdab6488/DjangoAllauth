/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Compiler options
  compiler: {
    // Emotion compiler options for CSS-in-JS
    emotion: {
      sourceMap: true,
      autoLabel: "dev-only",
      labelFormat: "[local]",
    },
  },

  // Experimental features
  experimental: {
    // Enable TurboPack for faster builds (still experimental)
    turbopack: true,
  },

  // Dynamic rewrites for API proxying
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },

  // Add environment variables for production
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Image optimization configuration
  images: {
    domains: ['example.com'],  // Add your image domains here
  },

  // Optional: Enable modules if needed
  // modules: true,

  // Optional: Configure redirects for SEO or routing
  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;