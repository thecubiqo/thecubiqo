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
  // Minimal config - no experimental features
};

module.exports = nextConfig;
