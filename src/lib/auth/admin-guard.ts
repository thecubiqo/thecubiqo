/**
 * Admin Auth Guard - Shared Higher-Order Function
 *
 * Provides a reusable admin authorization wrapper for Next.js API route handlers.
 * Eliminates duplicated auth checks across 13+ admin API routes by centralizing
 * the admin verification logic (supabase.auth.getUser() + profiles.is_admin check).
 *
 * Usage:
 *   import { withAdminAuth } from '@/lib/auth/admin-guard';
 *
 *   export const GET = withAdminAuth(async (request, { user, profile, supabase }) => {
 *     // Your admin-only logic here — user/profile already verified
 *     return NextResponse.json({ data: 'admin-only data' });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AdminContext {
  /** The authenticated Supabase user */
  user: { id: string; email?: string };
  /** The user's profile with admin status */
  profile: { email: string; is_admin: boolean };
  /** The authenticated Supabase client (reuse to avoid creating another) */
  supabase: SupabaseClient;
}

type AdminRouteHandler = (
  request: NextRequest,
  context: AdminContext
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps a route handler with admin authorization.
 *
 * Checks:
 * 1. User is authenticated (supabase.auth.getUser)
 * 2. User has a profile in the profiles table
 * 3. Profile has is_admin = true
 *
 * If any check fails, returns the appropriate 401/403/404 response.
 * Otherwise, passes the authenticated context to the inner handler.
 */
export function withAdminAuth(handler: AdminRouteHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const supabase = await createClient();

      // Step 1: Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Step 2: Check admin status from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, is_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }

      if (!profile.is_admin) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }

      // Step 3: Invoke the actual handler with admin context
      return await handler(request, {
        user: { id: user.id, email: user.email },
        profile: { email: profile.email || user.email || 'unknown', is_admin: true },
        supabase,
      });
    } catch (error) {
      console.error('[AdminGuard] Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
