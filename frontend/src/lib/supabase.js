import { createClient } from '@supabase/supabase-js';

const cleanEnv = (...values) => {
  const value = values.find(Boolean);
  return value
    ? value.trim().replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
    : undefined;
};

const buildEnv = typeof process !== 'undefined' && process.env ? process.env : {};
const browserEnv = typeof window !== 'undefined' && window.__CUBIQO_ENV__ ? window.__CUBIQO_ENV__ : {};

const SUPABASE_URL = cleanEnv(
  browserEnv.NEXT_PUBLIC_SUPABASE_URL,
  buildEnv.NEXT_PUBLIC_SUPABASE_URL,
  buildEnv.REACT_APP_SUPABASE_URL,
  buildEnv.SUPABASE_URL
);
const SUPABASE_ANON_KEY = cleanEnv(
  browserEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  buildEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  buildEnv.REACT_APP_SUPABASE_ANON_KEY,
  buildEnv.SUPABASE_ANON_KEY
);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabaseConfigError = {
  message: 'Supabase is not configured for this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
};

const disabledQuery = {
  select() { return disabledQuery; },
  eq() { return disabledQuery; },
  order() { return disabledQuery; },
  limit() { return Promise.resolve({ data: [], error: supabaseConfigError }); },
  insert() { return Promise.resolve({ data: null, error: supabaseConfigError }); },
  upsert() { return Promise.resolve({ data: null, error: supabaseConfigError }); }
};

const disabledSupabaseClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe() {}
        }
      }
    }),
    signInWithPassword: () => Promise.resolve({ data: null, error: supabaseConfigError }),
    signUp: () => Promise.resolve({ data: null, error: supabaseConfigError }),
    signOut: () => Promise.resolve({ error: null })
  },
  from: () => disabledQuery
};

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : disabledSupabaseClient;
