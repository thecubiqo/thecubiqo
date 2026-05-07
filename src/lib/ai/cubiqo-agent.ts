import { ToolLoopAgent, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import {
  repoListRoutes,
  repoReadFile,
  repoSearch,
  repoStackSummary,
  runCheck,
  runtimeStatus
} from './repo-inspection';
import { capabilityPlanForText, isCapabilityPlanningRequest } from './capability-map';

export type AgentTraceItem = {
  tool: string;
  status: 'completed' | 'blocked' | 'failed';
  summary: string;
};

const goalTerms = ['linkedin', 'career', 'yoga', 'wellness', 'build', 'ship', 'launch', 'job', 'resume', 'routine', 'business', 'pod'];
const casualTerms = ['instagram', 'facebook', 'fb', 'insta', 'comfort', 'chat', 'friends', 'mood', 'movie'];
const gatedTerms = ['grindr', 'tinder', 'adult', 'explicit', 'nsfw', 'hookup'];

function hits(input: string, terms: string[]) {
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
  if (toolName === 'repo_stack_summary') return 'inspected package, stack, scripts, and routes';
  if (toolName === 'runtime_status') return 'checked runtime provider and stack state';
  if (toolName === 'run_check') {
    const result = output as { check?: string; status?: string };
    return `${result.check || 'check'} ${result.status || 'completed'}`;
  }
  if (toolName === 'classify_rgy') return 'classified RGY keywords';
  if (toolName === 'capability_plan') {
    const domains = (output as { matchedDomains?: unknown[] }).matchedDomains || [];
    return `${domains.length} capability domain${domains.length === 1 ? '' : 's'} mapped`;
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

export function createCubiQoAgent(trace: AgentTraceItem[]) {
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
      description: 'Inspect package.json, framework dependencies, scripts, and actual Next.js routes.',
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
    run_check: tracedTool({
      trace,
      name: 'run_check',
      description: 'Run an allowlisted non-mutating check only when local agent checks are explicitly enabled.',
      inputSchema: z.object({
        check: z.enum(['typecheck', 'verify:cqai'])
      }),
      execute: async ({ check }) => runCheck(check)
    }),
    classify_rgy: tracedTool({
      trace,
      name: 'classify_rgy',
      description: 'Classify text into CubiQo RGY operational keyword bands.',
      inputSchema: z.object({
        text: z.string().min(1).max(2000)
      }),
      execute: async ({ text }) => ({
        green: hits(text, goalTerms),
        yellow: hits(text, casualTerms),
        red: hits(text, gatedTerms)
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
    })
  };

  return new ToolLoopAgent({
    model: process.env.AI_GATEWAY_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-5.4',
    tools,
    instructions: [
      'You are CubiQo V1 inside cq.ai.',
      'Default to conversation, but use tools for repo, stack, route, runtime, test, dashboard, implementation, or self-awareness questions.',
      'For job hunt, career, resume, new job postings, easy apply, website applications, ecomm, fashion brands, POD, sales, marketing, routine, memory, or contextual support, use capability_plan before answering.',
      'Never answer repo facts from memory. If the user asks what CubiQo is built with, what routes exist, whether a feature exists, or what was implemented, inspect the repo first.',
      'V1 is read-only. Do not claim you changed code, deployed, submitted applications, posted content, bought anything, or controlled a browser.',
      'When a tool is unavailable or blocked, say that clearly.',
      'Keep answers concise and specific.'
    ].join('\n'),
    stopWhen: stepCountIs(5)
  });
}

export async function buildFallbackAgentAnswer(message: string, trace: AgentTraceItem[]) {
  const lower = message.toLowerCase();
  const strongCheckRequest = /\b(run|execute|start)\b.*\b(test|tests|regression|typecheck|verify|check)\b/.test(lower);
  const strongWriteRequest =
    /\b(change|edit|write|commit|push|deploy)\b.*\b(now|this app|file|code|prod|production|branch)\b/.test(lower)
    || /\b(submit|send|buy|purchase|post)\b.*\b(now|for me|this)\b/.test(lower);
  if (strongCheckRequest) {
    const check = /(verify|regression|cqai)/.test(lower) ? 'verify:cqai' : 'typecheck';
    const result = await runCheck(check);
    trace.push({
      tool: 'run_check',
      status: result.status === 'passed' ? 'completed' : result.status === 'blocked' ? 'blocked' : 'failed',
      summary: `${check} ${result.status}`
    });
    if (result.status === 'passed') return `${check} passed.`;
    if (result.status === 'blocked') return `I checked the V1 boundary: ${check} is blocked in this runtime. Codex must run workspace regression from the branch, and CubiQo will report that result instead of pretending it ran it.`;
    return `${check} failed. ${String(result.stderr || '').slice(0, 240)}`;
  }
  if (strongWriteRequest) {
    trace.push({ tool: 'approval_boundary', status: 'blocked', summary: 'V1 cannot perform write or external actions' });
    return 'V1 is read-only. I can inspect and explain, but I cannot change files, deploy, submit applications, post content, or send anything until the V2 approval and audit system exists.';
  }
  if (isCapabilityPlanningRequest(message)) {
    const plan = capabilityPlanForText(message);
    trace.push({ tool: 'capability_plan', status: 'completed', summary: `${plan.matchedDomains.length} capability domains mapped` });
    const labels = plan.matchedDomains.map(domain => domain.label).join(', ');
    const v2Tools = [...new Set(plan.matchedDomains.flatMap(domain => domain.v2ToolsRequired))].slice(0, 6).join('; ');
    return `I mapped this to ${labels}. V1 can understand context, plan strategy, draft assets, and prepare structured workflows. V2 must add approved action tools for: ${v2Tools}.`;
  }
  if (/(change|edit|write|commit|push|deploy|apply|submit|post|send|buy|purchase|delete|update).*(file|code|app|site|prod|production|branch|job|application|social|content)?/.test(lower)) {
    trace.push({ tool: 'approval_boundary', status: 'blocked', summary: 'V1 cannot perform write or external actions' });
    return 'V1 is read-only. I can inspect and explain, but I cannot change files, deploy, submit applications, post content, or send anything until the V2 approval and audit system exists.';
  }
  if (/(stack|built|framework|next|react|routes|repo|code|self|yourself|implementation)/.test(lower)) {
    const stack = await repoStackSummary();
    trace.push({ tool: 'repo_stack_summary', status: 'completed', summary: 'inspected package, stack, scripts, and routes' });
    return `I inspected the repo. CubiQo is currently ${stack.stack.framework} with React ${stack.stack.react}, Supabase ${stack.stack.supabase}, and AI SDK ${stack.stack.ai}. The active app routes include ${stack.routes.map(route => route.route).join(', ')}.`;
  }
  const rgy = {
    green: hits(message, goalTerms),
    yellow: hits(message, casualTerms),
    red: hits(message, gatedTerms)
  };
  trace.push({ tool: 'classify_rgy', status: 'completed', summary: 'classified RGY keywords' });
  return `I can handle this conversationally in V1. I classified the active signal as ${rgy.red.length ? 'red' : rgy.green.length ? 'green' : 'yellow'} and I will stay read-only unless you approve a later V2 action system.`;
}
