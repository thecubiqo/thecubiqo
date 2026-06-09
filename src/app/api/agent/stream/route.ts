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
  structureJobDescription,
  resumeGapCheck,
  buildApplicationChecklist,
  coverLetterBrief,
  interviewPrepKit,
  buildJobSearchQueries
} from '@/next/lib/ai/career-tools';
import { webSearch, searchConfigured } from '../../_lib/web-search';
import { getAgentParams, getModel, getOpenRouterModel } from '@/next/lib/config/llm';
import { cfg } from '@/next/lib/config/runtime';
import { CAREER_TERMS, CASUAL_TERMS, GATED_TERMS, GOAL_TERMS } from '@/next/lib/rgy/term-registry';
import { getPrompt } from '@/next/lib/ai/prompt-loader';
import { getDomainAddendum } from '@/next/lib/ai/domain-addendums';
import { detectDomain } from '@/next/lib/ai/reconnaissance';
import { getSupabaseAdmin, safeTableMissing } from '../../_lib/supabase-admin';

export const maxDuration = 55;
export const runtime = 'nodejs';

// ─── Career context detection ─────────────────────────────────────────────────

function isCareerContext(text: string): boolean {
  const lower = text.toLowerCase();
  return CAREER_TERMS.some(t => lower.includes(t));
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  return header.match(/^Bearer\s+(.+)$/i)?.[1] || '';
}

function hits(input: string, terms: readonly string[]) {
  const lower = input.toLowerCase();
  return terms.filter(t => lower.includes(t));
}

function getDayPart(hour: number) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function localTimeParts(timezone?: string | null) {
  const timeZone = timezone || 'UTC';
  const now = new Date();
  try {
    const hour = Number(new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      hour12: false
    }).format(now));
    const stamp = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(now);
    return { stamp, daypart: getDayPart(hour), timeZone };
  } catch {
    return { stamp: now.toISOString(), daypart: getDayPart(now.getUTCHours()), timeZone: 'UTC' };
  }
}

function daysAway(lastSeenAt?: string | null) {
  if (!lastSeenAt) return null;
  const then = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.max(0, Math.round(((Date.now() - then) / 86_400_000) * 10) / 10);
}

function compactLines(values: unknown[] | undefined, formatter: (value: any) => string) {
  return (values || []).map(formatter).filter(Boolean).slice(0, 6).join('\n');
}

