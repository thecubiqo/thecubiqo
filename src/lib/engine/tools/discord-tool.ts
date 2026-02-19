import { Tool, ToolContext, ToolResult } from '@/types/tool';

interface DiscordToolParams {
    channelId: string;
    message: string;
}

export const discordSendTool: Tool = {
    id: 'discord_send',
    name: 'Send Discord Message',
    description: 'Send a message to a Discord channel.',
    parameters: {
        type: 'object',
        properties: {
            channelId: {
                type: 'string',
                description: 'Discord Channel ID (snowflake ID)',
            },
            message: {
                type: 'string',
                description: 'Text message to send',
            },
        },
        required: ['channelId', 'message'],
    },
    execute: async (params: any, context: ToolContext): Promise<ToolResult> => {
        try {
            const { channelId, message } = params;
            const token = process.env.DISCORD_BOT_TOKEN;

            if (!token) {
                return {
                    success: false,
                    output: '',
                    error: 'DISCORD_BOT_TOKEN is not set.',
                };
            }

            const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bot ${token}`,
                },
                body: JSON.stringify({
                    content: message,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    output: '',
                    error: `Discord API error: ${JSON.stringify(data) || response.statusText}`,
                };
            }

            return {
                success: true,
                output: `Message sent to Discord channel ${channelId}: ${data.id}`,
            };
        } catch (error: any) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Failed to send Discord message',
            };
        }
    },
};
