/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {
    root: '.',
    resolveAlias: {
      // Stub out optional packages that are not installed
      // These are used in code paths that gracefully handle their absence at runtime
      'dockerode': './src/lib/stubs/optional-package.ts',
      'ioredis': './src/lib/stubs/optional-package.ts',
      '@xterm/xterm': './src/lib/stubs/optional-package.ts',
      '@xterm/addon-fit': './src/lib/stubs/optional-package.ts',
    },
  },
  // Server-only packages that should not be bundled by Turbopack/webpack
  serverExternalPackages: ['dockerode', 'ioredis'],
};

module.exports = nextConfig;