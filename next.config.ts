import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore - Next 16 experimental types might be missing
    turbopack: {
      root: process.cwd(),
    }
  }
};

export default nextConfig;
