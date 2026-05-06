import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { cubiqoTools } from '@/next/lib/ai/cubiqo-tools';

export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: process.env.AI_GATEWAY_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-5.4',
    system:
      'You are CubiQo in QA. Be concise, conversational, and self-aware about the app stack when asked. Use tools when runtime or RGY classification facts are needed.',
    messages: await convertToModelMessages(messages),
    tools: cubiqoTools,
    stopWhen: stepCountIs(5)
  });

  return result.toUIMessageStreamResponse();
}
