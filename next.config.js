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
  // COMPLETELY disable Turbopack - use Webpack
  experimental: {
    forceSwcTransforms: true,
  },
  // Webpack config to ensure no Turbopack
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = nextConfig;
