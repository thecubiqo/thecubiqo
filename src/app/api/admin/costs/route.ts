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
    
    // Calculate total cost
    const totalCost = sessions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
    
    // Group by agent
    const byAgent = agents.map(agent => {
      const agentSessions = sessions.filter(s => s.agentId === agent.id);
      const cost = agentSessions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
      const inputTokens = agentSessions.reduce((sum, s) => sum + (s.tokenUsage?.input || 0), 0);
      const outputTokens = agentSessions.reduce((sum, s) => sum + (s.tokenUsage?.output || 0), 0);
      
      return {
        agentId: agent.id,
        agentName: agent.name,
        model: agent.model.model,
        cost,
        sessions: agentSessions.length,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        percentage: totalCost > 0 ? (cost / totalCost * 100).toFixed(2) : '0.00',
      };
    }).filter(a => a.cost > 0) // Only include agents with costs
      .sort((a, b) => b.cost - a.cost); // Sort by cost descending
    
    // Group by model
    const modelMap = new Map<string, {
      model: string;
      cost: number;
      sessions: number;
      tokens: { input: number; output: number; total: number };
      agents: string[];
    }>();
    
    for (const session of sessions) {
      const agent = agents.find(a => a.id === session.agentId);
      if (!agent) continue;
      
      const modelName = agent.model.model;
      const existing = modelMap.get(modelName) || {
        model: modelName,
        cost: 0,
        sessions: 0,
        tokens: { input: 0, output: 0, total: 0 },
        agents: [],
      };
      
      existing.cost += session.estimatedCost || 0;
      existing.sessions += 1;
      existing.tokens.input += session.tokenUsage?.input || 0;
      existing.tokens.output += session.tokenUsage?.output || 0;
      existing.tokens.total += (session.tokenUsage?.input || 0) + (session.tokenUsage?.output || 0);
      
      if (!existing.agents.includes(agent.name)) {
        existing.agents.push(agent.name);
      }
      
      modelMap.set(modelName, existing);
    }
    
    const byModel = Array.from(modelMap.values())
      .map(m => ({
        ...m,
        percentage: totalCost > 0 ? (m.cost / totalCost * 100).toFixed(2) : '0.00',
      }))
      .sort((a, b) => b.cost - a.cost); // Sort by cost descending
    
    return NextResponse.json({
      costs: {
        total: totalCost,
        byAgent,
        byModel,
        totalSessions: sessions.length,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Admin costs error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch cost breakdown',
        costs: {
          total: 0,
          byAgent: [],
          byModel: [],
          totalSessions: 0,
        },
      },
      { status: 500 }
    );
  }
}
