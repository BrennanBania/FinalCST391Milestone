/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure API routes work properly
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  // Environment variables available to the browser
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
