import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type SupabaseAdminClient = any;

export type ApiUserContext = {
  supabase: SupabaseAdminClient;
  user: {
    id: string;
    email?: string | null;
  };
};

export const cleanEnv = (...values: Array<string | undefined>) => {
  const value = values.find(Boolean);
  return value
    ? value.trim().replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
    : undefined;
};

export const supabaseUrl = cleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_URL
);

export const supabaseAnonKey = cleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  process.env.SUPABASE_ANON_KEY
);

export const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

let cachedAdminClient: SupabaseAdminClient | null = null;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return cachedAdminClient;
}

export function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

export function safeTableMissing(error: { code?: string; message?: string } | null | undefined) {
  return Boolean(
    error &&
      (error.code === 'PGRST205' ||
        error.code === '42P01' ||
        /Could not find the table|relation .* does not exist/i.test(error.message || ''))
  );
}

export function jsonError(message: string, status = 500, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function requireApiUser(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      error: jsonError('Supabase server configuration is missing', 500)
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return {
      error: jsonError('Authentication required', 401)
    };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return {
      error: jsonError('Invalid session', 401)
    };
  }

  return {
    supabase,
    user: {
      id: data.user.id,
      email: data.user.email || null
    }
  } satisfies ApiUserContext;
}

export async function isAdminUser(supabase: SupabaseAdminClient, userId: string) {
  const { data, error } = await supabase
    .from('admin_roles')
    .select('role,revoked_at')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .in('role', ['owner', 'admin'])
    .maybeSingle();

  if (safeTableMissing(error)) {
    return { admin: false, migrationPending: true, error: null };
  }

  return {
    admin: Boolean(data),
    migrationPending: false,
    error: error?.message || null
  };
}

export async function requireAdminRequest(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { error: jsonError('Supabase server configuration is missing', 500) };
  }

  const expectedSecret = cleanEnv(process.env.ADMIN_SECRET);
  const providedSecret = request.headers.get('x-admin-secret') || '';
  if (expectedSecret && providedSecret === expectedSecret) {
    return { supabase, adminVia: 'secret' as const, user: null };
  }

  const auth = await requireApiUser(request);
  if ('error' in auth) return auth;

  const admin = await isAdminUser(auth.supabase, auth.user.id);
  if (!admin.admin) {
    return {
      error: NextResponse.json(
        { error: 'Admin access required', migrationPending: admin.migrationPending },
        { status: 403 }
      )
    };
  }

  return { supabase: auth.supabase, adminVia: 'user' as const, user: auth.user };
}

export function missingMigrationResponse(feature: string, table: string) {
  return NextResponse.json(
    {
      feature,
      migrationPending: true,
      error: `${table} is not available in Supabase yet. Apply the latest migration before this feature can save data.`
    },
    { status: 200 }
  );
}