async function buildPhaseAContextBundle(input: {
  supabaseAdmin: any;
  authToken: string;
  body: any;
  message: string;
}) {
  const { supabaseAdmin, authToken, body } = input;
  const visualContext = body.visual_context || body.structured_context || body.visualContext || null;
  const anonymousSession = body.local_session || body.localSession || body.session || null;
  const guardrails = [
    'Phase A guardrails:',
    '- Never execute payments.',
    '- Never final send, submit, publish, push, deploy, or place an order autonomously.',
    '- You may draft, summarize, classify, save memory, and ask for confirmation.',
  ].join('\n');

  if (!supabaseAdmin || !authToken) {
    const language = anonymousSession?.language_preference || body.language_preference || 'en';
    return [
      '--- CUBIQO CONTEXT ---',
      'User state: anonymous',
      `Anonymous session: visit ${anonymousSession?.visit_count ?? 1}`,
      anonymousSession?.last_summary ? `Prior topic: ${anonymousSession.last_summary}` : 'Prior topic: none',
      visualContext ? `Visual context: ${JSON.stringify(visualContext).slice(0, 1200)}` : '',
      `Language: Respond in ${language}. Match the user's code-switching exactly.`,
      guardrails,
      '--- END CONTEXT ---',
    ].filter(Boolean).join('\n');
  }

  try {
    const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
    if (!user?.id) throw new Error('No signed-in user');

    const [
      profileResult,
      memoryResult,
      aiProfileResult,
      signalsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('display_name,timezone,city,country,primary_goal,goal_domain,language_preference,daily_context,last_seen_at')
        .eq('id', user.id)
        .maybeSingle(),
      supabaseAdmin
        .from('memory_events')
        .select('event_type,summary,keywords,weight,created_at')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('weight', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('user_ai_profile')
        .select('personality_read,primary_drive,what_blocks,communication_style,current_phase,open_loops')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabaseAdmin
        .from('signals')
        .select('color,keyword,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (safeTableMissing(memoryResult.error) || safeTableMissing(aiProfileResult.error)) {
      throw new Error('Phase A memory tables not migrated yet');
    }

    const profile = profileResult.data || {};
    const clock = localTimeParts(profile.timezone);
    const away = daysAway(profile.last_seen_at);
    const memorySnippet = compactLines(memoryResult.data, (m) => `- [${m.event_type}, w${m.weight}] ${m.summary}`);
    const signalSummary = compactLines(signalsResult.data, (s) => `- [${s.color}] ${s.keyword}`);
    const userRead = aiProfileResult.data
      ? [
          aiProfileResult.data.primary_drive ? `Drive: ${aiProfileResult.data.primary_drive}` : '',
          aiProfileResult.data.what_blocks ? `Blocks: ${aiProfileResult.data.what_blocks}` : '',
          aiProfileResult.data.current_phase ? `Phase: ${aiProfileResult.data.current_phase}` : '',
          Array.isArray(aiProfileResult.data.open_loops) && aiProfileResult.data.open_loops.length
            ? `Open loops: ${aiProfileResult.data.open_loops.join(', ')}`
            : '',
        ].filter(Boolean).join(' | ')
      : 'No AI profile yet.';

    return [
      '--- CUBIQO CONTEXT ---',
      `Time: ${clock.stamp} | ${clock.daypart}`,
      `Location: ${[profile.city, profile.country].filter(Boolean).join(', ') || 'not provided'}`,
      away === null ? 'Away for: unknown' : `Away for: ${away} day(s)`,
      `World context: ${profile.daily_context || 'No daily context loaded.'}`,
      `User: ${profile.display_name || 'Signed-in user'} | ${profile.primary_goal || 'No primary goal yet'} | ${profile.goal_domain || 'general'}`,
      `CubiQo's read: ${userRead}`,
      `Recent memory:\n${memorySnippet || '- none yet'}`,
      `Active signals:\n${signalSummary || '- none yet'}`,
      visualContext ? `Visual context: ${JSON.stringify(visualContext).slice(0, 1200)}` : '',
      `Language: Respond in ${profile.language_preference || 'en'}. Match the user's code-switching exactly.`,
      guardrails,
      '--- END CONTEXT ---',
    ].filter(Boolean).join('\n');
  } catch {
    return [
      '--- CUBIQO CONTEXT ---',
      'User state: signed-in, context unavailable.',
      visualContext ? `Visual context: ${JSON.stringify(visualContext).slice(0, 1200)}` : '',
      `Language: Respond in ${body.language_preference || 'en'}. Match the user's code-switching exactly.`,
      guardrails,
      '--- END CONTEXT ---',
    ].filter(Boolean).join('\n');
  }
}

async function logPhaseAUsage(input: {
  supabaseAdmin: any;
  authToken: string;
  route: string;
  provider: string;
  model: string;
  latencyMs: number;
}) {
  const { supabaseAdmin, authToken, route, provider, model, latencyMs } = input;
  if (!supabaseAdmin || !authToken) return;

  const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
  if (!user?.id) return;

  await supabaseAdmin.from('api_usage_events').insert({
    user_id: user.id,
    route,
    provider,
    model,
    latency_ms: latencyMs,
    metadata: { source: 'phase_a_stream' },
  });

  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);
  const key = windowStart.toISOString();
  const { data: current } = await supabaseAdmin
    .from('user_api_usage')
    .select('llm_calls')
    .eq('user_id', user.id)
    .eq('window_start', key)
    .maybeSingle();

  await supabaseAdmin.from('user_api_usage').upsert({
    user_id: user.id,
    window_start: key,
    llm_calls: (current?.llm_calls || 0) + 1,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,window_start' });

  await supabaseAdmin
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id);
}

async function checkPhaseARateLimit(supabaseAdmin: any, authToken: string) {
  if (!supabaseAdmin || !authToken) return { allowed: true, userId: null, calls: 0, limit: null };
  const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
  if (!user?.id) return { allowed: true, userId: null, calls: 0, limit: null };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
    return { allowed: true, userId: user.id, calls: 0, limit: null };
  }

  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);
  const { data } = await supabaseAdmin
    .from('user_api_usage')
    .select('llm_calls')
    .eq('user_id', user.id)
    .eq('window_start', windowStart.toISOString())
    .maybeSingle();

  const limit = Number.parseInt(process.env.FREE_TIER_CALLS_PER_HOUR || '30', 10);
  const calls = data?.llm_calls || 0;
  return { allowed: calls < limit, userId: user.id, calls, limit };
}

