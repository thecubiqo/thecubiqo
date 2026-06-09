/**
 * Market Watch Cron — Phase F6
 * Runs every 6 hours. Monitors per-user keyword subscriptions.
 * Pushes alerts when findings are materially different from previous results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cleanEnv } from '../../_lib/supabase-admin';
import { webSearch } from '../../_lib/web-search';

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

function isMateriallyDifferent(newHash: string, oldHash: string | null): boolean {
  return !oldHash || newHash !== oldHash;
}

function isTimeSensitive(summaries: string[]): { sensitive: boolean; reason: string } {
  const combined = summaries.join(' ').toLowerCase();
  const urgencyPatterns = [
    { pattern: /deadline|closes? (in|on|by)|applications? (close|due)|last day|final day/, reason: 'Deadline detected' },
    { pattern: /raised|funding|series [a-d]|seed round|million|acquired|acquisition/, reason: 'Funding/acquisition news' },
    { pattern: /shutting? down|shut down|bankruptcy|bankrupt|acquired by/, reason: 'Platform risk detected' },
    { pattern: /price increase|pricing change|new pricing|rate increase/, reason: 'Pricing change detected' },
    { pattern: /outage|down|not working|service disruption/, reason: 'Service disruption' }
  ];

  for (const { pattern, reason } of urgencyPatterns) {
    if (pattern.test(combined)) {
      return { sensitive: true, reason };
    }
  }
  return { sensitive: false, reason: '' };
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = adminClient();
  const checkDue = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  // Find subscriptions due for checking
  const { data: subscriptions } = await supabase
    .from('market_watch_subscriptions')
    .select('id, user_id, briefing_id, domain, keywords, alert_threshold, last_results_hash')
    .eq('active', true)
    .or(`last_checked_at.is.null,last_checked_at.lt.${checkDue}`)
    .limit(15); // process 15 per run max

  if (!subscriptions?.length) {
    return NextResponse.json({ checked: 0, alerts: 0, message: 'No subscriptions due' });
  }

  let checked = 0;
  let alerts = 0;

  for (const sub of subscriptions) {
    try {
      const keywords: string[] = sub.keywords || [];
      if (!keywords.length) continue;

      // Search the primary keyword
      const primaryQuery = keywords[0];
      const searchResult = await webSearch(primaryQuery, 5);
      const summaries = (searchResult.results || []).map(r => r.snippet || r.title);
      const resultsHash = simpleHash(summaries.join(''));

      // Update last_checked_at
      await supabase
        .from('market_watch_subscriptions')
        .update({
          last_checked_at: new Date().toISOString(),
          last_results_hash: resultsHash
        })
        .eq('id', sub.id);

      checked++;

      // Check if materially different
      if (!isMateriallyDifferent(resultsHash, sub.last_results_hash)) continue;

      // Check for time-sensitive findings
      const { sensitive, reason } = isTimeSensitive(summaries);

      // Determine if we should alert based on threshold
      const shouldAlert = sensitive ||
        sub.alert_threshold === 'low' ||
        (sub.alert_threshold === 'medium' && summaries.length > 0);

      if (!shouldAlert) continue;

      // Send push alert
      const alertTitle = sensitive
        ? `⚡ ${reason}: ${sub.domain}`
        : `New intel for your ${sub.domain} goal`;

      const alertMessage = summaries[0]?.slice(0, 150) ||
        `New developments found for "${primaryQuery}"`;

      if (baseUrl) {
        await fetch(`${baseUrl}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cubiqo-internal': process.env.CRON_SECRET || '',
            'x-user-id': sub.user_id
          },
          body: JSON.stringify({
            userId: sub.user_id,
            title: alertTitle,
            message: alertMessage,
            url: sub.briefing_id ? `/?briefing=${sub.briefing_id}&duo=1` : '/'
          })
        });
        alerts++;
      }
    } catch (err) {
      console.error('[market-watch] error for subscription', sub.id, err);
    }
  }

  return NextResponse.json({ checked, alerts, total_subscriptions: subscriptions.length });
}
