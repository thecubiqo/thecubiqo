/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable for now
  // Disable ALL checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Server-only packages that should not be bundled by Turbopack/webpack
  serverExternalPackages: ['dockerode', 'ioredis'],
};

module.exports = nextConfig;
