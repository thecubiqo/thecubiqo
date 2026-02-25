/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['dockerode', 'ssh2', 'ioredis', 'googleapis', 'docker-modem'],
  // Tell Next.js to use src directory for app router
  dir: './src'
};

module.exports = nextConfig;