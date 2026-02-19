import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/engine/agent';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { agentId, forceCompact = false, keepRecentCount = 10 } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    // Get agent
    const agent = getAgent(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${agentId}` },
        { status: 404 }
      );
    }

    // Get session store (accessing private property - not ideal but works)
    const sessionStore = (agent as any).sessionStore;
    
    // Verify session exists
    try {
      await sessionStore.get(sessionId);
    } catch (error) {
      return NextResponse.json(
        { error: `Session not found: ${sessionId}` },
        { status: 404 }
      );
    }

    // Perform compaction
    const result = await sessionStore.compactSession(
      sessionId,
      agent.model,
      { keepRecentCount, forceCompact }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          message: 'Compaction not needed',
          reason: 'Token threshold not reached',
          stats: {
            currentTokens: result.originalTokens,
            messageCount: result.messagesBefore,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session compacted successfully',
      stats: {
        messagesBefore: result.messagesBefore,
        messagesAfter: result.messagesAfter,
        originalTokens: result.originalTokens,
        compactedTokens: result.compactedTokens,
        tokensSaved: result.tokensSaved,
        savingsPercent: ((result.tokensSaved / result.originalTokens) * 100).toFixed(1),
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compact session' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId query parameter is required' },
        { status: 400 }
      );
    }

    const agent = getAgent(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${agentId}` },
        { status: 404 }
      );
    }

    const sessionStore = (agent as any).sessionStore;
    
    // Verify session exists
    try {
      await sessionStore.get(sessionId);
    } catch (error) {
      return NextResponse.json(
        { error: `Session not found: ${sessionId}` },
        { status: 404 }
      );
    }

    // Get token stats
    const stats = sessionStore.getTokenStats(sessionId);
    const needsCompaction = sessionStore.needsCompaction(sessionId, agent.model.model);

    return NextResponse.json({
      sessionId,
      stats,
      needsCompaction,
      model: agent.model.model,
    });
  } catch (error) {
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stats' },
      { status: 500 }
    );
  }
}
