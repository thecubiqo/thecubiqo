/**
 * Journey Consent Management API
 * Handle user opt-in/opt-out and retention preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/journey/consent
 * Get user's current consent status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current consent
    const { data: consent, error } = await (supabase as any)
      .from('journey_consents')
      .select('*')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('[Journey/Consent] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch consent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      consent: consent || null,
      hasConsent: !!consent,
      optedIn: consent?.opted_in || false,
    });

  } catch (error) {
    console.error('[Journey/Consent] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/journey/consent
 * Create or update consent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      optedIn, 
      retentionDays = 365,
      sessionId = null,
    } = body;

    if (typeof optedIn !== 'boolean') {
      return NextResponse.json(
        { error: 'optedIn must be a boolean' },
        { status: 400 }
      );
    }

    // Get current consent to see if one exists
    const { data: existingConsent } = await (supabase as any)
      .from('journey_consents')
      .select('id')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .single();

    let result;

    if (existingConsent) {
      // Update existing consent
      const { data, error } = await (supabase as any)
        .from('journey_consents')
        .update({
          opted_in: optedIn,
          retention_days: retentionDays,
          consented_at: optedIn ? new Date().toISOString() : null,
          revoked_at: optedIn ? null : new Date().toISOString(),
        })
        .eq('id', existingConsent.id)
        .select()
        .single();

      if (error) {
        console.error('[Journey/Consent] Update error:', error);
        return NextResponse.json(
          { error: 'Failed to update consent' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new consent
      const { data, error } = await (supabase as any)
        .from('journey_consents')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          opted_in: optedIn,
          retention_days: retentionDays,
          consented_at: optedIn ? new Date().toISOString() : null,
          consent_version: 'v1.0',
          metadata: {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent'),
          },
        })
        .select()
        .single();

      if (error) {
        console.error('[Journey/Consent] Insert error:', error);
        return NextResponse.json(
          { error: 'Failed to create consent' },
          { status: 500 }
        );
      }

      result = data;
    }

    // If opting out, log it
    if (!optedIn) {
      await (supabase as any)
        .from('journey_rollback_logs')
        .insert({
          user_id: user.id,
          action_type: 'revoke_consent',
          affected_count: 0,
          reason: 'User revoked consent',
          performed_by: 'user',
        });
    }

    return NextResponse.json({
      consent: result,
      success: true,
    });

  } catch (error) {
    console.error('[Journey/Consent] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/journey/consent
 * Revoke consent and optionally delete all memories
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deleteMemories = searchParams.get('deleteMemories') === 'true';

    // Revoke consent
    const { error: revokeError } = await (supabase as any)
      .from('journey_consents')
      .update({
        opted_in: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .is('revoked_at', null);

    if (revokeError) {
      console.error('[Journey/Consent] Revoke error:', revokeError);
      return NextResponse.json(
        { error: 'Failed to revoke consent' },
        { status: 500 }
      );
    }

    let deletedCount = 0;

    // Delete memories if requested
    if (deleteMemories) {
      const { data: memories } = await (supabase as any)
        .from('journey_memories')
        .select('id')
        .eq('user_id', user.id);

      if (memories) {
        deletedCount = memories.length;

        const { error: deleteError } = await (supabase as any)
          .from('journey_memories')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('[Journey/Consent] Delete memories error:', deleteError);
        }
      }
    }

    // Log the action
    await (supabase as any)
      .from('journey_rollback_logs')
      .insert({
        user_id: user.id,
        action_type: deleteMemories ? 'delete_all_and_revoke' : 'revoke_consent',
        affected_count: deletedCount,
        reason: 'User revoked consent via API',
        performed_by: 'user',
      });

    return NextResponse.json({
      success: true,
      consentRevoked: true,
      memoriesDeleted: deleteMemories,
      deletedCount,
    });

  } catch (error) {
    console.error('[Journey/Consent] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
