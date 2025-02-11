/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compiler: {
      emotion: true,
    },
    // Enable if you need to proxy API requests in development
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: '${process.env.NEXT_PUBLIC_API_URL}/api/:path*',
        },
      ];
    },
  };
  
  module.exports = nextConfig;