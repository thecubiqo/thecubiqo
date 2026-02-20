import { Tool, ToolContext, ToolResult } from '@/types/tool';
import OpenAI from 'openai';

interface VisionToolParams {
    imageUrl: string;
    prompt?: string;
}

export const visionTool: Tool = {
    id: 'vision_analyze',
    name: 'Analyze Image',
    description: 'Analyze an image using GPT-4o Vision. Provide a URL and an optional prompt.',
    parameters: {
        type: 'object',
        properties: {
            imageUrl: {
                type: 'string',
                description: 'URL of the image to analyze (http/https or data:image/...)',
            },
            prompt: {
                type: 'string',
                description: 'Question or instruction for the vision model (default: "Describe this image")',
            },
        },
        required: ['imageUrl'],
    },
    execute: async (params: any, context: ToolContext): Promise<ToolResult> => {
        try {
            const { imageUrl, prompt = 'Describe this image in detail.' } = params;

            if (!process.env.OPENAI_API_KEY) {
                return {
                    success: false,
                    output: '',
                    error: 'OPENAI_API_KEY is not set. Cannot use vision tool.',
                };
            }

            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 1000,
            });

            const analysis = response.choices[0]?.message?.content || 'No analysis returned.';

            return {
                success: true,
                output: analysis,
            };
        } catch (error: any) {
            
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Vision analysis failed',
            };
        }
    },
};
