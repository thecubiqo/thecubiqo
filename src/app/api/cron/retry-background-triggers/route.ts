/**
 * Retry Background Triggers Cron — Phase A / F7-A
 * Runs every 5 minutes. Retries failed background agent triggers (max 3 attempts).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cleanEnv } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

function adminClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = adminClient();
  const now = new Date().toISOString();

  const { data: failures } = await supabase
    .from('background_trigger_failures')
    .select('id, signal_id, user_id, retry_count')
    .eq('resolved', false)
    .lt('next_retry_at', now)
    .lt('retry_count', 3)
    .limit(10);

  if (!failures?.length) {
    return NextResponse.json({ retried: 0, message: 'No pending retries' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  let retried = 0;

  for (const failure of failures) {
    try {
      if (baseUrl) {
        const res = await fetch(`${baseUrl}/api/agent/background`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cubiqo-internal': process.env.CRON_SECRET || ''
          },
          body: JSON.stringify({
            signal_id: failure.signal_id,
            user_id: failure.user_id,
            capsule: { keyword: 'goal' }
          })
        });

        if (res.ok) {
          await supabase
            .from('background_trigger_failures')
            .update({ resolved: true })
            .eq('id', failure.id);
        } else {
          // Increment retry count with exponential backoff
          const backoffMs = Math.pow(2, failure.retry_count) * 60_000;
          await supabase
            .from('background_trigger_failures')
            .update({
              retry_count: failure.retry_count + 1,
              next_retry_at: new Date(Date.now() + backoffMs).toISOString()
            })
            .eq('id', failure.id);
        }
        retried++;
      }
    } catch (err) {
      console.error('[retry-triggers] error for failure', failure.id, err);
    }
  }

  return NextResponse.json({ retried, total_pending: failures.length });
}
