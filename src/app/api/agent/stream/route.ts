import { NextRequest } from 'next/server';
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  repoListRoutes,
  repoReadFile,
  repoSearch,
  repoStackSummary,
  runtimeStatus
} from '@/next/lib/ai/repo-inspection';
import { capabilityPlanForText } from '@/next/lib/ai/capability-map';
import {
  contentBriefCreate,
  dashboardSummary,
  journalRead,
  journalWriteSummary,
  memoryRead,
  memoryWriteSafeSummary,
  rgySignalRead,
  rgySignalWrite,
  taskPlanCreate
} from '@/next/lib/ai/user-context-tools';
import { webSearch, searchConfigured } from '../../_lib/web-search';

export const maxDuration = 55;
export const runtime = 'nodejs';

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  return header.match(/^Bearer\s+(.+)$/i)?.[1] || '';
}

const goalTerms = ['linkedin', 'career', 'yoga', 'wellness', 'build', 'ship', 'launch', 'job', 'resume', 'routine', 'business', 'pod'];
const casualTerms = ['instagram', 'facebook', 'fb', 'insta', 'comfort', 'chat', 'friends', 'mood', 'movie'];
const gatedTerms = ['grindr', 'tinder', 'adult', 'explicit', 'nsfw', 'hookup'];

function hits(input: string, terms: string[]) {
  const lower = input.toLowerCase();
  return terms.filter(t => lower.includes(t));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const message = String(body.message || '').trim();
  if (!message) {
    return new Response(JSON.stringify({ error: 'message required' }), { status: 400 });
  }

  const authToken = getBearerToken(request);
  const history: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(body.history) ? body.history : [];

  // Resolve model: OpenAI key → OpenRouter (OpenAI-compatible) → bare string fallback
  const openaiKey = (process.env['OPENAI_API_KEY'] || '').trim();
  const orKey = (process.env['OPENROUTER_API_KEY'] || process.env['OPENROUTER_KEY'] || '').trim();
  const model = openaiKey
    ? createOpenAI({ apiKey: openaiKey })(process.env['OPENAI_MODEL'] || 'gpt-4.1-mini')
    : orKey
    ? createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: orKey })(process.env['OPENROUTER_MODEL'] || 'anthropic/claude-3.5-sonnet')
    : createOpenAI({ apiKey: 'placeholder' })('gpt-4.1-mini'); // will fail gracefully

  const systemPrompt = [
    'You are CubiQo — a calm, deeply intelligent personal AI. You are curious, warm, and precise.',
    'You are a companion for thinking, planning, building, and growing.',
    'Use tools for real-time or factual information; never invent facts.',
    'Respond in 2–5 sentences. Be specific, not generic. Be honest, not merely reassuring.',
    'Never use filler phrases like "Great question", "Certainly", or "Absolutely".',
    'For repo or system questions, use inspection tools. For live info, use web_search.',
    'Write: journal summaries, RGY capsules, memory summaries only. Other actions need user confirmation.',
  ].join(' ');

  const historyMessages = history.slice(-8).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }));

  const result = streamText({
    model,
    temperature: 0.7,
    system: systemPrompt,
    messages: [...historyMessages, { role: 'user' as const, content: message }],
    tools: {
      runtime_status: tool({
        description: 'Check live CubiQo runtime and stack state.',
        inputSchema: z.object({}),
        execute: async () => runtimeStatus()
      }),
      repo_stack_summary: tool({
        description: 'Inspect package.json, framework, and routes.',
        inputSchema: z.object({}),
        execute: async () => repoStackSummary()
      }),
      repo_list_routes: tool({
        description: 'List Next.js routes.',
        inputSchema: z.object({}),
        execute: async () => repoListRoutes()
      }),
      repo_search: tool({
        description: 'Search repo files for a phrase.',
        inputSchema: z.object({ query: z.string().min(2).max(80) }),
        execute: async ({ query }) => repoSearch(query)
      }),
      repo_read_file: tool({
        description: 'Read one repo file by relative path.',
        inputSchema: z.object({ path: z.string().min(1).max(180) }),
        execute: async ({ path }) => repoReadFile(path)
      }),
      classify_rgy: tool({
        description: 'Classify text into RGY bands.',
        inputSchema: z.object({ text: z.string().min(1).max(2000) }),
        execute: async ({ text }) => ({
          green: hits(text, goalTerms),
          yellow: hits(text, casualTerms),
          red: hits(text, gatedTerms)
        })
      }),
      capability_plan: tool({
        description: 'Map user needs to CubiQo V1/V2 capabilities.',
        inputSchema: z.object({ text: z.string().min(1).max(3000) }),
        execute: async ({ text }) => capabilityPlanForText(text)
      }),
      dashboard_summary: tool({
        description: 'Read signed-in user dashboard state.',
        inputSchema: z.object({}),
        execute: async () => dashboardSummary(authToken)
      }),
      journal_read: tool({
        description: 'Read recent journal entries.',
        inputSchema: z.object({ limit: z.number().int().min(1).max(10).optional() }),
        execute: async ({ limit }) => journalRead(authToken, limit || 5)
      }),
      journal_write_summary: tool({
        description: 'Save a journal summary.',
        inputSchema: z.object({
          title: z.string().max(120).optional(),
          summary: z.string().min(1).max(4000),
          tags: z.array(z.string().max(40)).max(10).optional()
        }),
        execute: async (input) => journalWriteSummary(authToken, input)
      }),
      rgy_signal_read: tool({
        description: 'Read saved RGY signals.',
        inputSchema: z.object({ limit: z.number().int().min(1).max(25).optional() }),
        execute: async ({ limit }) => rgySignalRead(authToken, limit || 12)
      }),
      rgy_signal_write: tool({
        description: 'Save an RGY capsule.',
        inputSchema: z.object({
          color: z.enum(['green', 'yellow', 'red']),
          keyword: z.string().min(1).max(80),
          suggestedIntents: z.array(z.enum(['socialize', 'collaborate', 'trade'])).max(3).optional(),
          confirmedIntents: z.array(z.enum(['socialize', 'collaborate', 'trade'])).max(3).optional()
        }),
        execute: async (input) => rgySignalWrite(authToken, input)
      }),
      memory_read: tool({
        description: 'Read user conversation memory.',
        inputSchema: z.object({ limit: z.number().int().min(1).max(12).optional() }),
        execute: async ({ limit }) => memoryRead(authToken, limit || 6)
      }),
      memory_write_safe_summary: tool({
        description: 'Save a safe memory summary.',
        inputSchema: z.object({ summary: z.string().min(1).max(4000) }),
        execute: async ({ summary }) => memoryWriteSafeSummary(authToken, summary)
      }),
      task_plan_create: tool({
        description: 'Create an in-session task plan.',
        inputSchema: z.object({ goal: z.string().min(1).max(500), horizon: z.string().max(80).optional() }),
        execute: async (input) => taskPlanCreate(input)
      }),
      content_brief_create: tool({
        description: 'Create an in-session creative brief.',
        inputSchema: z.object({
          topic: z.string().min(1).max(500),
          channel: z.string().max(80).optional(),
          audience: z.string().max(120).optional()
        }),
        execute: async (input) => contentBriefCreate(input)
      }),
      web_search: tool({
        description: 'Search the live internet for real-time information, current events, job market data, company research.',
        inputSchema: z.object({
          query: z.string().min(2).max(200),
          maxResults: z.number().int().min(1).max(10).optional()
        }),
        execute: async ({ query, maxResults }) => {
          if (!searchConfigured()) return { error: 'No search API configured', results: [], provider: 'none' };
          return webSearch(query, maxResults || 5);
        }
      }),
      parallel_web_search: tool({
        description: 'Run multiple web searches in parallel for multi-angle research.',
        inputSchema: z.object({ queries: z.array(z.string().min(2).max(200)).min(1).max(4) }),
        execute: async ({ queries }) => {
          if (!searchConfigured()) return { error: 'No search API configured', searches: [] };
          const searches = await Promise.all(queries.map(async q => { const r = await webSearch(q, 5); return { query: q, results: r.results, provider: r.provider, error: r.error }; }));
          return { searches, totalResults: searches.reduce((n, s) => n + s.results.length, 0) };
        }
      })
    }
  });

  return (result as any).toUIMessageStreamResponse?.() ?? result.toTextStreamResponse();
}
