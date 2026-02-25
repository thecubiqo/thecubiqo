import { NextRequest, NextResponse } from 'next/server';
import { createAgent, listAgents, getAgent, deleteAgent } from '@/lib/engine/agent';
import { AgentConfig } from '@/types/agent';
import '@/lib/engine/init'; // Auto-initialize agents

export async function GET(req: NextRequest) {
  try {
    const agents = listAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list agents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const config: AgentConfig = await req.json();

    // Validate required fields
    if (!config.id || !config.name || !config.model) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, model' },
        { status: 400 }
      );
    }

    const agent = await createAgent(config);

    return NextResponse.json({ agent: {
      id: agent.id,
      name: agent.name,
      model: agent.model,
      tools: agent.tools,
      status: agent.status,
      workspace: agent.workspace,
      createdAt: agent.createdAt,
    }});
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create agent' },
      { status: 500 }
    );
  }
}
