/**
 * Browser Consent API Endpoint
 * 
 * POST /api/browser/consent/approve - Approve consent request
 * POST /api/browser/consent/deny - Deny consent request
 * GET /api/browser/consent/history - Get consent history
 * DELETE /api/browser/consent/clear - Clear remembered consent for domain
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Day 5: Browser API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConsentManager } from '@/lib/browser/consent-manager';
import { z } from 'zod';

// Request validation schemas
const approveConsentSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  remember: z.boolean().optional().default(false),
  reason: z.string().optional(),
});

const denyConsentSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  reason: z.string().optional(),
});

const clearConsentSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
});

/**
 * POST - Approve or deny consent
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = (await createClient()) as any;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get action from path
    const { pathname } = new URL(request.url);
    const action = pathname.split('/').pop(); // 'approve' or 'deny'

    // Parse request body
    const body = await request.json();

    const consentManager = getConsentManager();

    if (action === 'approve') {
      // Validate approve request
      const validation = approveConsentSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validation.error.issues,
          },
          { status: 400 }
        );
      }

      const { requestId, remember, reason } = validation.data;

      // Approve consent
      const result = await consentManager.approveConsent(
        requestId,
        remember,
        reason
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { requestId, approved: true, remember },
      });
    } else if (action === 'deny') {
      // Validate deny request
      const validation = denyConsentSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validation.error.issues,
          },
          { status: 400 }
        );
      }

      const { requestId, reason } = validation.data;

      // Deny consent
      const result = await consentManager.denyConsent(requestId, reason);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { requestId, approved: false },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Browser Consent API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get consent history
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = (await createClient()) as any;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get optional domain filter
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || undefined;

    // Get consent history
    const consentManager = getConsentManager();
    const history = await consentManager.getConsentHistory(user.id, domain);

    return NextResponse.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error('[Browser Consent API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear remembered consent for domain
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = (await createClient()) as any;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = clearConsentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { domain } = validation.data;

    // Clear remembered consent
    const consentManager = getConsentManager();
    const result = await consentManager.clearRememberedConsent(user.id, domain);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { domain, cleared: true },
    });
  } catch (error) {
    console.error('[Browser Consent API] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
