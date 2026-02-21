/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['dockerode', 'ssh2', 'ioredis'],
};

module.exports = nextConfig;
