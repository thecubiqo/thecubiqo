import { NextRequest, NextResponse } from 'next/server';
import { streamText, tool, stepCountIs } from 'ai';
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
import {
  analyzeJobDescription,
  resumeGapCheck,
  buildApplicationChecklist,
  coverLetterBrief,
  interviewPrepKit,
  buildJobSearchQueries
} from '@/next/lib/ai/career-tools';
import { webSearch, searchConfigured } from '../../_lib/web-search';

export const maxDuration = 55;
export const runtime = 'nodejs';

// ─── Career context detection ─────────────────────────────────────────────────

const CAREER_TERMS = [
  'job', 'jobs', 'resume', 'cv', 'career', 'apply', 'application', 'hire', 'hiring',
  'interview', 'linkedin', 'ba', 'business analyst', 'analyst', 'product owner', 'scrum',
  'salary', 'offer', 'recruiter', 'ats', 'jd', 'job description', 'cover letter',
  'remote', 'opportunity', 'role', 'position', 'work', 'employed', 'employment'
];

function isCareerContext(text: string): boolean {
  const lower = text.toLowerCase();
  return CAREER_TERMS.some(t => lower.includes(t));
}

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

// ─── System prompts ───────────────────────────────────────────────────────────

const BASE_PROMPT = [
  'You are CubiQo — a calm, deeply intelligent personal AI. You are curious, warm, and precise.',
  'You are a companion for thinking, planning, building, and growing.',
  'Use tools for real-time or factual information; never invent facts.',
  'Respond in 2–5 natural sentences. Be specific, not generic. Be honest, not merely reassuring.',
  'Never use filler phrases like "Great question", "Certainly", or "Absolutely".',
  'For repo or system questions, use inspection tools. For live info, use web_search.',
  'Write: journal summaries, RGY capsules, memory summaries only — no other external actions without confirmation.',
].join(' ');

const CAREER_ADDENDUM = [
  '',
  'CAREER COACHING MODE ACTIVE: This user is working on job search, resume, or career goals.',
  'Act as a sharp, experienced Career Coach with deep knowledge of the BA/PM job market.',
  'Always lead with the most actionable next step. Be specific about the role, the company, or the skill.',
  'When given a job description: call jd_analyze immediately. When given a profile + JD: call resume_gap_check.',
  'For job searches: call job_search_queries AND web_search in parallel if search is configured.',
  'Prioritise: (1) resume tailoring, (2) ATS keyword alignment, (3) company research, (4) interview prep.',
  'Never give generic advice. Reference specific skills, companies, platforms, or tools the user mentioned.',
  'If the user seems overwhelmed, give them ONE concrete next step and explain why it matters most.',
].join(' ');

// ─── Fallback via converse ────────────────────────────────────────────────────

