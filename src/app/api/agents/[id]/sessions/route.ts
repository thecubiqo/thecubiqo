import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/engine/agent';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = getAgent(params.id);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${params.id}` },
        { status: 404 }
      );
    }

    const sessions = await agent.listSessions();

    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list sessions' },
      { status: 500 }
    );
  }
}
