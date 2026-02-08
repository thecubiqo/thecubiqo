import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/engine/agent';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { prompt, sessionId } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    const agent = getAgent(params.id);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${params.id}` },
        { status: 404 }
      );
    }

    const response = await agent.run(prompt, sessionId);

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execution failed' },
      { status: 500 }
    );
  }
}
