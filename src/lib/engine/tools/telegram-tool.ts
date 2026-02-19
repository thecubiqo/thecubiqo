
import { Tool, ToolContext, ToolResult } from '@/types/tool';
import { TelegramClient } from '@/lib/integrations/telegram';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * telegram_send tool - Send a message to a Telegram chat
 */
export const telegramSendTool: Tool = {
    id: 'telegram_send',
    name: 'Send Telegram Message',
    description: 'Send a message to a specific Telegram user or group via the bot.',
    parameters: {
        type: 'object',
        properties: {
            chatId: {
                type: 'string',
                description: 'Telegram Chat ID (numeric ID or @channelname)'
            },
            text: {
                type: 'string',
                description: 'Message content to send'
            },
        },
        required: ['chatId', 'text'],
    },
    execute: async (params, context): Promise<ToolResult> => {
        try {
            const { chatId, text } = params;

            if (!TELEGRAM_BOT_TOKEN) {
                return {
                    success: false,
                    output: '',
                    error: 'Telegram Bot Token not configured in environment variables',
                };
            }

            const client = new TelegramClient(TELEGRAM_BOT_TOKEN);
            await client.sendMessage(chatId, text);

            return {
                success: true,
                output: `Message sent to ${chatId}`,
            };
        } catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Failed to send Telegram message',
            };
        }
    },
};
