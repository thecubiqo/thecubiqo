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

    return NextResponse.json({ 
      tasks: agent.currentTasks,
      status: agent.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get tasks' },
      { status: 500 }
    );
  }
}
