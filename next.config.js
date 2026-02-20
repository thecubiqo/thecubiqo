/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverExternalPackages: ['dockerode', 'ssh2', 'ioredis'],
  },
};

module.exports = nextConfig;
