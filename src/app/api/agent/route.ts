import { NextRequest, NextResponse } from 'next/server';
import { createCubiQoAgent, buildFallbackAgentAnswer, type AgentTraceItem } from '@/next/lib/ai/cubiqo-agent';

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
  const deterministicBoundary =
    /(change|edit|write|commit|push|deploy|apply|submit|post|send|buy|purchase|delete|update)/.test(lower)
    || /(test|tests|regression|typecheck|verify|check)/.test(lower);

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
