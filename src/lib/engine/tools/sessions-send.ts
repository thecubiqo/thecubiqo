import { Tool, ToolContext, ToolResult } from '@/types/tool';

/**
 * sessions_send tool - Send a message to another agent session
 * 
 * Allows agents to coordinate by sending messages to each other.
 * Messages are delivered directly to the target agent's session.
 */
export const sessionsSendTool: Tool = {
  id: 'sessions_send',
  name: 'Send Message to Agent',
  description: 'Send a message to another agent session for coordination. Returns confirmation when delivered.',
  parameters: {
    type: 'object',
    properties: {
      targetAgentId: {
        type: 'string',
        description: 'Target agent ID (e.g., "henry", "dev", "qa")',
      },
      message: {
        type: 'string',
        description: 'Message content to send to the target agent',
      },
      sessionId: {
        type: 'string',
        description: 'Specific session ID (optional - uses main session if omitted)',
      },
    },
    required: ['targetAgentId', 'message'],
  },

  execute: async (params, context): Promise<ToolResult> => {
    const { targetAgentId, message, sessionId } = params;

    try {
      console.log(`[sessions_send] ${context.agentId} → ${targetAgentId}: ${message.substring(0, 50)}...`);

      // Dynamically import to avoid circular dependencies
      const { getAgent } = await import('../agent');
      const targetAgent = getAgent(targetAgentId);

      if (!targetAgent) {
        console.error(`[sessions_send] Agent not found: ${targetAgentId}`);
        return {
          success: false,
          output: '',
          error: `Agent not found: ${targetAgentId}. Available agents: ${await getAvailableAgents()}`,
        };
      }

      // If no sessionId provided, use/create main session
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        const sessions = await targetAgent.listSessions();
        if (sessions.length > 0) {
          // Use the most recent session
          const sortedSessions = sessions.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
          );
          targetSessionId = sortedSessions[0].id;
        }
      }

      // Format message with sender information
      const formattedMessage = `[Message from agent:${context.agentId}]\n${message}`;

      // Send message to target agent
      const response = await targetAgent.run(formattedMessage, targetSessionId);

      console.log(`[sessions_send] Message delivered. Response: ${response.substring(0, 100)}...`);

      return {
        success: true,
        output: JSON.stringify({
          status: 'delivered',
          targetAgentId,
          targetSessionId,
          response,
          timestamp: new Date().toISOString(),
        }, null, 2),
      };
    } catch (error) {
      console.error(`[sessions_send] Error:`, error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Failed to send message to agent',
      };
    }
  },
};

/**
 * Helper to get list of available agents
 */
async function getAvailableAgents(): Promise<string> {
  try {
    const { listAgents } = await import('../agent');
    const agents = listAgents();
    return agents.map(a => a.id).join(', ') || 'none';
  } catch {
    return 'unknown';
  }
}
