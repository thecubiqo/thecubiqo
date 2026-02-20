/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbopack: {
      root: '.',
    },
  },
};

module.exports = nextConfig;
