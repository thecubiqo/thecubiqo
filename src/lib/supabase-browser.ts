'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    __CUBIQO_ENV__?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    };
  }
}

let browserClient: SupabaseClient | null = null;

function clean(value?: string) {
  return value
    ? value.trim().replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
    : '';
}

function getAuthStorageKey(url: string) {
  try {
    const projectRef = new URL(url).hostname.split('.')[0];
    return projectRef ? `sb-${projectRef}-auth-token` : undefined;
  } catch {
    return undefined;
  }
}

export function getBrowserSupabase() {
  if (browserClient) return browserClient;
  const runtimeEnv = typeof window !== 'undefined' ? window.__CUBIQO_ENV__ : undefined;
  const url = clean(runtimeEnv?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(runtimeEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) return null;
  browserClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: getAuthStorageKey(url)
    }
  });
  return browserClient;
}

export async function getAccessToken() {
  const supabase = getBrowserSupabase();
  if (!supabase) return '';
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
