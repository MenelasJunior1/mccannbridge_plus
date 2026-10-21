const phoenixBaseUrl = (process.env.PHOENIX_INTERNAL_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${phoenixBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
