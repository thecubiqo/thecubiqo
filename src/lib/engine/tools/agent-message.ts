import { Tool, ToolContext, ToolResult } from '@/types/tool';
import { MessageBus } from '../message-bus';

/**
 * agent_message tool - Direct agent-to-agent messaging
 *
 * Supports three actions:
 *   send   – Post a message to another agent's inbox (async, non-blocking)
 *   inbox  – Read your own inbox (optionally unread only)
 *   ack    – Mark a message (or all) as read
 */
export const agentMessageTool: Tool = {
  id: 'agent_message',
  name: 'Agent Messaging',
  description:
    'Send messages to other agents or read your inbox. Actions: "send" (to, subject, body), "inbox" (unreadOnly?), "ack" (messageId or "all").',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['send', 'inbox', 'ack'],
        description: 'Action to perform',
      },
      to: {
        type: 'string',
        description: 'Target agent ID (required for "send")',
      },
      subject: {
        type: 'string',
        description: 'Message subject (for "send")',
      },
      body: {
        type: 'string',
        description: 'Message body (for "send")',
      },
      unreadOnly: {
        type: 'boolean',
        description: 'If true, only return unread messages (for "inbox")',
      },
      messageId: {
        type: 'string',
        description: 'Message ID to acknowledge, or "all" (for "ack")',
      },
    },
    required: ['action'],
  },

  execute: async (params, context): Promise<ToolResult> => {
    const bus = MessageBus.getInstance();
    const { action } = params;

    try {
      switch (action) {
        case 'send': {
          const { to, subject = '(no subject)', body = '' } = params;
          if (!to) {
            return { success: false, output: '', error: '"to" is required for send action' };
          }
          const msg = bus.send(context.agentId, to, subject, body);
          return {
            success: true,
            output: JSON.stringify({
              status: 'sent',
              messageId: msg.id,
              to: msg.to,
              timestamp: msg.timestamp.toISOString(),
            }),
          };
        }

        case 'inbox': {
          const messages = bus.getInbox(context.agentId, params.unreadOnly ?? false);
          return {
            success: true,
            output: JSON.stringify(
              messages.map((m) => ({
                id: m.id,
                from: m.from,
                subject: m.subject,
                body: m.body,
                read: m.read,
                timestamp: m.timestamp.toISOString(),
              })),
              null,
              2,
            ),
          };
        }

        case 'ack': {
          const { messageId } = params;
          if (!messageId) {
            return { success: false, output: '', error: '"messageId" is required for ack action' };
          }
          if (messageId === 'all') {
            const count = bus.markAllRead(context.agentId);
            return { success: true, output: JSON.stringify({ acknowledged: count }) };
          }
          const ok = bus.markRead(context.agentId, messageId);
          return ok
            ? { success: true, output: JSON.stringify({ acknowledged: messageId }) }
            : { success: false, output: '', error: `Message not found: ${messageId}` };
        }

        default:
          return { success: false, output: '', error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'agent_message failed',
      };
    }
  },
};
