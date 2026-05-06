import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

const cleanEnv = (...values) => {
  const value = values.find(Boolean);
  return value
    ? value.trim().replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
    : undefined;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, process.env.REACT_APP_SUPABASE_ANON_KEY, process.env.SUPABASE_ANON_KEY)
  },
  transpilePackages: ['three'],
  turbopack: {
    root: rootDir
  },
  experimental: {
    externalDir: true
  }
};

export default nextConfig;