async function fallbackConverse(message: string, history: { role: string; content: string }[], careerMode: boolean) {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/converse`
        : 'http://localhost:3002/api/converse',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: history.slice(-6) })
      }
    );
    if (!res.ok) throw new Error(`converse ${res.status}`);
    const data = await res.json();
    const text = data.response || "I'm here and thinking through this with you. What's the most pressing part?";
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(enc.encode(`data: {"type":"start"}\n\n`));
        controller.enqueue(enc.encode(`data: {"type":"text-delta","delta":${JSON.stringify(text)}}\n\n`));
        controller.enqueue(enc.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`));
        controller.enqueue(enc.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch {
    const fallbackText = careerMode
      ? "I'm focused on your job search. Share a job description or tell me what role you're targeting and I'll help you tailor your approach."
      : "I'm here. Say a bit more and I'll shape it into a clear next move.";
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(enc.encode(`data: {"type":"start"}\n\n`));
        controller.enqueue(enc.encode(`data: {"type":"text-delta","delta":${JSON.stringify(fallbackText)}}\n\n`));
        controller.enqueue(enc.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`));
        controller.enqueue(enc.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const message = String(body.message || '').trim();
  if (!message) {
    return new Response(JSON.stringify({ error: 'message required' }), { status: 400 });
  }

  const authToken = getBearerToken(request);
  const history: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(body.history) ? body.history : [];
  const careerMode = isCareerContext(message) || isCareerContext(history.slice(-3).map(h => h.content).join(' '));

  // Resolve model
  const openaiKey = (process.env['OPENAI_API_KEY'] || '').trim();
  const orKey = (process.env['OPENROUTER_API_KEY'] || process.env['OPENROUTER_KEY'] || '').trim();

  if (!openaiKey && !orKey) {
    return fallbackConverse(message, history, careerMode);
  }

  let model;
  try {
    model = openaiKey
      ? createOpenAI({ apiKey: openaiKey })(process.env['OPENAI_MODEL'] || 'gpt-4.1-mini')
      : createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: orKey })(
          process.env['OPENROUTER_MODEL'] || 'anthropic/claude-3.5-sonnet'
        );
  } catch {
    return fallbackConverse(message, history, careerMode);
  }

  const systemPrompt = careerMode ? BASE_PROMPT + CAREER_ADDENDUM : BASE_PROMPT;
  const historyMessages = history.slice(-8).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }));

  try {
    const result = streamText({
      model: model as any,
      temperature: 0.7,
      stopWhen: stepCountIs(4),
      system: systemPrompt,
      messages: [...historyMessages, { role: 'user' as const, content: message }],
      tools: {
        // ── System tools ──────────────────────────────────────────────────────
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

        // ── User context (auth-gated) ─────────────────────────────────────────
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

        // ── Planning tools ────────────────────────────────────────────────────
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

        // ── Web search ────────────────────────────────────────────────────────
        web_search: tool({
          description: 'Search the live internet — job postings, company research, salary data, news.',
          inputSchema: z.object({
            query: z.string().min(2).max(200),
            maxResults: z.number().int().min(1).max(10).optional()
          }),
          execute: async ({ query, maxResults }) => {
            if (!searchConfigured()) return { error: 'No search API configured. Add TAVILY_API_KEY or BRAVE_SEARCH_API_KEY to .env.local for live job search.', results: [], provider: 'none' };
            return webSearch(query, maxResults || 5);
          }
        }),
        parallel_web_search: tool({
          description: 'Run multiple web searches in parallel — use for multi-angle job research.',
          inputSchema: z.object({ queries: z.array(z.string().min(2).max(200)).min(1).max(4) }),
          execute: async ({ queries }) => {
            if (!searchConfigured()) return { error: 'No search API configured', searches: [] };
            const searches = await Promise.all(queries.map(async q => { const r = await webSearch(q, 5); return { query: q, results: r.results, provider: r.provider, error: r.error }; }));
            return { searches, totalResults: searches.reduce((n, s) => n + s.results.length, 0) };
          }
        }),

        // ── Career tools (no API key needed) ─────────────────────────────────
        jd_analyze: tool({
          description: 'Analyze a job description: extract required skills, ATS keywords, seniority, red flags, and application strategy. Call this whenever the user shares a JD.',
          inputSchema: z.object({
            jdText: z.string().min(50).max(8000).describe('The raw job description text')
          }),
          execute: async ({ jdText }) => analyzeJobDescription(jdText)
        }),
        resume_gap_check: tool({
          description: 'Compare user profile/resume against a JD analysis. Returns match score, strong matches, gaps, quick wins, and resume additions. Call after jd_analyze.',
          inputSchema: z.object({
            userProfile: z.string().min(20).max(5000).describe('User resume or profile text'),
            jdTitle: z.string().max(200).optional(),
            jdRequiredSkills: z.array(z.string()).describe('Required skills from jd_analyze'),
            jdAtsKeywords: z.array(z.string()).describe('ATS keywords from jd_analyze')
          }),
          execute: async ({ userProfile, jdTitle, jdRequiredSkills, jdAtsKeywords }) => {
            const jdAnalysis = {
              title: jdTitle || 'Role',
              seniority: 'Mid-level', workStyle: 'Remote',
              requiredSkills: jdRequiredSkills,
              niceToHave: [], atsKeywords: jdAtsKeywords,
              responsibilities: [], redFlags: [],
              estimatedSalary: '', applicationStrategy: ''
            };
            return resumeGapCheck(userProfile, jdAnalysis);
          }
        }),
        application_checklist: tool({
          description: 'Generate a prioritized application checklist for a specific role and platform (LinkedIn, Greenhouse, Workday, etc.).',
          inputSchema: z.object({
            roleTitle: z.string().min(2).max(200),
            company: z.string().max(200).optional(),
            platform: z.enum(['linkedin', 'indeed', 'greenhouse', 'lever', 'workday', 'direct', 'other']).default('other'),
            gapCount: z.number().int().min(0).max(30).default(3)
          }),
          execute: async ({ roleTitle, company, platform, gapCount }) =>
            buildApplicationChecklist(roleTitle, company || '', platform, gapCount)
        }),
        cover_letter_brief: tool({
          description: 'Generate a structured cover letter brief with hook, proof points, fit statement, and closing action.',
          inputSchema: z.object({
            roleTitle: z.string().min(2).max(200),
            company: z.string().max(200).optional(),
            strongMatches: z.array(z.string()).default([]),
            gaps: z.array(z.string()).default([]),
            yearsExp: z.number().int().min(0).max(40).default(5)
          }),
          execute: async ({ roleTitle, company, strongMatches, gaps, yearsExp }) =>
            coverLetterBrief(roleTitle, company || '', strongMatches, gaps, yearsExp)
        }),
        interview_prep: tool({
          description: 'Generate role-specific interview prep: behavioural, technical questions, and smart questions to ask the interviewer.',
          inputSchema: z.object({
            roleTitle: z.string().min(2).max(200),
            requiredSkills: z.array(z.string()).default([]),
            seniority: z.enum(['Junior', 'Mid-level', 'Senior', 'Senior Leadership']).default('Mid-level')
          }),
          execute: async ({ roleTitle, requiredSkills, seniority }) =>
            interviewPrepKit(roleTitle, requiredSkills, seniority)
        }),
        job_search_queries: tool({
          description: 'Build optimized job search queries with LinkedIn and Indeed direct links. Use before web_search for job hunting.',
          inputSchema: z.object({
            role: z.string().min(2).max(200).default('Business Analyst'),
            location: z.enum(['remote', 'usa', 'hybrid']).default('remote'),
            skills: z.array(z.string()).default(['Agile', 'SQL', 'Jira']),
            seniority: z.enum(['junior', 'mid', 'senior', 'any']).default('mid')
          }),
          execute: async ({ role, location, skills, seniority }) =>
            buildJobSearchQueries(role, location, skills, seniority)
        }),
      }
    });

    // Get the raw AI SDK stream
    const rawResponse: Response = (result as any).toUIMessageStreamResponse?.() ?? result.toTextStreamResponse();

    // Wrap with an error-interceptor: if the FIRST content event is an error
    // (e.g. 401 from OpenRouter/Anthropic), fall back to converse seamlessly.
    const intercepted = new ReadableStream({
      async start(controller) {
        if (!rawResponse.body) { controller.close(); return; }
        const reader = rawResponse.body.getReader();
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        let seenTextDelta = false;
        let errorDetected = false;
        let started = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = dec.decode(value, { stream: true });

            // Detect error before any real content has been sent
            if (!seenTextDelta && chunk.includes('"type":"error"')) {
              errorDetected = true;
              await reader.cancel();
              break;
            }

            if (chunk.includes('"type":"text-delta"') || chunk.includes('"type":"tool-')) {
              seenTextDelta = true;
            }
            if (chunk.includes('"type":"start"')) started = true;

            controller.enqueue(value);
          }
        } catch {
          errorDetected = true;
        }

        if (errorDetected) {
          // Pipe the fallback instead — suppress any partial start event
          try {
            const fallback = await fallbackConverse(message, history, careerMode);
            if (fallback.body) {
              const fb = fallback.body.getReader();
              // If we already sent a start event, skip the fallback's start event
              let first = true;
              while (true) {
                const { done, value: fbVal } = await fb.read();
                if (done) break;
                if (first && started) {
                  // Drop the duplicate start event from fallback
                  const t = dec.decode(fbVal);
                  const withoutStart = t.replace(/data: \{"type":"start"\}\n\n/, '');
                  if (withoutStart.trim()) controller.enqueue(enc.encode(withoutStart));
                  first = false;
                } else {
                  controller.enqueue(fbVal);
                  first = false;
                }
              }
            }
          } catch {
            const txt = careerMode
              ? "I'm focused on your job search. Share a role or JD and I'll help you tailor your approach."
              : "I'm here. Say a bit more and I'll shape it into a clear next step.";
            if (!started) controller.enqueue(enc.encode(`data: {"type":"start"}\n\n`));
            controller.enqueue(enc.encode(`data: {"type":"text-delta","delta":${JSON.stringify(txt)}}\n\n`));
            controller.enqueue(enc.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`));
            controller.enqueue(enc.encode(`data: [DONE]\n\n`));
          }
        }

        controller.close();
      }
    });

    return new Response(intercepted, {
      headers: {
        'Content-Type': rawResponse.headers.get('Content-Type') || 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      }
    });
  } catch (err: any) {
    console.warn('[agent/stream] sync error, falling back:', err?.message);
    return fallbackConverse(message, history, careerMode);
  }
}
