import { getAgent } from '../engine/agent';

export interface VoiceCommand {
  transcript: string;
  intent?: 'spawn' | 'chat' | 'status' | 'stop';
  agentId?: string;
  task?: string;
}

export async function parseVoiceCommand(transcript: string): Promise<VoiceCommand> {
  const lower = transcript.toLowerCase();
  
  // Spawn patterns
  if (lower.includes('spawn') || lower.includes('create agent') || lower.includes('start task')) {
    const agentMatch = lower.match(/spawn\s+(\w+)/);
    const agentId = agentMatch ? agentMatch[1] : 'dev';
    
    // Extract task description (everything after "to")
    const taskMatch = transcript.match(/to\s+(.+)$/i);
    const task = taskMatch ? taskMatch[1] : transcript;
    
    return {
      transcript,
      intent: 'spawn',
      agentId,
      task,
    };
  }
  
  // Status patterns
  if (lower.includes('status') || lower.includes('what are') || lower.includes('how many')) {
    return {
      transcript,
      intent: 'status',
    };
  }
  
  // Stop patterns
  if (lower.includes('stop') || lower.includes('cancel') || lower.includes('halt')) {
    return {
      transcript,
      intent: 'stop',
    };
  }
  
  // Default: chat with henry
  return {
    transcript,
    intent: 'chat',
    agentId: 'henry',
  };
}

export async function handleVoiceCommand(command: VoiceCommand): Promise<string> {
  switch (command.intent) {
    case 'spawn':
      if (!command.agentId || !command.task) {
        return 'I need an agent and a task to spawn.';
      }
      
      const agent = getAgent(command.agentId);
      if (!agent) {
        return `Agent ${command.agentId} not found.`;
      }
      
      const { runId } = await agent.spawn(command.task);
      return `Task spawned on ${agent.name}. Run ID: ${runId}`;
      
    case 'status':
      const { listAgents } = await import('../engine/agent');
      const agents = listAgents();
      
      const activeCount = agents.filter((a) => a.status === 'running').length;
      const totalTasks = agents.reduce((sum, a) => sum + a.currentTasks.length, 0);
      
      return `${agents.length} agents online. ${activeCount} running. ${totalTasks} active tasks.`;
      
    case 'stop':
      // TODO: Implement stop logic
      return 'Stop functionality not yet implemented.';
      
    case 'chat':
    default:
      const chatAgent = getAgent(command.agentId || 'henry');
      if (!chatAgent) {
        return 'No agent available to chat.';
      }
      
      const response = await chatAgent.run(command.transcript);
      return response;
  }
}
