/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build  
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Force Webpack and disable Turbopack completely
  experimental: {
    // These should force Webpack usage
    forceSwcTransforms: true,
    swcMinify: true,
  },
  // Explicitly disable Turbopack via webpack
  webpack: (config, { isServer, dev }) => {
    // Ensure Turbopack is not used
    if (dev) {
      // In development, we want to force Webpack
      process.env.TURBOPACK = '0';
      process.env.NEXT_TURBOPACK = '0';
    }
    return config;
  },
};

module.exports = nextConfig;
