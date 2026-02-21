/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      // Stub out optional packages that are not installed
      // These are used in code paths that gracefully handle their absence at runtime
      'dockerode': './src/lib/stubs/optional-package.ts',
      'ioredis': './src/lib/stubs/optional-package.ts',
      '@xterm/xterm': './src/lib/stubs/optional-package.ts',
      '@xterm/addon-fit': './src/lib/stubs/optional-package.ts',
    },
  },
  // Mark optional server-side packages as external so they are not bundled
  serverExternalPackages: ['dockerode', 'ioredis'],
};

module.exports = nextConfig;