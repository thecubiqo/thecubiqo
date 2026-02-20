/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['dockerode', 'ssh2', 'ioredis', 'googleapis', 'docker-modem'],
};

module.exports = nextConfig;