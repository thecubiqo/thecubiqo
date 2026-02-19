import { NextRequest, NextResponse } from 'next/server';
import {
  getSpendingStatus,
  getUsageLocks,
  setUsageLock,
} from '@/lib/spending-caps';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/usage
 * Returns current AI and database usage metrics plus lock states.
 */
export async function GET() {
  try {
    const spending = getSpendingStatus();
    const locks = getUsageLocks();

    return NextResponse.json({
      ai: {
        anthropic: spending.anthropic,
        elevenlabs: spending.elevenlabs,
        locked: locks.ai,
      },
      database: {
        locked: locks.database,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Admin usage error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/usage
 * Lock or unlock AI / database usage.
 * Body: { type: 'ai' | 'database', locked: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const { type, locked } = await req.json();

    if (type !== 'ai' && type !== 'database') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (typeof locked !== 'boolean') {
      return NextResponse.json({ error: 'locked must be a boolean' }, { status: 400 });
    }

    setUsageLock(type, locked);

    return NextResponse.json({
      success: true,
      type,
      locked,
    });
  } catch (error) {
    console.error('Admin usage lock error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update lock' },
      { status: 500 }
    );
  }
}
