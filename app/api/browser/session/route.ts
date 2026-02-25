/**
 * Browser Session API Endpoint
 * 
 * POST /api/browser/session - Create new browser session
 * GET /api/browser/session?sessionId=xxx - Get session status
 * DELETE /api/browser/session?sessionId=xxx - Cancel session
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Day 5: Browser API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBrowserQueue } from '@/lib/browser/BrowserQueue';
import { z } from 'zod';

// Request validation schema
const createSessionSchema = z.object({
  url: z.string().url('Invalid URL'),
  purpose: z.string().min(1, 'Purpose is required').max(500, 'Purpose too long'),
  priority: z.number().min(0).max(10).optional().default(5),
});

/**
 * POST - Create new browser session
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

    // Parse and validate request body
    const body = await request.json();
    const validation = createSessionSchema.safeParse(body);

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

    const { url, purpose, priority } = validation.data;

    // Sanitize inputs
    const sanitizedUrl = url.trim();
    const sanitizedPurpose = purpose.trim();

    // Extract domain for consent checking
    const domain = new URL(sanitizedUrl).hostname;

    // Enqueue session
    const queue = getBrowserQueue();
    const result = await queue.enqueue({
      id: crypto.randomUUID(),
      userId: user.id,
      url: sanitizedUrl,
      purpose: sanitizedPurpose,
      priority,
    });

    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 429 } // Too Many Requests
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.id,
        position: result.position,
        domain,
      },
    });
  } catch (error) {
    console.error('[Browser Session API] POST error:', error);
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
 * GET - Get session status
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

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      // Return user's queue status
      const queue = getBrowserQueue();
      const status = queue.getQueueStatus(user.id);

      return NextResponse.json({
        success: true,
        data: status,
      });
    }

    // Get specific session
    const queue = getBrowserQueue();
    const session = queue.getSession(sessionId);

    if (!session) {
      // Try to get from database
      const { data: dbSession, error } = await supabase
        .from('browser_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error || !dbSession) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: dbSession.id,
          url: dbSession.url,
          purpose: dbSession.purpose,
          status: dbSession.status,
          createdAt: dbSession.created_at,
          completedAt: dbSession.completed_at,
        },
      });
    }

    // Verify session belongs to user
    if (session.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        url: session.url,
        purpose: session.purpose,
        status: session.status,
        priority: session.priority,
        createdAt: session.createdAt,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        error: session.error,
      },
    });
  } catch (error) {
    console.error('[Browser Session API] GET error:', error);
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
 * DELETE - Cancel session
 */
export async function DELETE(request: NextRequest) {
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

    // Get session to verify ownership
    const queue = getBrowserQueue();
    const session = queue.getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify session belongs to user
    if (session.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Cancel session
    const cancelled = await queue.cancelSession(sessionId);

    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel active or completed session' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { sessionId, cancelled: true },
    });
  } catch (error) {
    console.error('[Browser Session API] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
