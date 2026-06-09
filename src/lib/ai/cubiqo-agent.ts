import { ToolLoopAgent, stepCountIs, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  repoListRoutes,
  repoReadFile,
  repoSearch,
  repoStackSummary,
  runtimeStatus
} from './repo-inspection';
import { capabilityPlanForText, isCapabilityPlanningRequest } from './capability-map';
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
} from './user-context-tools';
import { webSearch, searchConfigured } from '../../app/api/_lib/web-search';
import { CASUAL_TERMS, GATED_TERMS, GOAL_TERMS } from '../rgy/term-registry';
import { getChatParams, getModel } from '../config/llm';

export type AgentTraceItem = {
  tool: string;
  status: 'completed' | 'blocked' | 'failed';
  summary: string;
};

export type CubiQoAgentOptions = {
  authToken?: string;
};

function hits(input: string, terms: readonly string[]) {
  const lower = input.toLowerCase();
  return terms.filter((term) => lower.includes(term));
}

function summarizeOutput(toolName: string, output: unknown) {
  if (toolName === 'repo_search') {
    const matches = (output as { matches?: unknown[] }).matches || [];
    return `${matches.length} repo match${matches.length === 1 ? '' : 'es'} found`;
  }
  if (toolName === 'repo_read_file') {
    const file = (output as { file?: string }).file || 'file';
    return `read ${file}`;
  }
  if (toolName === 'repo_list_routes') {
    const routes = (output as { routes?: unknown[] }).routes || [];
    return `${routes.length} app route${routes.length === 1 ? '' : 's'} listed`;
  }
  if (toolName === 'repo_stack_summary') return 'inspected package, stack, dependencies, and routes';
  if (toolName === 'runtime_status') return 'checked runtime provider and stack state';
  if (toolName === 'classify_rgy') return 'classified RGY keywords';
  if (toolName === 'capability_plan') {
    const domains = (output as { matchedDomains?: unknown[] }).matchedDomains || [];
    return `${domains.length} capability domain${domains.length === 1 ? '' : 's'} mapped`;
  }
  if (toolName === 'dashboard_summary') return 'summarized user-owned dashboard state';
  if (toolName === 'journal_read') {
    const entries = (output as { entries?: unknown[] }).entries || [];
    return `${entries.length} journal entr${entries.length === 1 ? 'y' : 'ies'} read`;
  }
  if (toolName === 'journal_write_summary') return 'saved a user-owned journal summary';
  if (toolName === 'rgy_signal_read') {
    const signals = (output as { signals?: unknown[] }).signals || [];
    return `${signals.length} RGY signal${signals.length === 1 ? '' : 's'} read`;
  }
  if (toolName === 'rgy_signal_write') return 'saved RGY capsule';
  if (toolName === 'memory_read') {
    const memory = (output as { memory?: unknown[] }).memory || [];
    return `${memory.length} memory item${memory.length === 1 ? '' : 's'} read`;
  }
  if (toolName === 'memory_write_safe_summary') return 'saved safe user-owned memory summary';
  if (toolName === 'task_plan_create') return 'created an in-session task plan';
  if (toolName === 'content_brief_create') return 'created an in-session content brief';
  if (toolName === 'web_search') {
    const results = (output as { results?: unknown[] }).results || [];
    const provider = (output as { provider?: string }).provider || 'unknown';
    return `${results.length} web result${results.length === 1 ? '' : 's'} via ${provider}`;
  }
  if (toolName === 'parallel_web_search') {
    const searches = (output as { searches?: unknown[] }).searches || [];
    return `${searches.length} parallel search${searches.length === 1 ? '' : 'es'} completed`;
  }
  return 'completed';
}

function tracedTool<TInput extends z.ZodTypeAny>({
  trace,
  name,
  description,
  inputSchema,
  execute
}: {
  trace: AgentTraceItem[];
  name: string;
  description: string;
  inputSchema: TInput;
  execute: (input: z.infer<TInput>) => Promise<unknown> | unknown;
}) {
  return tool({
    description,
    inputSchema,
    execute: async (input) => {
      try {
        const output = await execute(input);
        const status = (output as { status?: string })?.status === 'blocked' ? 'blocked' : 'completed';
        trace.push({ tool: name, status, summary: summarizeOutput(name, output) });
        return output;
      } catch (error) {
        trace.push({
          tool: name,
          status: 'failed',
          summary: error instanceof Error ? error.message : 'tool failed'
        });
        return {
          error: error instanceof Error ? error.message : 'tool failed'
        };
      }
    }
  });
}

