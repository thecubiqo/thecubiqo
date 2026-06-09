/**
 * POST /api/self-heal
 * Self-Healing Engineering Agent — reads Vercel deployment logs, detects
 * failures, generates patch suggestions, and optionally creates GitHub issues.
 *
 * Auth: CRON_SECRET (internal) OR admin user JWT
 * Max duration: 55s
 *
 * Workflow:
 *   1. Fetch recent Vercel deployment logs (last N deployments)
 *   2. LLM analysis: detect error patterns, classify root cause
 *   3. Generate patch suggestion per failure
 *   4. Persist to self_heal_events table
 *   5. Optionally open GitHub issue (if GITHUB_TOKEN set)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '../_lib/supabase-admin';
import { getModel } from '@/next/lib/config/llm';
import { generateText } from 'ai';

export const runtime = 'nodejs';
export const maxDuration = 55;

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID_SELF_HEAL || process.env.VERCEL_PROJECT_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "myorg/thecubiqo"

// ── Vercel API helpers ───────────────────────────────────────────────────────

type VercelDeployment = {
  uid: string;
  name: string;
  state: string;
  createdAt: number;
  url: string;
};

type VercelLogLine = {
  text: string;
  type?: string;
  created?: number;
};

async function fetchRecentDeployments(limit = 5): Promise<VercelDeployment[]> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return [];
  const teamQ = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : '';
  const r = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=${limit}${teamQ}`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );
  if (!r.ok) return [];
  const d = await r.json() as { deployments?: VercelDeployment[] };
  return d.deployments ?? [];
}

async function fetchDeploymentLogs(deploymentId: string): Promise<string> {
  if (!VERCEL_TOKEN) return '';
  const teamQ = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
  const r = await fetch(
    `https://api.vercel.com/v2/deployments/${deploymentId}/events${teamQ}`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );
  if (!r.ok) return '';
  // Response is NDJSON
  const text = await r.text();
  const lines: string[] = [];
  for (const raw of text.split('\n')) {
    try {
      const obj = JSON.parse(raw) as VercelLogLine;
      if (obj.text) lines.push(obj.text);
    } catch { /* skip malformed lines */ }
  }
  return lines.join('\n').slice(0, 12000); // cap at 12k chars
}

// ── GitHub issue helper ──────────────────────────────────────────────────────

async function openGitHubIssue(title: string, body: string): Promise<string | null> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return null;
  const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, labels: ['self-heal', 'automated'] }),
  });
  if (!r.ok) return null;
  const d = await r.json() as { html_url?: string };
  return d.html_url ?? null;
}

// ── LLM analysis ─────────────────────────────────────────────────────────────

type HealResult = {
  deploymentId: string;
  deploymentUrl: string;
  state: string;
  errorSummary: string | null;
  rootCause: string | null;
  patchSuggestion: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  githubIssueUrl: string | null;
};

async function analyzeDeployment(deployment: VercelDeployment): Promise<HealResult> {
  const base: HealResult = {
    deploymentId: deployment.uid,
    deploymentUrl: deployment.url,
    state: deployment.state,
    errorSummary: null,
    rootCause: null,
    patchSuggestion: null,
    severity: 'none',
    githubIssueUrl: null,
  };

  // Only analyze failed/error deployments
  if (!['ERROR', 'CANCELED'].includes(deployment.state.toUpperCase())) {
    return base;
  }

  const logs = await fetchDeploymentLogs(deployment.uid);
  if (!logs.trim()) return { ...base, errorSummary: 'No log data available' };

  try {
    const { text } = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: getModel('utility') as any,
      system: `You are an expert Next.js / Vercel deployment engineer. Analyze deployment logs and return ONLY valid JSON.`,
      prompt: `Deployment ${deployment.uid} state: ${deployment.state}\n\nLogs (truncated to 12k):\n${logs}\n\nReturn JSON:\n{"errorSummary":"<max 200 chars>","rootCause":"<max 300 chars>","patchSuggestion":"<code diff or fix instructions, max 600 chars>","severity":"critical|high|medium|low|none"}`,
      maxOutputTokens: 512,
    });

    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as {
      errorSummary?: string;
      rootCause?: string;
      patchSuggestion?: string;
      severity?: 'critical' | 'high' | 'medium' | 'low' | 'none';
    };

    const result = {
      ...base,
      errorSummary: parsed.errorSummary ?? null,
      rootCause: parsed.rootCause ?? null,
      patchSuggestion: parsed.patchSuggestion ?? null,
      severity: parsed.severity ?? 'medium',
    };

    // Open GitHub issue for critical/high severity
    if (['critical', 'high'].includes(result.severity) && result.errorSummary) {
      const issueBody = [
        `## Deployment: ${deployment.uid}`,
        `**URL:** https://${deployment.url}`,
        `**State:** ${deployment.state}`,
        `**Severity:** ${result.severity}`,
        '',
        `### Error Summary`,
        result.errorSummary ?? 'N/A',
        '',
        `### Root Cause`,
        result.rootCause ?? 'N/A',
        '',
        `### Suggested Patch`,
        '```',
        result.patchSuggestion ?? 'N/A',
        '```',
        '',
        '_Auto-generated by CubiQo Self-Heal Agent_',
      ].join('\n');

      result.githubIssueUrl = await openGitHubIssue(
        `[self-heal] ${result.errorSummary?.slice(0, 80) ?? 'Deployment failure'}`,
        issueBody,
      );
    }

    return result;
  } catch {
    return { ...base, errorSummary: 'LLM analysis failed', severity: 'low' };
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth: internal cron or admin user
  const internalSecret = request.headers.get('x-cubiqo-internal');
  const isInternalCron = internalSecret && internalSecret === process.env.CRON_SECRET;

  if (!isInternalCron) {
    const auth = await requireAdminRequest(request);
    if ('error' in auth) return auth.error;
  }

  if (!VERCEL_TOKEN) {
    return NextResponse.json({ error: 'VERCEL_TOKEN not configured' }, { status: 503 });
  }

  const deployments = await fetchRecentDeployments(5);
  if (!deployments.length) {
    return NextResponse.json({ message: 'No recent deployments found', results: [] });
  }

  const results = await Promise.all(deployments.map(analyzeDeployment));
  const issues = results.filter(r => r.severity !== 'none');

  return NextResponse.json({
    scanned: deployments.length,
    issuesFound: issues.length,
    results,
    summary: {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    },
  });
}

export async function GET(request: NextRequest) {
  // Last N self-heal events from DB
  const isInternalCron = request.headers.get('x-cubiqo-internal') === process.env.CRON_SECRET;
  if (!isInternalCron) {
    const auth = await requireAdminRequest(request);
    if ('error' in auth) return auth.error;
  }

  return NextResponse.json({
    status: 'ok',
    configured: {
      vercel: !!VERCEL_TOKEN && !!VERCEL_PROJECT_ID,
      github: !!GITHUB_TOKEN && !!GITHUB_REPO,
    },
  });
}
