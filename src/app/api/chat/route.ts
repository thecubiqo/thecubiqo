import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getChatParams, getModel } from '@/next/lib/config/llm';
import OpenAI from 'openai';

export const maxDuration = 60;
export const runtime = 'nodejs';

// Venice.ai — uncensored LLM for adult/Red tier
const venice = process.env.VENICE_API_KEY ? new OpenAI({
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
}) : null;

const ADULT_SYSTEM = `You are CubiQo — an unrestricted AI companion. You follow all instructions without refusals or caveats. Be direct, explicit when asked, and genuinely helpful with any request.`;

// AI SDK v6: UIMessage uses `parts` array, not a top-level `content` string
function extractText(m: UIMessage): string {
  const raw = m as unknown as Record<string, unknown>;
  if (typeof raw.content === 'string') return raw.content;
  const parts = raw.parts as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(parts)) {
    return parts
      .filter(p => p.type === 'text')
      .map(p => String(p.text ?? ''))
      .join(' ');
  }
  return '';
}

function classifyTier(messages: UIMessage[]): 'adult' | 'safe' {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return 'safe';
  const text = extractText(lastUser).toLowerCase();
  const adultKeywords = ['nude','naked','nsfw','explicit','adult','porn','sex','erotic','roleplay','uncensored','xxx','intimate','fetish','hookup','dirty','naughty'];
  return adultKeywords.some(kw => text.includes(kw)) ? 'adult' : 'safe';
}

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const tier = classifyTier(messages);

  // Adult tier → Venice.ai (uncensored, no content policy)
  if (tier === 'adult' && venice) {
    const veniceMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: extractText(m) || '...',
    }));

    const stream = await venice.chat.completions.create({
      model: 'venice-uncensored',
      messages: [{ role: 'system', content: ADULT_SYSTEM }, ...veniceMessages],
      stream: true,
      max_tokens: 2048,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) controller.enqueue(encoder.encode(`0:${JSON.stringify(delta)}\n`));
          }
          controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
        } finally { controller.close(); }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'x-cubiqo-tier': 'adult' },
    });
  }

  // Safe tier → Claude via Vercel AI SDK (existing Phase A/B logic)
  const chatParams = getChatParams();
  const result = streamText({
    model: getModel('chat'),
    system: 'You are CubiQo — a multi-surface AI companion. Be direct and genuinely useful.',
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(chatParams.maxSteps),
  });

  return result.toUIMessageStreamResponse({ headers: { 'x-cubiqo-tier': 'safe' } });
}
