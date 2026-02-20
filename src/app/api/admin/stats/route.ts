import { NextRequest, NextResponse } from 'next/server';
import { listAgents } from '@/lib/engine/agent';
import '@/lib/engine/init';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const agents = listAgents();
    
    // Calculate stats
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'running').length;
    
    // Count active sessions across all agents
    const allSessions = await Promise.all(
      agents.map(agent => agent.listSessions())
    );
    const sessions = allSessions.flat();
    const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'idle').length;
    
    // Count total messages (memory)
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    
    // Get recent activity (last 10 session updates)
    const recentActivity = sessions
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10)
      .map(s => ({
        sessionId: s.id,
        agentId: s.agentId,
        channel: s.channel,
        status: s.status,
        messageCount: s.messageCount,
        updatedAt: s.updatedAt,
      }));
    
    // System health metrics
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const systemHealth = {
      status: 'healthy' as const,
      uptime: Math.floor(uptime),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      },
      cpu: process.cpuUsage(),
    };
    
    // Agent details
    const agentDetails = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      model: agent.model.model,
      activeTasks: agent.currentTasks.filter(t => t.status === 'running').length,
      totalTasks: agent.currentTasks.length,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    }));

    return NextResponse.json({
      stats: {
        totalAgents,
        activeAgents,
        activeSessions,
        totalMessages,
      },
      agents: agentDetails,
      recentActivity,
      systemHealth,
      timestamp: new Date(),
    });
  } catch (error) {
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
        stats: {
          totalAgents: 0,
          activeAgents: 0,
          activeSessions: 0,
          totalMessages: 0,
        },
        agents: [],
        recentActivity: [],
        systemHealth: { status: 'error' },
      },
      { status: 500 }
    );
  }
}
