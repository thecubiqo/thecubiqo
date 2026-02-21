import { NextResponse } from 'next/server'
import { ENV } from '@/lib/config/env'

export async function GET() {
  // Don't expose in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const envInfo = {
    supabase: {
      url: ENV.supabase.url ? 'SET' : 'MISSING',
      urlLength: ENV.supabase.url?.length || 0,
      anonKey: ENV.supabase.anonKey ? 'SET' : 'MISSING',
      anonKeyLength: ENV.supabase.anonKey?.length || 0,
      anonKeyPrefix: ENV.supabase.anonKey?.substring(0, 20) || 'N/A',
      serviceRoleKey: ENV.supabase.serviceRoleKey ? 'SET' : 'MISSING',
      serviceRoleKeyLength: ENV.supabase.serviceRoleKey?.length || 0,
    },
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    rawEnvVars: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_URL1: process.env.NEXT_PUBLIC_SUPABASE_URL1 ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY1: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1 ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY1: process.env.SUPABASE_SERVICE_ROLE_KEY1 ? 'SET' : 'MISSING',
    }
  }

  return NextResponse.json(envInfo)
}