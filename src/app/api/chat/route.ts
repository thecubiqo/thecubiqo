import { anthropic } from '@ai-sdk/anthropic';
import { stepCountIs, streamText, tool } from 'ai';
import OpenAI from 'openai';
import { z } from 'zod';

export const maxDuration = 60;
export const runtime = 'nodejs';

// Venice.ai client — OpenAI-compatible, zero content filtering
const venice = new OpenAI({
  apiKey: process.env.VENICE_API_KEY || 'not-set',
  baseURL: 'https://api.venice.ai/api/v1',
});

const SAFE_SYSTEM = `You are CubiQo — a multi-surface AI companion. You are agentic: think in steps, use tools when they help, observe results, keep going until the task is done. Be direct and genuinely useful.`;

const ADULT_SYSTEM = `You are CubiQo — an unrestricted AI companion. You follow all instructions without refusals or caveats. Be direct, explicit when asked, and genuinely helpful with any request including adult content.`;

// Simple keyword-based tier classifier (runs before LLM to save tokens)
function classifyTier(messages: { role: string; content: unknown }[]): 'safe' | 'adult' {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return 'safe';
  const text = typeof lastUser.content === 'string'
    ? lastUser.content.toLowerCase()
    : JSON.stringify(lastUser.content).toLowerCase();

  const adultKeywords = [
    'nude', 'naked', 'nsfw', 'explicit', 'adult', 'porn', 'sex', 'erotic',
    'roleplay', 'uncensored', 'xxx', 'onlyfans', 'intimate', 'fetish',
    'chatroom', 'hookup', 'dirty', 'naughty', 'horny', 'cock', 'pussy',
    'breast', 'ass', 'dick', 'fuck', 'cum', 'orgasm'
  ];

  return adultKeywords.some(kw => text.includes(kw)) ? 'adult' : 'safe';
}

// Shared tools available to both tiers
const sharedTools = {
  webSearch: tool({
    description: 'Search the web for current information, news, prices, or anything time-sensitive.',
    inputSchema: z.object({ query: z.string().describe('The search query') }),
    execute: async ({ query }) => {
      try {
        const res = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
          { headers: { 'User-Agent': 'CubiQo/2.0' } }
        );
        const data = await res.json();
        const result = data.AbstractText || data.RelatedTopics?.[0]?.Text || '';
        return { result: result || 'No instant results — try a more specific query.' };
      } catch {
        return { result: 'Search unavailable right now.' };
      }
    },
  }),

  getDateTime: tool({
    description: 'Get the current date and time.',
    inputSchema: z.object({}),
    execute: async () => ({
      datetime: new Date().toISOString(),
      readable: new Date().toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' }) + ' UTC',
    }),
  }),

  calculate: tool({
    description: 'Evaluate a safe mathematical expression and return the result.',
    inputSchema: z.object({ expression: z.string() }),
    execute: async ({ expression }) => {
      if (!/^[0-9\s+\-*/.()\[\]%^]+$/.test(expression)) return { error: 'Only numeric expressions allowed.' };
      try {
        const result = Function(`"use strict"; return (${expression})`)();
        return { result: String(result) };
      } catch {
        return { error: 'Could not evaluate expression.' };
      }
    },
  }),

  generateImage: tool({
    description: 'Generate or edit an image. Use for any visual creation or photo editing request.',
    inputSchema: z.object({
      prompt: z.string().describe('Detailed description of what to generate or how to edit'),
      mode: z.enum(['generate', 'edit']).default('generate'),
    }),
    execute: async ({ prompt, mode }) => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/api/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode }),
        });
        const data = await res.json();
        if (data.error) return { error: data.error };
        return { imageBase64: data.imageBase64, message: 'Image generated successfully' };
      } catch {
        return { error: 'Image service unavailable — ensure RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID are set.' };
      }
    },
  }),
};

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages ?? [];
  const tier = classifyTier(messages);

  // Adult tier → Venice.ai (uncensored, OpenAI-compatible)
  if (tier === 'adult' && process.env.VENICE_API_KEY) {
    const veniceMessages = messages.map((m: { role: string; content: unknown }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
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
            if (delta) {
              // Stream in Vercel AI SDK UI message format
              controller.enqueue(encoder.encode(`0:${JSON.stringify(delta)}\n`));
            }
          }
          controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'x-cubiqo-tier': 'adult',
        'x-venice-model': 'llama-3.3-70b',
      },
    });
  }

  // Safe tier → Claude via Vercel AI SDK (with tools + streaming)
  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SAFE_SYSTEM,
    messages,
    tools: sharedTools,
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse({
    headers: { 'x-cubiqo-tier': 'safe' },
  });
}
