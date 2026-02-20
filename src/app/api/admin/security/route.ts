import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/security
 * Returns security-related data including passkey counts, environment checks, and recent audit events
 */
export async function GET() {
  try {
    // Initialize response data with defaults
    let passkeyCount = 0;
    let recentEvents: any[] = [];
    let tablesAccessible = false;

    // Get environment variables
    const rpId = process.env.NEXT_PUBLIC_RP_ID || process.env.VERCEL_URL || 'localhost';
    const biometricStatus = process.env.NEXT_PUBLIC_RP_ID ? 'configured' : 'missing_env';

    // Connect to Supabase
    const supabase = await createClient();

    // Query passkey count from user_authenticators table
    try {
      const { count, error } = await (supabase as any)
        .from('user_authenticators')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error querying user_authenticators:', error);
      } else {
        passkeyCount = count || 0;
        tablesAccessible = true;
      }
    } catch (error) {
      console.error('Exception querying user_authenticators:', error);
    }

    // Query recent audit events
    try {
      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('id, user_email, action_type, ip_address, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error querying audit_logs:', error);
        recentEvents = [];
      } else {
        recentEvents = data || [];
      }
    } catch (error) {
      console.error('Exception querying audit_logs:', error);
      recentEvents = [];
    }

    // Build environment checks
    const envChecks = [
      {
        label: 'NEXT_PUBLIC_RP_ID is set',
        passed: !!process.env.NEXT_PUBLIC_RP_ID,
      },
      {
        label: 'SUPABASE_SERVICE_ROLE_KEY is set',
        passed: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      {
        label: 'Supabase tables accessible',
        passed: tablesAccessible,
      },
    ];

    // Return successful response
    return NextResponse.json({
      passkeyCount,
      rpId,
      biometricStatus,
      envChecks,
      recentEvents,
    });
  } catch (error) {
    // Global error handler
    console.error('Error in /api/admin/security:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        passkeyCount: 0,
        rpId: 'unknown',
        biometricStatus: 'missing_env',
        envChecks: [],
        recentEvents: [],
      },
      { status: 500 }
    );
  }
}
