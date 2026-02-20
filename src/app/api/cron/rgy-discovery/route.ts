import { NextRequest, NextResponse } from 'next/server';
import { runOpportunityDiscoveryForAllUsers } from '@/lib/rgy-matching/discovery-service';

/**
 * GET /api/cron/rgy-discovery
 * Cron endpoint to run RGY opportunity discovery for all active subscribers
 * 
 * This should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
 * Security: Verify authorization token from cron service
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization - only allow requests from authorized cron services
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.warn('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting RGY opportunity discovery cron job');
    const startTime = Date.now();

    // Run discovery for all users
    const results = await runOpportunityDiscoveryForAllUsers();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Opportunity discovery completed',
      results: {
        total_users: results.total,
        successful: results.successful,
        failed: results.failed,
        duration_ms: duration,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in RGY discovery cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/rgy-discovery
 * Alternative endpoint for POST requests from some cron services
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