// ─── System prompts (hardcoded fallbacks — overridden by DB via getPrompt) ───

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
  'Act as a sharp, experienced Career Coach. Adapt to whatever role, domain, or industry the user is targeting.',
  'If the target role is unclear, call career_profile_read first; if no saved profile exists, ask a concise clarifying question before generating role-specific search queries.',
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
        body: JSON.stringify({ message, history: history.slice(-cfg.fallbackHistorySize) })
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
  const startedAt = Date.now();

  const authToken = getBearerToken(request);
  const history: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(body.history) ? body.history : [];
  const careerMode = isCareerContext(message) || isCareerContext(history.slice(-3).map(h => h.content).join(' '));

  // Domain / capsule context — passed by frontend when Duo Mode opens from a signal
  const signalId: string | undefined = body.signal_id || undefined;
  const capsule = body.capsule || null;

  const supabaseAdmin = getSupabaseAdmin();
  const rate = await checkPhaseARateLimit(supabaseAdmin, authToken);
  if (!rate.allowed) {
    return NextResponse.json({
      error: 'Rate limit reached',
      message: 'You have reached the current free usage window. Try again soon.',
      calls: rate.calls,
      limit: rate.limit
    }, { status: 429 });
  }

  // Resolve model
  const openaiKey = (process.env['OPENAI_API_KEY'] || '').trim();
  const orKey = (process.env['OPENROUTER_API_KEY'] || process.env['OPENROUTER_KEY'] || '').trim();

  if (!openaiKey && !orKey) {
    return fallbackConverse(message, history, careerMode);
  }

  let model;
  try {
    model = openaiKey
      ? createOpenAI({ apiKey: openaiKey })(getModel('agent'))
      : createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: orKey })(
          getOpenRouterModel()
        );
  } catch {
    return fallbackConverse(message, history, careerMode);
  }

  // ── S4-F: Build system prompt from DB (10-min cache, fallback to hardcoded) ──
  let systemPrompt: string;
  try {
    if (supabaseAdmin) {
      const basePrompt = await getPrompt('base', supabaseAdmin);
      let addendum = '';
      if (careerMode) {
        addendum = await getPrompt('career_addendum', supabaseAdmin);
        // Placeholder not replaced yet — fall back to hardcoded
        if (!addendum || addendum.startsWith('__REPLACE')) addendum = CAREER_ADDENDUM;
      } else if (capsule) {
        // Inject domain addendum when Duo Mode opens from a specific capsule
        const domain = detectDomain(capsule);
        if (domain && domain !== 'general') {
          addendum = getDomainAddendum(domain);
        }
      }
      const effectiveBase = (!basePrompt || basePrompt.startsWith('__REPLACE')) ? BASE_PROMPT : basePrompt;
      systemPrompt = effectiveBase + (addendum ? '\n\n' + addendum : '');
    } else {
      // No Supabase admin available — use hardcoded prompts
      systemPrompt = careerMode ? BASE_PROMPT + CAREER_ADDENDUM : BASE_PROMPT;
    }
  } catch {
    systemPrompt = careerMode ? BASE_PROMPT + CAREER_ADDENDUM : BASE_PROMPT;
  }

  const phaseAContext = await buildPhaseAContextBundle({
    supabaseAdmin,
    authToken,
    body,
    message,
  });
  systemPrompt = `${phaseAContext}\n\n${systemPrompt}`;

  const historyMessages = history.slice(-cfg.historyWindowSize).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }));
  const agentParams = getAgentParams();

  try {
    const result = streamText({
      model: model as any,
      temperature: agentParams.temperature,
      stopWhen: stepCountIs(agentParams.maxSteps),
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
            green: hits(text, GOAL_TERMS),
            yellow: hits(text, CASUAL_TERMS),
            red: hits(text, GATED_TERMS)
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
        career_profile_read: tool({
          description: 'Read the signed-in user career profile: target roles, skills, preferred locations, work modes, salary, and experience. Call before job_search_queries if role is unknown.',
          inputSchema: z.object({}),
          execute: async () => {
            if (!authToken) {
              return {
                error: 'Not signed in',
                hint: 'Ask the user what role, location, and work mode they are targeting.'
              };
            }

            const url = new URL('/api/actions/execute', request.url);
            url.searchParams.set('job_state', '1');
            const res = await fetch(url, {
              headers: { authorization: `Bearer ${authToken}` },
              cache: 'no-store'
            });

            if (!res.ok) {
              return {
                error: `Career profile read failed with ${res.status}`,
                hint: 'Ask the user what role they are targeting.'
              };
            }

            const data = await res.json().catch(() => ({}));
            const profile = data.profile || null;
            if (!profile) {
              return {
                error: 'No profile saved',
                hint: 'Ask: what role are you targeting, where, and what work mode do you prefer?'
              };
            }

            return {
              targetRoles: profile.targetRoles || [],
              skills: profile.skills || [],
              preferredLocations: profile.preferredLocations || [],
              workModes: profile.workModes || [],
              salaryExpectation: profile.salaryExpectation || null,
              yearsExperience: profile.yearsExperience ?? null,
              experienceSummary: profile.experienceSummary || null
            };
          }
        }),
        jd_analyze: tool({
          description: 'Structure a job description for any role or domain: title, salary, experience, work mode, location, and core sections. Call this whenever the user shares a JD.',
          inputSchema: z.object({
            jdText: z.string().min(50).max(8000).describe('The raw job description text')
          }),
          execute: async ({ jdText }) => structureJobDescription(jdText)
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
              seniority: null, workStyle: null,
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
            role: z.string().min(2).max(200).optional(),
            targetTitles: z.array(z.string().min(2).max(200)).max(5).optional(),
            location: z.string().min(2).max(200).optional(),
            workMode: z.enum(['remote', 'hybrid', 'onsite', 'flexible']).optional(),
            skills: z.array(z.string().min(1).max(60)).max(5).optional(),
            seniority: z.enum(['junior', 'mid', 'senior', 'any']).default('mid'),
            recency: z.enum(['24h', '3d', '7d', '30d', 'any']).default('24h')
          }),
          execute: async ({ role, targetTitles, location, workMode, skills, seniority, recency }) =>
            buildJobSearchQueries({ role, targetTitles, location, workMode, skills, seniority, recency })
        }),

        // ── Proactive intelligence tools ──────────────────────────────────────
        open_briefings_read: tool({
          description: 'Read open (ready) capsule briefings for the current user. Use when user asks about their briefings, goals, or "what did you find?"',
          inputSchema: z.object({
            limit: z.number().int().min(1).max(5).optional()
          }),
          execute: async ({ limit }) => {
            if (!authToken || !supabaseAdmin) return { error: 'Not available', briefings: [] };
            try {
              const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
              if (!user?.id) return { error: 'Not signed in', briefings: [] };
              const { data } = await supabaseAdmin
                .from('capsule_briefings')
                .select('id, domain, status, headline, context_summary, blockers, recommended_actions, open_questions, updated_at')
                .eq('user_id', user.id)
                .in('status', ['ready', 'running'])
                .order('updated_at', { ascending: false })
                .limit(limit || 3);
              return { briefings: data || [] };
            } catch (e: any) {
              return { error: e.message, briefings: [] };
            }
          }
        }),

        briefing_update: tool({
          description: 'Update a capsule briefing — mark actions complete, add new findings, or change status. Use when user says "done", "I did it", "skip that", or wants to update their plan.',
          inputSchema: z.object({
            briefing_id: z.string().uuid(),
            action_index: z.number().int().min(0).optional().describe('Index of the completed action (0-based)'),
            completion_note: z.string().max(500).optional(),
            new_headline: z.string().max(200).optional().describe('Updated headline if situation changed'),
            append_action: z.object({
              step: z.string(),
              why: z.string(),
              effort: z.enum(['10min', '1hr', '1day', '1week'])
            }).optional().describe('New action discovered during conversation')
          }),
          execute: async ({ briefing_id, action_index, completion_note, new_headline, append_action }) => {
            if (!authToken || !supabaseAdmin) return { error: 'Not available' };
            try {
              const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
              if (!user?.id) return { error: 'Not signed in' };

              // Verify ownership
              const { data: briefing } = await supabaseAdmin
                .from('capsule_briefings')
                .select('id, recommended_actions, user_id')
                .eq('id', briefing_id)
                .eq('user_id', user.id)
                .maybeSingle();
              if (!briefing) return { error: 'Briefing not found or not yours' };

              // Record action completion
              if (typeof action_index === 'number') {
                await supabaseAdmin.from('briefing_action_completions').insert({
                  briefing_id,
                  user_id: user.id,
                  action_index,
                  completion_note: completion_note || null,
                  completed_at: new Date().toISOString()
                });
              }

              // Build update payload
              const updates: Record<string, any> = { updated_at: new Date().toISOString() };
              if (new_headline) updates.headline = new_headline;
              if (append_action) {
                const existing = Array.isArray(briefing.recommended_actions) ? briefing.recommended_actions : [];
                updates.recommended_actions = [...existing, append_action];
              }
              await supabaseAdmin.from('capsule_briefings').update(updates).eq('id', briefing_id);
              return { success: true, action_recorded: typeof action_index === 'number' };
            } catch (e: any) {
              return { error: e.message };
            }
          }
        }),

        outcome_capture: tool({
          description: 'Record a user outcome — interview booked, sale made, offer received, investor reply, product shipped, or no progress. Call when user reports a result from a goal.',
          inputSchema: z.object({
            domain: z.string().min(2).max(50),
            outcome_type: z.enum(['interview_booked', 'sale_made', 'investor_reply', 'product_shipped', 'offer_received', 'no_progress', 'other']),
            outcome_detail: z.string().max(500).optional(),
            signal_id: z.string().uuid().optional(),
            briefing_id: z.string().uuid().optional()
          }),
          execute: async ({ domain, outcome_type, outcome_detail, signal_id: sid, briefing_id }) => {
            if (!authToken || !supabaseAdmin) return { error: 'Not available' };
            try {
              const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
              if (!user?.id) return { error: 'Not signed in' };
              await supabaseAdmin.from('user_outcomes').insert({
                user_id: user.id,
                domain,
                outcome_type,
                outcome_detail: outcome_detail || null,
                signal_id: sid || signalId || null,
                briefing_id: briefing_id || null,
                captured_at: new Date().toISOString()
              });
              return { success: true, recorded: outcome_type };
            } catch (e: any) {
              return { error: e.message };
            }
          }
        }),

        artifact_read: tool({
          description: 'Check what documents/artifacts the user has uploaded (resume, pitch deck, landing page, business plan). Use before giving feedback — reference their actual document, not generic advice.',
          inputSchema: z.object({
            document_type: z.enum(['pitch_deck', 'business_plan', 'landing_page_url', 'resume_url']).optional().describe('Leave empty to list all documents')
          }),
          execute: async ({ document_type }) => {
            if (!authToken || !supabaseAdmin) return { error: 'Not available', documents: [] };
            try {
              const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
              if (!user?.id) return { error: 'Not signed in', documents: [] };
              let query = supabaseAdmin
                .from('user_documents')
                .select('document_type, url, storage_path, metadata, updated_at')
                .eq('user_id', user.id);
              if (document_type) query = query.eq('document_type', document_type);
              const { data } = await query.order('updated_at', { ascending: false });
              return {
                documents: data || [],
                has_resume: (data || []).some((d: any) => d.document_type === 'resume_url'),
                has_pitch_deck: (data || []).some((d: any) => d.document_type === 'pitch_deck'),
                hint: (data || []).length === 0
                  ? 'No documents uploaded. Suggest user uploads their resume/deck via Settings → Documents for specific feedback.'
                  : undefined
              };
            } catch (e: any) {
              return { error: e.message, documents: [] };
            }
          }
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

        logPhaseAUsage({
          supabaseAdmin,
          authToken,
          route: '/api/agent/stream',
          provider: openaiKey ? 'openai' : 'openrouter',
          model: openaiKey ? getModel('agent') : getOpenRouterModel(),
          latencyMs: Date.now() - startedAt,
        }).catch((error) => console.warn('[agent/stream] usage log failed:', error?.message));

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
