import { NextRequest, NextResponse } from 'next/server';
import { listAgents } from '@/lib/engine/agent';
import '@/lib/engine/init';

export async function GET(req: NextRequest) {
  try {
    const agents = listAgents();

    const activity = agents.flatMap((agent) =>
      agent.currentTasks.map((task) => ({
        timestamp: task.startedAt || task.completedAt || new Date(),
        agentId: agent.id,
        agentName: agent.name,
        taskId: task.id,
        description: task.description,
        status: task.status,
        result: task.result,
      }))
    );

    // Sort by most recent
    activity.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ activity: activity.slice(0, 50) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get activity' },
      { status: 500 }
    );
  }
}
