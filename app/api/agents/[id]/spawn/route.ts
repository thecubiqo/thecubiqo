import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/engine/agent';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { task, label } = await req.json();

    if (!task) {
      return NextResponse.json(
        { error: 'Missing task' },
        { status: 400 }
      );
    }

    const agent = getAgent(id);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${id}` },
        { status: 404 }
      );
    }

    const result = await agent.spawn(task, label);

    return NextResponse.json({ ...result, status: 'accepted' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Spawn failed' },
      { status: 500 }
    );
  }
}
