/**
 * GET /api/cron/self-heal
 * Scheduled cron trigger for the Self-Healing Engineering Agent.
 * Runs every 6 hours — scans recent Vercel deployments for failures
 * and generates patch suggestions.
 *
 * Vercel cron config: "0 SLASH6 * * *" in vercel.json (every 6 hours)
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 55;

function assertCron(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET || '';
  return Boolean(
    expected &&
    (request.headers.get('x-cubiqo-internal') === expected ||
     request.headers.get('authorization') === `Bearer ${expected}`)
  );
}

export async function GET(request: NextRequest) {
  if (!assertCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const selfHealUrl = new URL('/api/self-heal', request.url).toString();
    const res = await fetch(selfHealUrl, {
      method: 'POST',
      headers: {
        'x-cubiqo-internal': process.env.CRON_SECRET || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    return NextResponse.json({ cron: 'self-heal', ...data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
