import { NextRequest, NextResponse } from 'next/server';
import { createCubiQoAgent, buildFallbackAgentAnswer, type AgentTraceItem } from '@/next/lib/ai/cubiqo-agent';
import { isCapabilityPlanningRequest } from '@/next/lib/ai/capability-map';
import { runLegacyVercelHandler } from '@/next/lib/legacy-vercel-adapter';

const legacyConverse = require('../../../../api/converse.js');

export const maxDuration = 30;
export const runtime = 'nodejs';

function normalizeRgy(message: string) {
  const lower = message.toLowerCase();
  const red = ['grindr', 'tinder', 'adult', 'explicit', 'nsfw', 'hookup'].filter(term => lower.includes(term));
  const green = ['linkedin', 'career', 'yoga', 'wellness', 'build', 'ship', 'launch', 'job', 'resume', 'routine', 'business', 'pod'].filter(term => lower.includes(term));
  const yellow = ['instagram', 'facebook', 'fb', 'insta', 'comfort', 'chat', 'friends', 'mood', 'movie'].filter(term => lower.includes(term));
  const color = red.length ? 'red' : green.length ? 'green' : 'yellow';
  return {
    color,
    label: color === 'red' ? 'Age-gated' : color === 'green' ? 'Goal' : 'Casual',
    intent_status: 'pending',
    suggested_intents: [],
    confirmed_intents: [],
    keyword: (color === 'red' ? red[0] : color === 'green' ? green[0] : yellow[0]) || color,
    color_is_ui_only: true,
    matching_enabled: false
  };
}

function agentToolsNeeded(message: string) {
  const lower = message.toLowerCase();
  return (
    /(repo|code|stack|route|routes|built|framework|implementation|self|yourself|what model|test|tests|regression|diagnostic|runtime|provider|supabase|vercel|nextjs|next\.js|react|agentic|what did you check|what can you inspect)/i.test(lower)
    || isCapabilityPlanningRequest(message)
    || /(change|edit|write|commit|push|deploy|apply|submit|post|send|buy|purchase|delete|update)/i.test(lower)
  );
}

async function delegateToConversation(request: NextRequest, body: Record<string, unknown>, message: string, trace: AgentTraceItem[]) {
  trace.push({
    tool: 'conversation_router',
    status: 'completed',
    summary: 'delegated simple chat to existing converse path'
  });

  const legacyRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      message,
      history: Array.isArray(body.history) ? body.history : [],
      model: body.model
    })
  });
  const legacyResponse = await runLegacyVercelHandler(legacyConverse, legacyRequest, 'POST');
  const legacyPayload = await legacyResponse.json().catch(() => ({}));

  return NextResponse.json({
    ...legacyPayload,
    mode: 'conversation-via-agent-v1',
    trace,
    rgy: legacyPayload && typeof legacyPayload === 'object' && 'rgy' in legacyPayload
      ? (legacyPayload as { rgy?: unknown }).rgy
      : normalizeRgy(message),
    tools_available: [
      'conversation_router',
      'runtime_status',
      'repo_stack_summary',
      'repo_list_routes',
      'repo_search',
      'repo_read_file',
      'run_check',
      'classify_rgy',
      'capability_plan'
    ],
    write_actions_enabled: false
  }, { status: legacyResponse.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const message = String(body.message || '').trim();
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const trace: AgentTraceItem[] = [];
  let response = '';
  let modelUsed = process.env.AI_GATEWAY_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-5.4';
  const lower = message.toLowerCase();
  const strongCheckRequest = /\b(run|execute|start)\b.*\b(test|tests|regression|typecheck|verify|check)\b/.test(lower);
  const strongWriteRequest =
    /\b(change|edit|write|commit|push|deploy)\b.*\b(now|this app|file|code|prod|production|branch)\b/.test(lower)
    || /\b(submit|send|buy|purchase|post)\b.*\b(now|for me|this)\b/.test(lower);
  const deterministicBoundary =
    strongCheckRequest
    || strongWriteRequest
    || (/(change|edit|write|commit|push|deploy|apply|submit|post|send|buy|purchase|delete|update)/.test(lower)
      && !isCapabilityPlanningRequest(message));

  if (!agentToolsNeeded(message)) {
    return delegateToConversation(request, body, message, trace);
  }

  if (deterministicBoundary) {
    response = await buildFallbackAgentAnswer(message, trace);
    return NextResponse.json({
      response,
      mode: 'agentic-read-only-v1',
      model_used: 'agent-local-boundary',
      trace,
      rgy: normalizeRgy(message),
      tools_available: [
        'runtime_status',
        'repo_stack_summary',
        'repo_list_routes',
        'repo_search',
        'repo_read_file',
        'run_check',
        'classify_rgy',
        'capability_plan'
      ],
      write_actions_enabled: false
    });
  }

  try {
    const agent = createCubiQoAgent(trace);
    const result = await agent.generate({
      prompt: [
        `User message: ${message}`,
        '',
        'If the message asks about CubiQo itself, inspect the repo before answering.',
        'Return a short answer and do not invent implementation facts.'
      ].join('\n')
    });
    response = result.text?.trim() || '';
    if (!response) throw new Error('Agent returned no text');
  } catch (error) {
    modelUsed = 'agent-local-fallback';
    response = await buildFallbackAgentAnswer(message, trace);
    trace.push({
      tool: 'agent_model',
      status: 'blocked',
      summary: error instanceof Error ? error.message.slice(0, 180) : 'model unavailable'
    });
  }

  return NextResponse.json({
    response,
    mode: 'agentic-read-only-v1',
    model_used: modelUsed,
    trace,
    rgy: normalizeRgy(message),
    tools_available: [
      'runtime_status',
      'repo_stack_summary',
      'repo_list_routes',
      'repo_search',
      'repo_read_file',
      'run_check',
      'classify_rgy',
      'capability_plan'
    ],
    write_actions_enabled: false
  });
}
