/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['dockerode', 'ssh2', 'ioredis', 'googleapis', 'docker-modem'],
  output: 'standalone',
};

module.exports = nextConfig;