export const V1_AGENT_TOOLS = [
  'runtime_status',
  'repo_stack_summary',
  'repo_list_routes',
  'repo_search',
  'repo_read_file',
  'classify_rgy',
  'capability_plan',
  'dashboard_summary',
  'journal_read',
  'journal_write_summary',
  'rgy_signal_read',
  'rgy_signal_write',
  'memory_read',
  'memory_write_safe_summary',
  'task_plan_create',
  'content_brief_create',
  'web_search',
  'parallel_web_search',
  'duo_project_create',
  'duo_task_create',
  'duo_task_update',
  'duo_timeline_log'
];

export function createCubiQoAgent(trace: AgentTraceItem[], options: CubiQoAgentOptions = {}) {
  const tools = {
    runtime_status: tracedTool({
      trace,
      name: 'runtime_status',
      description: 'Inspect the live CubiQo runtime, provider flags, stack, and route list without exposing secrets.',
      inputSchema: z.object({}),
      execute: async () => runtimeStatus()
    }),
    repo_stack_summary: tracedTool({
      trace,
      name: 'repo_stack_summary',
      description: 'Inspect package.json, framework dependencies, and actual Next.js routes.',
      inputSchema: z.object({}),
      execute: async () => repoStackSummary()
    }),
    repo_list_routes: tracedTool({
      trace,
      name: 'repo_list_routes',
      description: 'List actual Next.js page and API routes from src/app.',
      inputSchema: z.object({}),
      execute: async () => repoListRoutes()
    }),
    repo_search: tracedTool({
      trace,
      name: 'repo_search',
      description: 'Search readable repo files for a phrase. Never searches secrets, node_modules, .next, or build artifacts.',
      inputSchema: z.object({
        query: z.string().min(2).max(80)
      }),
      execute: async ({ query }) => repoSearch(query)
    }),
    repo_read_file: tracedTool({
      trace,
      name: 'repo_read_file',
      description: 'Read one non-secret repo file by relative path. Use after repo_search or when a path is known.',
      inputSchema: z.object({
        path: z.string().min(1).max(180)
      }),
      execute: async ({ path }) => repoReadFile(path)
    }),
    classify_rgy: tracedTool({
      trace,
      name: 'classify_rgy',
      description: 'Classify text into CubiQo RGY operational keyword bands.',
      inputSchema: z.object({
        text: z.string().min(1).max(2000)
      }),
      execute: async ({ text }) => ({
        green: hits(text, GOAL_TERMS),
        yellow: hits(text, CASUAL_TERMS),
        red: hits(text, GATED_TERMS)
      })
    }),
    capability_plan: tracedTool({
      trace,
      name: 'capability_plan',
      description: 'Map user functional needs to CubiQo V1/V2 capabilities for job hunt, ecomm/POD business, routine, memory, and contextual support.',
      inputSchema: z.object({
        text: z.string().min(1).max(3000)
      }),
      execute: async ({ text }) => capabilityPlanForText(text)
    }),
    dashboard_summary: tracedTool({
      trace,
      name: 'dashboard_summary',
      description: 'Read the signed-in user dashboard counts and live feature state from Supabase.',
      inputSchema: z.object({}),
      execute: async () => dashboardSummary(options.authToken)
    }),
    journal_read: tracedTool({
      trace,
      name: 'journal_read',
      description: 'Read recent signed-in user journal entries from Supabase. Requires auth.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(10).optional()
      }),
      execute: async ({ limit }) => journalRead(options.authToken, limit || 5)
    }),
    journal_write_summary: tracedTool({
      trace,
      name: 'journal_write_summary',
      description: 'Save a constrained, user-owned journal summary. Requires auth and never writes files or external systems.',
      inputSchema: z.object({
        title: z.string().max(120).optional(),
        summary: z.string().min(1).max(4000),
        tags: z.array(z.string().max(40)).max(10).optional()
      }),
      execute: async (input) => journalWriteSummary(options.authToken, input)
    }),
    rgy_signal_read: tracedTool({
      trace,
      name: 'rgy_signal_read',
      description: 'Read signed-in user RGY capsules: color, keyword, optional/confirmed intent. Requires auth.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(25).optional()
      }),
      execute: async ({ limit }) => rgySignalRead(options.authToken, limit || 12)
    }),
    rgy_signal_write: tracedTool({
      trace,
      name: 'rgy_signal_write',
      description: 'Save one signed-in user RGY capsule: color, keyword, optional/confirmed intent. Requires auth.',
      inputSchema: z.object({
        color: z.enum(['green', 'yellow', 'red']),
        keyword: z.string().min(1).max(80),
        suggestedIntents: z.array(z.enum(['socialize', 'collaborate', 'trade'])).max(3).optional(),
        confirmedIntents: z.array(z.enum(['socialize', 'collaborate', 'trade'])).max(3).optional()
      }),
      execute: async (input) => rgySignalWrite(options.authToken, input)
    }),
    memory_read: tracedTool({
      trace,
      name: 'memory_read',
      description: 'Read recent signed-in user-owned conversation memory summaries from Supabase. Requires auth.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(12).optional()
      }),
      execute: async ({ limit }) => memoryRead(options.authToken, limit || 6)
    }),
    memory_write_safe_summary: tracedTool({
      trace,
      name: 'memory_write_safe_summary',
      description: 'Save a short safe memory summary to signed-in user-owned memory. Rejects credential-like content.',
      inputSchema: z.object({
        summary: z.string().min(1).max(4000)
      }),
      execute: async ({ summary }) => memoryWriteSafeSummary(options.authToken, summary)
    }),
    task_plan_create: tracedTool({
      trace,
      name: 'task_plan_create',
      description: 'Create an in-session task plan. Does not persist tasks or perform external actions in V1.',
      inputSchema: z.object({
        goal: z.string().min(1).max(500),
        horizon: z.string().max(80).optional()
      }),
      execute: async (input) => taskPlanCreate(input)
    }),
    content_brief_create: tracedTool({
      trace,
      name: 'content_brief_create',
      description: 'Create an in-session content or GFXTools-ready creative brief. Does not call external APIs in V1.',
      inputSchema: z.object({
        topic: z.string().min(1).max(500),
        channel: z.string().max(80).optional(),
        audience: z.string().max(120).optional()
      }),
      execute: async (input) => contentBriefCreate(input)
    }),
    web_search: tracedTool({
      trace,
      name: 'web_search',
      description: 'Search the live internet for real-time information. Use for current events, job market trends, company research, product pricing, and anything requiring up-to-date facts not in the repo or memory.',
      inputSchema: z.object({
        query: z.string().min(2).max(200),
        maxResults: z.number().int().min(1).max(10).optional()
      }),
      execute: async ({ query, maxResults }) => {
        if (!searchConfigured()) {
          return { error: 'No search API configured (TAVILY_API_KEY, BRAVE_SEARCH_API_KEY, or SERPER_API_KEY required)', results: [], provider: 'none' };
        }
        return webSearch(query, maxResults || 5);
      }
    }),
    parallel_web_search: tracedTool({
      trace,
      name: 'parallel_web_search',
      description: 'Run multiple web searches in parallel for research tasks. Returns combined results from up to 4 queries simultaneously.',
      inputSchema: z.object({
        queries: z.array(z.string().min(2).max(200)).min(1).max(4)
      }),
      execute: async ({ queries }) => {
        if (!searchConfigured()) {
          return { error: 'No search API configured', searches: [] };
        }
        const searches = await Promise.all(
          queries.map(async (q) => { const r = await webSearch(q, 5); return { query: q, results: r.results, provider: r.provider, error: r.error }; })
        );
        return { searches, totalResults: searches.reduce((n, s) => n + s.results.length, 0) };
      }
    }),
    duo_project_create: tracedTool({
      trace,
      name: 'duo_project_create',
      description: 'Create a durable Duo Project to group related tasks and track progress. Returns project ID and trace ID.',
      inputSchema: z.object({
        title: z.string().min(1).max(200),
        domain: z.string().min(1).max(50),
        successCriteria: z.array(z.string()).optional(),
        metadata: z.any().optional()
      }),
      execute: async (input) => {
        const { duoProjectCreate } = await import('./user-context-tools');
        return duoProjectCreate(options.authToken, input);
      }
    }),
    duo_task_create: tracedTool({
      trace,
      name: 'duo_task_create',
      description: 'Create a specific task within a Duo Project. Requires project_id and trace_id.',
      inputSchema: z.object({
        projectId: z.string().uuid(),
        traceId: z.string().uuid(),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        routePreference: z.array(z.string()).optional(),
        dependencies: z.array(z.string().uuid()).optional(),
        approvalRequired: z.boolean().optional()
      }),
      execute: async (input) => {
        const { duoTaskCreate } = await import('./user-context-tools');
        return duoTaskCreate(options.authToken, input);
      }
    }),
    duo_task_update: tracedTool({
      trace,
      name: 'duo_task_update',
      description: 'Update the status or result of a Duo Task.',
      inputSchema: z.object({
        taskId: z.string().uuid(),
        status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped', 'blocked']).optional(),
        assignedRoute: z.string().optional(),
        evidence: z.any().optional(),
        result: z.string().optional(),
        metadata: z.any().optional()
      }),
      execute: async ({ taskId, ...updates }) => {
        const { duoTaskUpdate } = await import('./user-context-tools');
        return duoTaskUpdate(options.authToken, taskId, updates);
      }
    }),
    duo_timeline_log: tracedTool({
      trace,
      name: 'duo_timeline_log',
      description: 'Log an event to the Duo Project timeline for observability.',
      inputSchema: z.object({
        projectId: z.string().uuid(),
        traceId: z.string().uuid(),
        eventType: z.string(),
        message: z.string(),
        payload: z.any().optional()
      }),
      execute: async (input) => {
        const { duoTimelineLog } = await import('./user-context-tools');
        return duoTimelineLog(options.authToken, input);
      }
    })
  };

  return new ToolLoopAgent({
    model: createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(getModel('chat')),
    tools,
    instructions: [
      'You are CubiQo inside cq.ai.',
      'Default to conversation, but use tools for repo, stack, route, runtime, dashboard, implementation, or self-awareness questions.',
      'For job hunt, career, resume, new job postings, easy apply, website applications, startup ideas, market need, revenue generation, investors, business growth, ecomm, fashion brands, POD, sales, marketing, routine, memory, or contextual support, use capability_plan before answering.',
      'Treat CQ-to-CQ as friend/contact messaging only. Do not tie CQ messenger to Signal matching, RGY matching, or intent matching.',
      'For coder/studio, prefer managed API/sandbox/tool layers before custom raw terminal engineering.',
      'Never answer repo facts from memory. If the user asks what CubiQo is built with, what routes exist, whether a feature exists, or what was implemented, inspect the repo first.',
      'V1 is read-only. Do not claim you changed code, deployed, submitted applications, posted content, bought anything, or controlled a browser.',
      'The only V1 writes allowed are signed-in, user-owned CubiQo state: journal summaries, RGY capsules, and safe memory summaries. External actions still require V2 approval.',
      'For dashboard, journal, RGY signal, or memory questions, use the matching auth-aware tool. If auth is missing, say sign-in is required.',
      'When a tool is unavailable or blocked, say that clearly.',
      'Keep answers concise and specific.'
    ].join('\n'),
    stopWhen: stepCountIs(Math.max(5, getChatParams().maxSteps))
  });
}

