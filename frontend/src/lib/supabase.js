import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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
