const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['dockerode', 'ssh2', 'ioredis', 'googleapis', 'docker-modem'],
};

module.exports = nextConfig;
