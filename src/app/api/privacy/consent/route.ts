/**
 * Privacy API: Manage User Consent
 * 
 * GDPR Article 7 (Conditions for consent)
 * CCPA Section 1798.120 (Right to Opt-Out)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserConsent, updateUserConsent } from '@/lib/security/privacy';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
          setAll: () => { },
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
    const rateLimit = await checkRateLimit(identifier, 'AUTH');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // Get user consent
    const consent = await getUserConsent(user.id);

    return NextResponse.json(
      { consent },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error('Error getting user consent:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve consent' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
          setAll: () => { },
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
    const rateLimit = await checkRateLimit(identifier, 'AUTH');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { analytics, marketing, dataProcessing, thirdPartySharing } = body;

    // Validate consent object
    if (typeof analytics !== 'boolean' && analytics !== undefined) {
      return NextResponse.json(
        { error: 'Invalid consent values' },
        { status: 400 }
      );
    }

    // Update user consent
    await updateUserConsent(user.id, {
      analytics,
      marketing,
      dataProcessing,
      thirdPartySharing,
    });

    // Get updated consent
    const consent = await getUserConsent(user.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Consent preferences updated',
        consent,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error('Error updating user consent:', error);
    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}
