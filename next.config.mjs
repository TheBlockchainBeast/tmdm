/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export if needed for Telegram hosting
  // output: 'export',
  
  // Configure for Telegram Mini App
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
  
  // Reduce logging in development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
