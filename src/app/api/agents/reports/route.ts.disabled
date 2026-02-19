import { NextRequest, NextResponse } from 'next/server';
import { getAgentReports } from '@/lib/engine/agent';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const reports = getAgentReports(agentId, limit);

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get agent reports' },
      { status: 500 }
    );
  }
}
