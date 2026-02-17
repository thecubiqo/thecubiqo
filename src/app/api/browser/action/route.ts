/**
 * Browser Action API Endpoint
 * 
 * POST /api/browser/action - Execute browser action
 * GET /api/browser/action?sessionId=xxx - Get action history
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Day 5: Browser API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Request validation schema
const executeActionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  actionType: z.enum([
    'navigate',
    'click',
    'type',
    'screenshot',
    'scrape',
    'fill-form',
    'wait',
    'scroll',
    'extract',
  ]),
  target: z.string().optional(),
  data: z.any().optional(),
});

/**
 * POST - Execute browser action
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
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

    // Parse and validate request body
    const body = await request.json();
    const validation = executeActionSchema.safeParse(body);

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

    const { sessionId, actionType, target, data } = validation.data;

    // Verify session exists and belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('browser_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check session is active
    if (session.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Session is not active' },
        { status: 400 }
      );
    }

    // TODO: Execute actual browser action
    // For now, just log the action
    const actionResult = {
      success: true,
      result: 'Action simulated (browser integration pending)',
      timestamp: Date.now(),
    };

    // Log action to database
    await supabase.from('browser_actions').insert({
      session_id: sessionId,
      user_id: user.id,
      action_type: actionType,
      target: target || null,
      result: JSON.stringify(actionResult.result),
      success: actionResult.success,
      error: actionResult.success ? null : 'Simulated error',
      metadata: data || {},
    });

    return NextResponse.json({
      success: true,
      data: actionResult,
    });
  } catch (error) {
    console.error('[Browser Action API] POST error:', error);
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
 * GET - Get action history for session
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
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

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('browser_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get actions for session
    const { data: actions, error: actionsError } = await supabase
      .from('browser_actions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (actionsError) {
      throw actionsError;
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        actions: actions.map((action) => ({
          id: action.id,
          actionType: action.action_type,
          target: action.target,
          result: action.result,
          success: action.success,
          error: action.error,
          createdAt: action.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[Browser Action API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
