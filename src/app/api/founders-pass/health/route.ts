// API: Health endpoint
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '2.0.0',
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    services: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      oauth_encryption: !!process.env.OAUTH_ENCRYPTION_KEY,
    },
  };

  return NextResponse.json(health);
}
