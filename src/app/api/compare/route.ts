/**
 * POST /api/compare
 * AI Comparison Studio — runs the same prompt through multiple models in parallel
 * and returns structured results with cost, latency, and output for each.
 *
 * Models: claude-sonnet-4-6, gpt-4o, gemini-2.0-flash, grok-3-mini (where keys present)
 * Auth: optional — works for anon users too, but tracked for cost attribution
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 55;

// ── Model catalogue ──────────────────────────────────────────────────────────

type ModelSpec = {
  id: string;
  label: string;
  provider: 'anthropic' | 'openai' | 'google' | 'xai';
  model: string;
  inputCostPer1k: number;  // USD per 1k input tokens (estimate)
  outputCostPer1k: number;
};

const MODELS: ModelSpec[] = [
  {
    id: 'claude-sonnet',
    label: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    model: 'gpt-4o',
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    provider: 'openai',
    model: 'gpt-4o-mini',
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
  },
  {
    id: 'gemini-flash',
    label: 'Gemini 2.0 Flash',
    provider: 'google',
    model: 'gemini-2.0-flash',
    inputCostPer1k: 0.000075,
    outputCostPer1k: 0.0003,
  },
  {
    id: 'grok-3-mini',
    label: 'Grok-3 mini',
    provider: 'xai',
    model: 'grok-3-mini',
    inputCostPer1k: 0.0003,
    outputCostPer1k: 0.0005,
  },
];

// ── Provider clients ─────────────────────────────────────────────────────────

function getOpenAIClient() {
  return process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;
}

function getAnthropicClient() {
  return process.env.ANTHROPIC_API_KEY ? { apiKey: process.env.ANTHROPIC_API_KEY } : null;
}

function getGeminiBaseURL() {
  return 'https://generativelanguage.googleapis.com/v1beta/openai';
}

function getXAIClient() {
  return process.env.XAI_API_KEY
    ? new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' })
    : null;
}

// ── Per-model runners ────────────────────────────────────────────────────────

type RunResult = {
  modelId: string;
  label: string;
  output: string | null;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  error: string | null;
};

async function runAnthropic(spec: ModelSpec, prompt: string, system?: string): Promise<RunResult> {
  const start = performance.now();
  const base: RunResult = {
    modelId: spec.id, label: spec.label,
    output: null, latencyMs: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, error: null,
  };
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ...base, error: 'ANTHROPIC_API_KEY not set' };
  }
  try {
    const messages: Array<{ role: string; content: string }> = [{ role: 'user', content: prompt }];
    const body: Record<string, unknown> = {
      model: spec.model,
      max_tokens: 1024,
      messages,
    };
    if (system) body.system = system;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json() as {
      content?: Array<{ type: string; text: string }>;
      usage?: { input_tokens: number; output_tokens: number };
      error?: { message: string };
    };
    if (!res.ok) return { ...base, error: data?.error?.message || `HTTP ${res.status}`, latencyMs: performance.now() - start };

    const text = data.content?.find(c => c.type === 'text')?.text ?? '';
    const inTok = data.usage?.input_tokens ?? 0;
    const outTok = data.usage?.output_tokens ?? 0;
    return {
      ...base,
      output: text,
      latencyMs: Math.round(performance.now() - start),
      inputTokens: inTok,
      outputTokens: outTok,
      costUsd: (inTok / 1000) * spec.inputCostPer1k + (outTok / 1000) * spec.outputCostPer1k,
    };
  } catch (err) {
    return { ...base, error: String(err), latencyMs: Math.round(performance.now() - start) };
  }
}

async function runOpenAICompat(
  spec: ModelSpec,
  prompt: string,
  system?: string,
  client?: OpenAI | null,
): Promise<RunResult> {
  const start = performance.now();
  const base: RunResult = {
    modelId: spec.id, label: spec.label,
    output: null, latencyMs: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, error: null,
  };
  if (!client) {
    const envName = spec.provider === 'openai' ? 'OPENAI_API_KEY'
      : spec.provider === 'xai' ? 'XAI_API_KEY'
      : 'GOOGLE_AI_API_KEY';
    return { ...base, error: `${envName} not set` };
  }
  try {
    const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (system) msgs.push({ role: 'system', content: system });
    msgs.push({ role: 'user', content: prompt });

    const completion = await client.chat.completions.create({
      model: spec.model,
      messages: msgs,
      max_tokens: 1024,
    });

    const inTok = completion.usage?.prompt_tokens ?? 0;
    const outTok = completion.usage?.completion_tokens ?? 0;
    return {
      ...base,
      output: completion.choices[0]?.message?.content ?? '',
      latencyMs: Math.round(performance.now() - start),
      inputTokens: inTok,
      outputTokens: outTok,
      costUsd: (inTok / 1000) * spec.inputCostPer1k + (outTok / 1000) * spec.outputCostPer1k,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ...base, error: msg, latencyMs: Math.round(performance.now() - start) };
  }
}

async function runGemini(spec: ModelSpec, prompt: string, system?: string): Promise<RunResult> {
  const start = performance.now();
  const base: RunResult = {
    modelId: spec.id, label: spec.label,
    output: null, latencyMs: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, error: null,
  };
  if (!process.env.GOOGLE_AI_API_KEY) {
    return { ...base, error: 'GOOGLE_AI_API_KEY not set' };
  }
  // Gemini supports OpenAI-compat endpoint
  const geminiClient = new OpenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
    baseURL: getGeminiBaseURL(),
  });
  return runOpenAICompat(spec, prompt, system, geminiClient);
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

async function runModel(spec: ModelSpec, prompt: string, system?: string): Promise<RunResult> {
  switch (spec.provider) {
    case 'anthropic': return runAnthropic(spec, prompt, system);
    case 'openai':    return runOpenAICompat(spec, prompt, system, getOpenAIClient());
    case 'google':    return runGemini(spec, prompt, system);
    case 'xai':       return runOpenAICompat(spec, prompt, system, getXAIClient());
    default:          return { modelId: spec.id, label: spec.label, output: null, latencyMs: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, error: 'Unknown provider' };
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { prompt?: string; system?: string; models?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt, system, models: requestedModels } = body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  // Filter to requested models (or all)
  const toRun = requestedModels?.length
    ? MODELS.filter(m => requestedModels.includes(m.id))
    : MODELS;

  if (!toRun.length) {
    return NextResponse.json({ error: 'No valid model IDs specified' }, { status: 400 });
  }

  // Run all in parallel
  const results = await Promise.all(toRun.map(spec => runModel(spec, prompt.trim(), system)));

  const totalCost = results.reduce((s, r) => s + r.costUsd, 0);
  const fastest = results.filter(r => r.output).sort((a, b) => a.latencyMs - b.latencyMs)[0]?.modelId ?? null;
  const cheapest = results.filter(r => r.output).sort((a, b) => a.costUsd - b.costUsd)[0]?.modelId ?? null;

  return NextResponse.json({
    prompt: prompt.trim(),
    results,
    summary: {
      totalCostUsd: Math.round(totalCost * 1e6) / 1e6,
      fastest,
      cheapest,
      modelsRun: results.length,
      modelsSucceeded: results.filter(r => r.output !== null).length,
    },
  });
}

// ── Available models listing ─────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    models: MODELS.map(m => ({
      id: m.id,
      label: m.label,
      provider: m.provider,
      available: (
        (m.provider === 'anthropic' && !!process.env.ANTHROPIC_API_KEY) ||
        (m.provider === 'openai'    && !!process.env.OPENAI_API_KEY) ||
        (m.provider === 'google'    && !!process.env.GOOGLE_AI_API_KEY) ||
        (m.provider === 'xai'       && !!process.env.XAI_API_KEY)
      ),
      inputCostPer1k: m.inputCostPer1k,
      outputCostPer1k: m.outputCostPer1k,
    })),
  });
}
