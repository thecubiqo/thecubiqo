/**
 * Browser Queue API Endpoint
 * 
 * GET /api/browser/queue - Get queue status
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Day 5: Browser API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBrowserQueue } from '@/lib/browser/BrowserQueue';
import { getBrowserPool } from '@/lib/browser/BrowserPool';

/**
 * GET - Get queue and pool status
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createClient();
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

    // Get queue status
    const queue = getBrowserQueue();
    const queueStatus = queue.getQueueStatus(user.id);

    // Get pool stats
    const pool = getBrowserPool();
    const poolStats = pool.getStats();

    // Get user's pending consents
    const { searchParams } = new URL(request.url);
    const includePending = searchParams.get('includePending') === 'true';

    let pendingSessions = [];
    if (includePending) {
      // Get user's pending sessions from database
      const { data: sessions, error } = await supabase
        .from('browser_sessions')
        .select('id, url, purpose, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (!error && sessions) {
        pendingSessions = sessions;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        queue: {
          pending: queueStatus.pending,
          active: queueStatus.active,
          completed: queueStatus.completed,
          userPosition: queueStatus.userPosition,
        },
        pool: {
          total: poolStats.total,
          inUse: poolStats.inUse,
          available: poolStats.available,
          healthy: poolStats.healthy,
          unhealthy: poolStats.unhealthy,
        },
        pendingSessions: includePending ? pendingSessions : undefined,
      },
    });
  } catch (error) {
    console.error('[Browser Queue API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
