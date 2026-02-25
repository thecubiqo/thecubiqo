import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/engine/agent';

/**
 * POST /api/agents/[id]/message
 * 
 * Send a message to an agent from another agent or external system.
 * Used for agent-to-agent coordination and communication.
 * 
 * Body:
 *   - message: string (required) - Message content to send
 *   - fromAgentId: string (optional) - Source agent ID for tracking
 *   - sessionId: string (optional) - Target session ID (uses main if omitted)
 * 
 * Returns:
 *   - response: Agent's response to the message
 *   - sessionId: Session used for the interaction
 *   - timestamp: When the message was delivered
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetAgentId } = await params;
    const { message, fromAgentId, sessionId } = await req.json();

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get target agent
    const agent = getAgent(targetAgentId);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${targetAgentId}` },
        { status: 404 }
      );
    }



    // Determine session to use
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const sessions = await agent.listSessions();
      if (sessions.length > 0) {
        // Use most recent session
        const sortedSessions = sessions.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );
        targetSessionId = sortedSessions[0].id;
      }
    }

    // Format message with sender info if provided
    const formattedMessage = fromAgentId
      ? `[Message from agent:${fromAgentId}]\n${message}`
      : message;

    // Send message to agent
    const response = await agent.run(formattedMessage, targetSessionId);

    

    return NextResponse.json({
      success: true,
      response,
      targetAgentId,
      sessionId: targetSessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send message',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/[id]/message
 * 
 * Check if agent is available for messaging.
 * Returns agent status and available sessions.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const agent = getAgent(agentId);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${agentId}` },
        { status: 404 }
      );
    }

    const sessions = await agent.listSessions();

    return NextResponse.json({
      agentId,
      status: agent.status,
      available: agent.status !== 'error',
      sessionCount: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id,
        status: s.status,
        messageCount: s.messageCount,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get agent status',
      },
      { status: 500 }
    );
  }
}
