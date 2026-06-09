/**
 * Briefing Refresh Cron — Phase E
 * Runs every 6 hours. Re-runs reconnaissance for stale briefings.
 * Only pushes when findings differ materially from previous results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cleanEnv } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 55;

function adminClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h.toString(36);
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = adminClient();
  const staleThreshold = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  // Find stale ready briefings
  const { data: staleBriefings } = await supabase
    .from('capsule_briefings')
    .select('id, user_id, signal_id, domain, headline, research_results')
    .eq('status', 'ready')
    .lt('updated_at', staleThreshold)
    .limit(20);

  if (!staleBriefings?.length) {
    return NextResponse.json({ refreshed: 0, message: 'No stale briefings found' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  let refreshed = 0;

  for (const briefing of staleBriefings) {
    try {
      // Re-trigger background agent for this signal
      if (baseUrl) {
        await fetch(`${baseUrl}/api/agent/background`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cubiqo-internal': process.env.CRON_SECRET || ''
          },
          body: JSON.stringify({
            signal_id: briefing.signal_id,
            user_id: briefing.user_id,
            capsule: { keyword: briefing.domain },
            is_refresh: true
          })
        });
        refreshed++;
      }
    } catch (err) {
      console.error('[refresh-briefings] error for briefing', briefing.id, err);
    }
  }

  return NextResponse.json({ refreshed, total_stale: staleBriefings.length });
}
