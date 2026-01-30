import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable gzip compression
  compress: true,

  // Experimental features
  experimental: {
    // Optimize server components
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
