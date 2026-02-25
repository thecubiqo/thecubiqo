import { NextRequest, NextResponse } from 'next/server';
import { listAgents } from '@/lib/engine/agent';
import '@/lib/engine/init';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const agents = listAgents();
    
    // Get all sessions across all agents
    const allSessions = await Promise.all(
      agents.map(agent => agent.listSessions())
    );
    const sessions = allSessions.flat();
    
    // Aggregate token usage
    const totalTokensInput = sessions.reduce((sum, s) => sum + (s.tokenUsage?.input || 0), 0);
    const totalTokensOutput = sessions.reduce((sum, s) => sum + (s.tokenUsage?.output || 0), 0);
    const totalCost = sessions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
    
    // Calculate usage by agent
    const byAgent = agents.map(agent => {
      const agentSessions = sessions.filter(s => s.agentId === agent.id);
      const inputTokens = agentSessions.reduce((sum, s) => sum + (s.tokenUsage?.input || 0), 0);
      const outputTokens = agentSessions.reduce((sum, s) => sum + (s.tokenUsage?.output || 0), 0);
      const cost = agentSessions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
      
      return {
        agentId: agent.id,
        agentName: agent.name,
        model: agent.model.model,
        sessions: agentSessions.length,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        cost,
      };
    }).filter(a => a.sessions > 0); // Only include agents with sessions
    
    return NextResponse.json({
      usage: {
        totalTokens: {
          input: totalTokensInput,
          output: totalTokensOutput,
          total: totalTokensInput + totalTokensOutput,
        },
        totalCost,
        byAgent,
        totalSessions: sessions.length,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Admin usage error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch usage stats',
        usage: {
          totalTokens: { input: 0, output: 0, total: 0 },
          totalCost: 0,
          byAgent: [],
          totalSessions: 0,
        },
      },
      { status: 500 }
    );
  }
}
