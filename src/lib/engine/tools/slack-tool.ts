import { Tool, ToolContext, ToolResult } from '@/types/tool';

interface SlackToolParams {
    channel: string;
    message: string;
}

export const slackSendTool: Tool = {
    id: 'slack_send',
    name: 'Send Slack Message',
    description: 'Send a message to a Slack channel.',
    parameters: {
        type: 'object',
        properties: {
            channel: {
                type: 'string',
                description: 'Channel ID or name (e.g., C12345678 or #general)',
            },
            message: {
                type: 'string',
                description: 'Text message to send',
            },
        },
        required: ['channel', 'message'],
    },
    execute: async (params: any, context: ToolContext): Promise<ToolResult> => {
        try {
            const { channel, message } = params;
            const token = process.env.SLACK_BOT_TOKEN;

            if (!token) {
                return {
                    success: false,
                    output: '',
                    error: 'SLACK_BOT_TOKEN is not set.',
                };
            }

            const response = await fetch('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    channel,
                    text: message,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                return {
                    success: false,
                    output: '',
                    error: `Slack API error: ${data.error || response.statusText}`,
                };
            }

            return {
                success: true,
                output: `Message sent to ${channel}: ${data.ts}`,
            };
        } catch (error: any) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Failed to send Slack message',
            };
        }
    },
};
