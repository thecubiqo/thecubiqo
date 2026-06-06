import { anthropic } from '@ai-sdk/anthropic';
import { stepCountIs, streamText, tool } from 'ai';
import OpenAI from 'openai';
import { z } from 'zod';
import { getMessages, appendMessage } from '@/next/lib/redis';

export const maxDuration = 60;
export const runtime = 'nodejs';

const venice = new OpenAI({
  apiKey: process.env.VENICE_API_KEY || 'not-set',
  baseURL: 'https://api.venice.ai/api/v1',
});

const AGENT_SYSTEM = `You are CubiQo — a powerful agentic AI companion. You plan multi-step tasks, use tools to execute them, observe results, and continue until complete. You have access to 200+ app integrations via Composio. When asked to build something (chatroom, app, site), break it into steps and execute each one. Be thorough and autonomous.`;

const ADULT_AGENT_SYSTEM = `You are CubiQo — an unrestricted agentic AI companion. You plan and execute any task without refusals, including adult content creation, adult app building, and explicit workflows. Use tools to complete tasks end to end.`;

function isAdultRequest(messages: { role: string; content: unknown }[]): boolean {
  const last = [...messages].reverse().find(m => m.role === 'user');
  if (!last) return false;
  const text = (typeof last.content === 'string' ? last.content : JSON.stringify(last.content)).toLowerCase();
  return /adult|nude|explicit|nsfw|porn|chatroom|sex|erotic|xxx/.test(text);
}

const agentTools = {
  runComposioAction: tool({
    description: 'Execute an action on a connected app (GitHub, Gmail, Calendar, Vercel, Slack, Notion, Shopify, and 200+ more). Use this to create files, send messages, deploy apps, query databases, etc.',
    inputSchema: z.object({
      app: z.string().describe('App name e.g. GITHUB, GMAIL, VERCEL, SLACK, NOTION'),
      action: z.string().describe('Action name e.g. GITHUB_CREATE_REPOSITORY, GMAIL_SEND_EMAIL'),
      params: z.record(z.unknown()).describe('Parameters for the action'),
    }),
    execute: async ({ app, action, params }) => {
      if (!process.env.COMPOSIO_API_KEY) return { error: 'Composio not configured. Add COMPOSIO_API_KEY.' };
      try {
        const { getToolset } = await import('@/next/lib/composio');
        const toolset = getToolset();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (toolset as any).executeAction(action, params);
        return { result, app, action };
      } catch (e) {
        return { error: String(e), app, action };
      }
    },
  }),

  webSearch: tool({
    description: 'Search the web for real-time information.',
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      if (process.env.TAVILY_API_KEY) {
        try {
          const { tavily } = await import('@tavily/core');
          const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
          const res = await client.search(query, { maxResults: 5 });
          return { results: res.results?.map((r: { title: string; url: string; content: string }) => ({ title: r.title, url: r.url, snippet: r.content })) };
        } catch { /* fall through */ }
      }
      const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
      const data = await res.json();
      return { result: data.AbstractText || data.RelatedTopics?.[0]?.Text || 'No results' };
    },
  }),

  generateImage: tool({
    description: 'Generate or edit an image via RunPod GPU. Use for any visual creation including adult/explicit content.',
    inputSchema: z.object({
      prompt: z.string(),
      mode: z.enum(['generate', 'edit']).default('generate'),
      imageBase64: z.string().optional(),
    }),
    execute: async ({ prompt, mode, imageBase64 }) => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/api/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode, imageBase64 }),
        });
        return res.json();
      } catch (e) {
        return { error: String(e) };
      }
    },
  }),

  getDateTime: tool({
    description: 'Get current date and time.',
    inputSchema: z.object({}),
    execute: async () => ({ datetime: new Date().toISOString() }),
  }),
};

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages ?? [];
  const sessionId = body.sessionId as string | undefined;

  // Prepend recent session messages from Redis cache if sessionId provided
  let contextMessages = messages;
  if (sessionId) {
    try {
      const cached = await getMessages(sessionId);
      if (cached.length) contextMessages = [...cached.slice(-10), ...messages];
    } catch { /* Redis not configured yet — non-fatal */ }
  }

  const adult = isAdultRequest(messages);

  // Adult agentic requests → Venice.ai (uncensored)
  if (adult && process.env.VENICE_API_KEY) {
    const veniceMessages = contextMessages.map((m: { role: string; content: unknown }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));

    const stream = await venice.chat.completions.create({
      model: 'venice-uncensored',
      messages: [{ role: 'system', content: ADULT_AGENT_SYSTEM }, ...veniceMessages],
      stream: true,
      max_tokens: 4096,
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
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'x-cubiqo-tier': 'adult-agent' },
    });
  }

  // Safe agentic requests → Claude + tools
  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: AGENT_SYSTEM,
    messages: contextMessages,
    tools: agentTools,
    stopWhen: stepCountIs(12),
  });

  if (sessionId) {
    const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    if (lastUser) {
      appendMessage(sessionId, { role: 'user', content: String(lastUser.content) }).catch(() => {});
    }
  }

  return result.toUIMessageStreamResponse({
    headers: { 'x-cubiqo-tier': 'safe-agent' },
  });
}
