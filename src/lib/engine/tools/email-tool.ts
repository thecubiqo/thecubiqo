import { Tool, ToolContext, ToolResult } from '@/types/tool';

interface EmailToolParams {
    to: string;
    subject: string;
    body: string;
}

export const emailSendTool: Tool = {
    id: 'email_send',
    name: 'Send Email',
    description: 'Send an email using Resend API.',
    parameters: {
        type: 'object',
        properties: {
            to: {
                type: 'string',
                description: 'Recipient email address',
            },
            subject: {
                type: 'string',
                description: 'Email subject',
            },
            body: {
                type: 'string',
                description: 'Email body (text or HTML)',
            },
        },
        required: ['to', 'subject', 'body'],
    },
    execute: async (params: any, context: ToolContext): Promise<ToolResult> => {
        try {
            const { to, subject, body } = params;
            const apiKey = process.env.RESEND_API_KEY;

            if (!apiKey) {
                return {
                    success: false,
                    output: '',
                    error: 'RESEND_API_KEY is not set. Cannot send email.',
                };
            }

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    from: 'CubiQo Agent <onboarding@resend.dev>', // Default for testing, user should configure domain
                    to: [to],
                    subject,
                    html: body,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    output: '',
                    error: `Resend API error: ${data.message || response.statusText}`,
                };
            }

            return {
                success: true,
                output: `Email sent to ${to}. ID: ${data.id}`,
            };
        } catch (error: any) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Failed to send email',
            };
        }
    },
};
