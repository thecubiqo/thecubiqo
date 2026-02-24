import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // framer-motion v12 ships motion-dom and motion-utils as separate ESM
  // packages. Without transpilePackages, Next.js creates a vendor-chunk
  // reference that is never written to disk, causing a 500 ISE at runtime.
  transpilePackages: ['framer-motion', 'motion-dom', 'motion-utils'],
};

export default nextConfig;
