import { anthropic } from '@ai-sdk/anthropic';
import { stepCountIs, streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;
export const runtime = 'nodejs';

const SYSTEM = `You are CubiQo — a multi-surface AI companion. You are agentic: think in steps, use tools when they help, observe results, keep going until the task is done. Be direct and genuinely useful. Never say you can't do something without first trying the relevant tool.`;

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages ?? [];

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM,
    messages,
    tools: {
      webSearch: tool({
        description: 'Search the web for current information, news, prices, or anything time-sensitive.',
        inputSchema: z.object({
          query: z.string().describe('The search query'),
        }),
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
          readable:
            new Date().toLocaleString('en-GB', {
              timeZone: 'UTC',
              dateStyle: 'full',
              timeStyle: 'short',
            }) + ' UTC',
        }),
      }),

      calculate: tool({
        description: 'Evaluate a safe mathematical expression and return the result.',
        inputSchema: z.object({
          expression: z.string().describe('A numeric expression, e.g. "12 * 450 / 100"'),
        }),
        execute: async ({ expression }) => {
          if (!/^[0-9\s+\-*/.()\[\]%^]+$/.test(expression)) {
            return { error: 'Only numeric expressions allowed.' };
          }
          try {
            const result = Function(`"use strict"; return (${expression})`)();
            return { result: String(result) };
          } catch {
            return { error: 'Could not evaluate expression.' };
          }
        },
      }),
    },
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
}
