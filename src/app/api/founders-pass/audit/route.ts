// API: Audit log
import { NextRequest, NextResponse } from 'next/server';
import { listAuditLog } from '@/lib/founders-pass/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const log = await listAuditLog(limit);
    return NextResponse.json({ log });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
