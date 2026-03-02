const path = require('path');

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
  outputFileTracingRoot: __dirname,
  experimental: {
    turbopack: {
      root: __dirname,
    },
  },
};

module.exports = nextConfig;