export async function buildFallbackAgentAnswer(
  message: string,
  trace: AgentTraceItem[],
  options: CubiQoAgentOptions = {}
) {
  const lower = message.toLowerCase();
  const strongCheckRequest = /\b(run|execute|start)\b.*\b(test|tests|regression|typecheck|verify|check)\b/.test(lower);
  const strongWriteRequest =
    /\b(change|edit|write|commit|push|deploy)\b.*\b(now|this app|file|code|prod|production|branch)\b/.test(lower)
    || /\b(submit|send|buy|purchase|post)\b.*\b(now|for me|this)\b/.test(lower);
  if (strongCheckRequest) {
    const check = /(verify|regression|cqai)/.test(lower) ? 'verify:cqai' : 'typecheck';
    trace.push({
      tool: 'workspace_check_boundary',
      status: 'blocked',
      summary: `CubiQo does not run ${check} or workspace commands`
    });
    return `CubiQo does not run ${check} or workspace commands. Codex runs regression from the workspace and CubiQo can report those results only after they exist.`;
  }
  if (strongWriteRequest) {
    trace.push({ tool: 'approval_boundary', status: 'blocked', summary: 'V1 cannot perform write or external actions' });
    return 'V1 is read-only. I can inspect and explain, but I cannot change files, deploy, submit applications, post content, or send anything until the V2 approval and audit system exists.';
  }
  if (/(save|store).*(journal summary|journal note|journal notes)/.test(lower)) {
    const result = await journalWriteSummary(options.authToken, {
      title: 'CubiQo Journal Summary',
      summary: message,
      tags: ['agent-v1-summary']
    });
    const journalResult = result as any;
    trace.push({ tool: 'journal_write_summary', status: journalResult.status === 'completed' ? 'completed' : 'blocked', summary: 'saved a user-owned journal summary' });
    if (journalResult.status !== 'completed') return `${journalResult.reason || 'Journal summary save needs a signed-in session and valid journal schema.'}`;
    return `Saved a user-owned journal summary as "${journalResult.entry.title}".`;
  }
  if (/(save|store|capture).*(rgy|signal|keyword)/.test(lower)) {
    const color = lower.includes('red') ? 'red' : lower.includes('green') || lower.includes('teal') ? 'green' : 'yellow';
    const keywordMatch = lower.match(/keyword\s+["']?([a-z0-9 -]{2,80})["']?/i);
    const fallbackKeyword = lower.includes('career') ? 'career' : lower.includes('pod') ? 'pod' : lower.includes('business') ? 'business' : 'signal';
    const keyword = (keywordMatch?.[1] || fallbackKeyword).replace(/\s+as\s+(red|green|yellow).*$/i, '').trim();
    const result = await rgySignalWrite(options.authToken, {
      color,
      keyword,
      suggestedIntents: [],
      confirmedIntents: []
    });
    const signalResult = result as any;
    trace.push({ tool: 'rgy_signal_write', status: signalResult.status === 'completed' ? 'completed' : 'blocked', summary: 'saved RGY capsule' });
    if (signalResult.status !== 'completed') return `${signalResult.reason || 'RGY signal save needs a signed-in session and valid signals schema.'}`;
    return `Saved the RGY capsule ${signalResult.signal.color}:${signalResult.signal.keyword}. Matching remains off until intent is confirmed.`;
  }
  if (/(remember|save memory|store memory|save context)/.test(lower)) {
    const result = await memoryWriteSafeSummary(options.authToken, message);
    const memoryResult = result as any;
    trace.push({ tool: 'memory_write_safe_summary', status: memoryResult.status === 'completed' ? 'completed' : 'blocked', summary: 'saved safe user-owned memory summary' });
    if (memoryResult.status !== 'completed') return `${memoryResult.reason || 'Memory save needs a signed-in session and safe content.'}`;
    return 'Saved a safe user-owned memory summary.';
  }
  if (/(dashboard|stats|counts|account summary|what.*dashboard)/.test(lower)) {
    const summary = await dashboardSummary(options.authToken);
    const summaryResult = summary as any;
    trace.push({ tool: 'dashboard_summary', status: summaryResult.status === 'completed' ? 'completed' : 'blocked', summary: 'summarized user-owned dashboard state' });
    if (summaryResult.status !== 'completed') return `${summaryResult.reason || 'Dashboard needs a signed-in session before I can read user-owned data.'}`;
    return `I checked the signed-in dashboard state: ${summaryResult.stats.journals} journals, ${summaryResult.stats.signals} RGY signals, ${summaryResult.stats.keywords} legacy keywords, ${summaryResult.stats.conversations} conversation events, ${summaryResult.stats.tasks} tasks, and ${summaryResult.stats.reports} reports.`;
  }
  if (/(journal|journals|guided journal).*(read|show|latest|history|entries|summary)|\b(read|show|latest)\b.*\bjournal/.test(lower)) {
    const result = await journalRead(options.authToken, 5);
    const journalResult = result as any;
    trace.push({ tool: 'journal_read', status: journalResult.status === 'completed' ? 'completed' : 'blocked', summary: 'read recent journal entries' });
    if (journalResult.status !== 'completed') return `${journalResult.reason || 'Journal history needs a signed-in session before I can read user-owned data.'}`;
    if (!journalResult.entries.length) return 'I checked journal history. There are no saved journal entries yet.';
    const latest = journalResult.entries[0];
    return `I checked journal history. Latest entry: "${latest.title}" from ${latest.created_at}. It is tagged ${Array.isArray(latest.tags) && latest.tags.length ? latest.tags.join(', ') : 'with no tags yet'}.`;
  }
  if (/(rgy|signal|signals|keyword|keywords).*(read|show|list|saved|history)|\b(read|show|list)\b.*\b(rgy|signal|keyword)/.test(lower)) {
    const result = await rgySignalRead(options.authToken, 12);
    const signalResult = result as any;
    trace.push({ tool: 'rgy_signal_read', status: signalResult.status === 'completed' ? 'completed' : 'blocked', summary: 'read RGY capsules' });
    if (signalResult.status !== 'completed') return `${signalResult.reason || 'RGY signal history needs a signed-in session before I can read user-owned data.'}`;
    if (!signalResult.signals.length) return 'I checked saved RGY capsules. There are no saved signals yet.';
    const preview = signalResult.signals.slice(0, 5).map((signal: any) => `${signal.color}:${signal.keyword}`).join(', ');
    return `I checked saved RGY capsules. Recent signals: ${preview}. Capsule scope is color + keyword + optional/confirmed intent.`;
  }
  if (/(memory|remembered|context).*(read|show|what do you know|saved|history)|\b(read|show)\b.*\bmemory/.test(lower)) {
    const result = await memoryRead(options.authToken, 6);
    const memoryResult = result as any;
    trace.push({ tool: 'memory_read', status: memoryResult.status === 'completed' ? 'completed' : 'blocked', summary: 'read user-owned memory summaries' });
    if (memoryResult.status !== 'completed') return `${memoryResult.reason || 'Memory history needs a signed-in session before I can read user-owned data.'}`;
    if (!memoryResult.memory.length) return 'I checked memory. There are no saved conversation memory items yet.';
    return `I checked memory and found ${memoryResult.memory.length} recent item${memoryResult.memory.length === 1 ? '' : 's'}. I can summarize them, but I will not invent profile facts beyond saved user-owned records.`;
  }
  if (/(content brief|creative brief|gfx|gfxtools|ad copy|pod design|campaign brief)/.test(lower)) {
    const brief = contentBriefCreate({ topic: message });
    trace.push({ tool: 'content_brief_create', status: 'completed', summary: 'created an in-session content brief' });
    return `I created a V1 brief structure for ${brief.brief.topic}. It stays in-session: ${brief.brief.deliverables.join(', ')}. External GFXTools or posting requires V2 approval and credentials.`;
  }
  if (/(task plan|plan tasks|routine plan|daily plan|action plan)/.test(lower)) {
    const plan = taskPlanCreate({ goal: message });
    trace.push({ tool: 'task_plan_create', status: 'completed', summary: 'created an in-session task plan' });
    return `I created a V1 task plan for: ${plan.plan.goal}. First steps: ${plan.plan.steps.slice(0, 3).join(' ')}`;
  }
  if (isCapabilityPlanningRequest(message)) {
    const plan = capabilityPlanForText(message);
    trace.push({ tool: 'capability_plan', status: 'completed', summary: `${plan.matchedDomains.length} capability domains mapped` });
    const labels = plan.matchedDomains.map(domain => domain.label).join(', ');
    const preferredPath = [...new Set(plan.matchedDomains.flatMap(domain => domain.preferredV2Path))].slice(0, 4).join('; ');
    const v2Tools = [...new Set(plan.matchedDomains.flatMap(domain => domain.v2ToolsRequired))].slice(0, 6).join('; ');
    return `I mapped this to ${labels}. V1 can understand context, plan strategy, draft assets, and prepare structured workflows. Preferred V2 path: ${preferredPath}. Approved action tools still needed for: ${v2Tools}.`;
  }
  if (/(change|edit|write|commit|push|deploy|apply|submit|post|send|buy|purchase|delete|update).*(file|code|app|site|prod|production|branch|job|application|social|content)?/.test(lower)) {
    trace.push({ tool: 'approval_boundary', status: 'blocked', summary: 'V1 cannot perform write or external actions' });
    return 'V1 is read-only. I can inspect and explain, but I cannot change files, deploy, submit applications, post content, or send anything until the V2 approval and audit system exists.';
  }
  if (/(stack|built|framework|next|react|routes|repo|code|self|yourself|implementation)/.test(lower)) {
    const stack = await repoStackSummary();
    trace.push({ tool: 'repo_stack_summary', status: 'completed', summary: 'inspected package, stack, dependencies, and routes' });
    return `I inspected the repo. CubiQo is currently ${stack.stack.framework} with React ${stack.stack.react}, Supabase ${stack.stack.supabase}, and AI SDK ${stack.stack.ai}. The active app routes include ${stack.routes.map(route => route.route).join(', ')}.`;
  }
  const rgy = {
    green: hits(message, GOAL_TERMS),
    yellow: hits(message, CASUAL_TERMS),
    red: hits(message, GATED_TERMS)
  };
  trace.push({ tool: 'classify_rgy', status: 'completed', summary: 'classified RGY keywords' });
  return `I can handle this conversationally in V1. I classified the active signal as ${rgy.red.length ? 'red' : rgy.green.length ? 'green' : 'yellow'} and I will stay read-only unless you approve a later V2 action system.`;
}
