/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Set turbopack root to fix workspace detection
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;