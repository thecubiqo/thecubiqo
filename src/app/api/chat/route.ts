import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getChatParams, getModel } from '@/next/lib/config/llm';

export const maxDuration = 30;
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const chatParams = getChatParams();

  const result = streamText({
    model: getModel('chat'),
    system:
      'You are CubiQo in QA. Be concise and conversational. For repo self-inspection use /api/agent; this chat route is conversational only.',
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(chatParams.maxSteps)
  });

  return result.toUIMessageStreamResponse();
}
