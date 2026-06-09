/**
 * GET /api/admin/vercel-logs
 * Streams recent Vercel deployment logs for the current project.
 *
 * Query params:
 *   ?deploymentId=dpl_xxx   — logs for a specific deployment (default: latest)
 *   ?limit=50               — number of log lines
 *   ?type=error|build|all   — filter log type
 *
 * GET /api/admin/vercel-logs/deployments
 *   — list recent deployments with status
 *
 * Requires VERCEL_TOKEN + VERCEL_PROJECT_ID env vars.
 * Auth: admin JWT or CRON_SECRET internal header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser, requireApiUser } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

function vercelHeaders() {
  return { Authorization: `Bearer ${VERCEL_TOKEN}` };
}

function teamQuery(extra = '') {
  return VERCEL_TEAM_ID ? `${extra ? '&' : '?'}teamId=${VERCEL_TEAM_ID}` : '';
}

async function getLatestDeploymentId(): Promise<string | null> {
  const res = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=1&state=READY${teamQuery('&')}`,
    { headers: vercelHeaders() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.deployments?.[0]?.uid ?? null;
}

export async function GET(request: NextRequest) {
  // Internal cron call
  const internalSecret = process.env.CRON_SECRET;
  const isInternal = internalSecret && request.headers.get('x-cubiqo-internal') === internalSecret;

  if (!isInternal) {
    const auth = await requireApiUser(request);
    if (auth.error) return auth.error;
    const admin = await isAdminUser(auth.supabase, auth.user.id);
    if (!admin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  }

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json({ error: 'VERCEL_TOKEN or VERCEL_PROJECT_ID not configured' }, { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const isDeploymentsList = request.url.includes('/deployments');
  const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);

  // ── List deployments ──────────────────────────────────────────────────────
  if (isDeploymentsList) {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=${limit}${teamQuery('&')}`,
      { headers: vercelHeaders() }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Vercel API error ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    const deployments = (data.deployments ?? []).map((d: any) => ({
      id: d.uid,
      url: d.url,
      state: d.state,
      createdAt: new Date(d.createdAt).toISOString(),
      readyAt: d.ready ? new Date(d.ready).toISOString() : null,
      meta: { branch: d.meta?.githubCommitRef, sha: d.meta?.githubCommitSha?.slice(0, 7) },
      errorMessage: d.errorMessage ?? null,
    }));
    return NextResponse.json({ deployments, count: deployments.length });
  }

  // ── Fetch deployment logs ─────────────────────────────────────────────────
  let deploymentId = params.get('deploymentId');
  if (!deploymentId) {
    deploymentId = await getLatestDeploymentId();
    if (!deploymentId) {
      return NextResponse.json({ error: 'Could not find latest deployment' }, { status: 404 });
    }
  }

  const typeFilter = params.get('type') || 'all';

  const res = await fetch(
    `https://api.vercel.com/v2/deployments/${deploymentId}/events?limit=${limit}${teamQuery('&')}`,
    { headers: vercelHeaders() }
  );

  if (!res.ok) {
    return NextResponse.json({ error: `Vercel log fetch error ${res.status}` }, { status: 502 });
  }

  const raw = await res.text();

  // Vercel returns NDJSON (one JSON object per line)
  const lines = raw
    .split('\n')
    .filter(Boolean)
    .map(line => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);

  const filtered = typeFilter === 'all'
    ? lines
    : lines.filter((l: any) => l.type === typeFilter || (typeFilter === 'error' && l.type === 'stderr'));

  const logs = filtered.map((l: any) => ({
    type: l.type ?? 'stdout',
    text: l.payload?.text ?? l.text ?? JSON.stringify(l),
    date: l.date ? new Date(l.date).toISOString() : null,
  }));

  return NextResponse.json({
    deploymentId,
    count: logs.length,
    logs,
  });
}
