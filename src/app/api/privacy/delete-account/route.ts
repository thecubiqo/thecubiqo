/**
 * Privacy API: Delete User Account
 * 
 * GDPR Article 17 (Right to Erasure)
 * CCPA Section 1798.105 (Right to Delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { deleteUserData } from '@/lib/security/privacy';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
          setAll: () => {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = getClientIdentifier(request.headers, user.id);
    const rateLimit = await checkRateLimit(identifier, 'auth');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { immediate = false, reason } = body;

    // Confirm deletion (require explicit confirmation)
    if (!body.confirm) {
      return NextResponse.json(
        { 
          error: 'Deletion requires explicit confirmation',
          message: 'Please set "confirm": true in request body'
        },
        { status: 400 }
      );
    }

    // Check if MFA is required (for high-security accounts)
    // This would integrate with your MFA system
    // For now, we'll just log the deletion request

    // Log deletion request before actually deleting
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'account_deletion_requested',
      details: { immediate, reason },
      timestamp: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || '',
    });

    // Delete user data
    const result = await deleteUserData({
      userId: user.id,
      immediate,
      reason,
    });

    return NextResponse.json(
      {
        success: true,
        message: immediate 
          ? 'Your account and all associated data have been deleted.'
          : `Your account deletion has been scheduled for ${result.scheduledFor}. You can cancel this request within 30 days.`,
        ...result,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // POST method can be used to schedule deletion
  return DELETE(request);
}
