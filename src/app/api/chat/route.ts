import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';

export const maxDuration = 30;
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: process.env.AI_GATEWAY_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-5.4',
    system:
      'You are CubiQo in QA. Be concise and conversational. For repo self-inspection use /api/agent; this chat route is conversational only.',
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(3)
  });

  return result.toUIMessageStreamResponse();
}
