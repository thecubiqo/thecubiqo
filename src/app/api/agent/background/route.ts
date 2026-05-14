/**
 * Background Intelligence Agent
 * Fires non-blocking after capsule creation. Runs reconnaissance,
 * builds a structured briefing, saves it, and pushes notification.
 *
 * Auth: internal x-cubiqo-internal header (CRON_SECRET)
 * Max duration: 55s (Vercel limit)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cleanEnv } from '../../_lib/supabase-admin';
import { detectDomain, buildReconQueries, parseBriefingFromAgentOutput, BRIEFING_OUTPUT_INSTRUCTION, shouldUseBrowserbase, type CapsuleShape, type BriefingStructure } from '@/next/lib/ai/reconnaissance';
import { getDomainAddendum } from '@/next/lib/ai/domain-addendums';
import { detectPatterns, formatPatternsForBriefing } from '@/next/lib/ai/pattern-detector';
import { webSearch } from '../../_lib/web-search';
import { getModel } from '@/next/lib/config/llm';
import { isPro } from '@/next/lib/billing/gates';

export const runtime = 'nodejs';
export const maxDuration = 55;

// ─────────────────────────────────────────────────────────────────────────────
// Supabase admin client (service role — not user-scoped)
// ─────────────────────────────────────────────────────────────────────────────

function adminClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// ─────────────────────────────────────────────────────────────────────────────
// Browserbase daily limit circuit breaker (F7-C)
// ─────────────────────────────────────────────────────────────────────────────

async function checkBrowserbaseLimit(supabase: any): Promise<boolean> {
  const dailyLimit = parseInt(process.env.BROWSERBASE_DAILY_LIMIT || '50', 10);
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase
    .from('browserbase_usage_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since);
  return (count ?? 0) < dailyLimit;
}

// ─────────────────────────────────────────────────────────────────────────────
// Load user context (memory, signals, career profile, prior briefings)
// ─────────────────────────────────────────────────────────────────────────────

async function loadUserContext(userId: string, authToken: string, supabase: any): Promise<string> {
  const parts: string[] = [];

  try {
    // Recent signals (last 25)
    const { data: signals } = await supabase
      .from('signals')
      .select('color, keyword, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(25);
    if (signals?.length) {
      parts.push('RECENT SIGNALS:\n' + signals
        .map((s: any) => `  [${s.color.toUpperCase()}] "${s.keyword}" (${s.created_at.split('T')[0]})`)
        .join('\n'));
    }

    // Memory events (last 12)
    const { data: memories } = await supabase
      .from('memory_events')
      .select('summary, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12);
    if (memories?.length) {
      parts.push('RECENT MEMORY:\n' + memories
        .map((m: any) => `  - ${m.summary}`)
        .join('\n'));
    }

    // Career profile
    const { data: profile } = await supabase
      .from('job_profiles')
      .select('target_roles, skills, preferred_locations, work_modes, salary_expectation, years_experience')
      .eq('user_id', userId)
      .maybeSingle();
    if (profile) {
      parts.push('CAREER PROFILE:\n' + JSON.stringify(profile, null, 2));
    }

    // Prior briefings for context (last 3)
    const { data: priorBriefings } = await supabase
      .from('capsule_briefings')
      .select('domain, headline, status, updated_at')
      .eq('user_id', userId)
      .eq('status', 'ready')
      .order('updated_at', { ascending: false })
      .limit(3);
    if (priorBriefings?.length) {
      parts.push('PRIOR BRIEFINGS:\n' + priorBriefings
        .map((b: any) => `  [${b.domain}] ${b.headline} (${b.updated_at.split('T')[0]})`)
        .join('\n'));
    }

    // User documents
    const { data: docs } = await supabase
      .from('user_documents')
      .select('document_type, url, storage_path, updated_at')
      .eq('user_id', userId);
    if (docs?.length) {
      parts.push('USER DOCUMENTS ON FILE:\n' + docs
        .map((d: any) => `  [${d.document_type}] ${d.url || d.storage_path}`)
        .join('\n'));
    }

    // Memory-to-action: find goals mentioned in memory that have no completed outcome
    // This surfaces "you mentioned X 3 weeks ago — is it still blocked?"
    const { data: outcomes } = await supabase
      .from('user_outcomes')
      .select('signal_id, domain, outcome_type')
      .eq('user_id', userId);
    const resolvedSignalIds = new Set((outcomes || []).map((o: any) => o.signal_id).filter(Boolean));

    const { data: oldSignals } = await supabase
      .from('signals')
      .select('id, color, keyword, created_at')
      .eq('user_id', userId)
      .eq('color', 'green')
      .lt('created_at', new Date(Date.now() - 7 * 86400000).toISOString()) // older than 7 days
      .order('created_at', { ascending: false })
      .limit(10);

    const stalledGoals = (oldSignals || []).filter((s: any) => !resolvedSignalIds.has(s.id));
    if (stalledGoals.length > 0) {
      parts.push('UNRESOLVED GOALS (mentioned but never completed):' +
        stalledGoals.map((s: any) =>
          `\n  - "${s.keyword}" started ${Math.floor((Date.now() - new Date(s.created_at).getTime()) / 86400000)} days ago — still open`
        ).join(''));
      parts.push('INSTRUCTION: If any unresolved goal above relates to the current capsule, explicitly connect them in your briefing. Tell the user what has been blocking this goal and what the next concrete move is.');
    }
  } catch (err) {
    console.error('[background] loadUserContext error:', err);
  }

  return parts.join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Run reconnaissance (parallel web searches)
// ─────────────────────────────────────────────────────────────────────────────

async function runReconnaissance(
  domain: string,
  keyword: string,
  userContext: string
): Promise<Array<{ query: string; summary: string; url?: string }>> {
  const queries = buildReconQueries(domain as any, keyword, userContext);
  const results: Array<{ query: string; summary: string; url?: string }> = [];

  // Run searches in parallel (max 5)
  const searches = await Promise.allSettled(
    queries.slice(0, 5).map(q => webSearch(q, 3))
  );

  for (let i = 0; i < searches.length; i++) {
    const result = searches[i];
    if (result.status === 'fulfilled' && result.value.results?.length) {
      const top = result.value.results[0];
      results.push({
        query: queries[i],
        summary: top.snippet || top.title,
        url: top.url
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build system prompt
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(
  domain: string,
  userContext: string,
  patternText: string,
  reconResults: Array<{ query: string; summary: string; url?: string }>
): string {
  const domainAddendum = getDomainAddendum(domain as any);

  const reconSection = reconResults.length > 0
    ? 'RESEARCH FINDINGS:\n' + reconResults
        .map(r => `  Query: "${r.query}"\n  Finding: ${r.summary}${r.url ? `\n  Source: ${r.url}` : ''}`)
        .join('\n\n')
    : 'No web search results available.';

  return `You are CubiQo's proactive intelligence agent. Your job is to analyse a user's capsule intent and produce a specific, actionable briefing.

${domainAddendum}

USER CONTEXT:
${userContext || 'No prior context available.'}

${patternText ? `DETECTED PATTERNS:\n${patternText}\n` : ''}

${reconSection}

IMPORTANT RULES:
1. Be SPECIFIC to this user's situation — not generic.
2. Reference real findings from the research above where possible.
3. Blockers must be real and specific to their domain and situation.
4. Actions must be concrete and ordered by effort (smallest first).
5. If you noticed a pattern, address it directly in your headline.

${BRIEFING_OUTPUT_INSTRUCTION}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Send push notification
// ─────────────────────────────────────────────────────────────────────────────

async function sendPushNotification(
  userId: string,
  domain: string,
  headline: string,
  signalId: string,
  supabase: any
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
    if (!baseUrl) return;

    // Get a service-role token for the push endpoint
    await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cubiqo-internal': process.env.CRON_SECRET || '',
        'x-user-id': userId
      },
      body: JSON.stringify({
        userId,
        title: `Your ${domain} briefing is ready`,
        message: headline.slice(0, 120),
        url: `/?signal=${signalId}&duo=1`
      })
    });
  } catch (err) {
    console.error('[background] push notification error:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-create market watch subscription
// ─────────────────────────────────────────────────────────────────────────────

async function autoCreateMarketWatch(
  userId: string,
  briefingId: string,
  domain: string,
  keyword: string,
  supabase: any
): Promise<void> {
  try {
    const keywords = [keyword, domain, `${domain} 2025`].filter(Boolean);
    await supabase.from('market_watch_subscriptions').insert({
      user_id: userId,
      briefing_id: briefingId,
      domain,
      keywords,
      alert_threshold: 'high',
      check_frequency_hours: 24,
      active: true
    });
  } catch (err) {
    console.error('[background] market watch subscription error:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule accountability follow-ups
// ─────────────────────────────────────────────────────────────────────────────

async function scheduleAccountabilityFollowups(
  userId: string,
  briefingId: string,
  actions: BriefingStructure['recommended_actions'],
  supabase: any
): Promise<void> {
  const effortToDelayMs: Record<string, number> = {
    '10min': 3 * 60 * 60 * 1000,       // 3 hours
    '1hr':   24 * 60 * 60 * 1000,      // next morning
    '1day':  2 * 24 * 60 * 60 * 1000,  // 2 days
    '1week': 4 * 24 * 60 * 60 * 1000   // 4 days
  };

  if (!actions?.length) return;

  try {
    // Get the soonest action's effort level for the first follow-up
    const firstAction = actions[0];
    const delayMs = effortToDelayMs[firstAction.effort] || effortToDelayMs['1day'];
    const followUpAt = new Date(Date.now() + delayMs).toISOString();

    // Store in run-schedules for the existing cron to pick up
    await supabase.from('scheduled_tasks').insert({
      user_id: userId,
      task_type: 'accountability_followup',
      run_at: followUpAt,
      payload: {
        briefing_id: briefingId,
        action_step: firstAction.step,
        action_effort: firstAction.effort,
        reminder_count: 0
      }
    }).select();
  } catch {
    // scheduled_tasks may not exist — non-critical
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Internal auth gate
  const internalSecret = request.headers.get('x-cubiqo-internal');
  if (!internalSecret || internalSecret !== (process.env.CRON_SECRET || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    signal_id?: string;
    user_id?: string;
    authToken?: string;
    capsule?: CapsuleShape;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { signal_id, user_id, authToken, capsule } = body;

  if (!signal_id || !user_id) {
    return NextResponse.json({ error: 'signal_id and user_id are required' }, { status: 400 });
  }

  const supabase = adminClient();
  if (!(await isPro(user_id))) {
    return NextResponse.json({ error: 'Pro subscription required', code: 'PRO_REQUIRED' }, { status: 402 });
  }

  // 1. Insert briefing row (status: running)
  const { data: briefingRow, error: insertError } = await supabase
    .from('capsule_briefings')
    .insert({
      signal_id,
      user_id,
      domain: 'general', // will be updated after domain detection
      status: 'running'
    })
    .select('id')
    .single();

  if (insertError || !briefingRow) {
    console.error('[background] failed to insert briefing row:', insertError);
    return NextResponse.json({ error: 'Failed to create briefing row' }, { status: 500 });
  }

  const briefingId = briefingRow.id;

  try {
    // 2. Detect domain
    const domain = detectDomain(capsule || {});

    // 3. Load user context
    const userContext = await loadUserContext(user_id, authToken || '', supabase);

    // 4. Detect patterns
    const patterns = await detectPatterns(user_id, domain, supabase);
    const patternText = formatPatternsForBriefing(patterns);

    // 5. Run reconnaissance (parallel web searches)
    const keyword = capsule?.keyword || capsule?.normalized_keyword || domain;
    const reconResults = await runReconnaissance(domain, keyword, userContext);

    // 6. Build system prompt
    const systemPrompt = buildSystemPrompt(domain, userContext, patternText, reconResults);

    // 7. Call LLM to synthesize briefing
    let agentOutput = '';
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: getModel('agent'),
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `The user's capsule: color=${capsule?.color || 'green'}, keyword="${keyword}". Intents: ${(capsule?.suggested_intents || []).join(', ') || 'none specified'}. Build their intelligence briefing now.`
          }
        ]
      });
      agentOutput = completion.choices[0]?.message?.content || '';
    } catch (llmErr) {
      console.error('[background] LLM call failed:', llmErr);
      // Fall through — we'll attempt to save a minimal briefing from recon results
      agentOutput = reconResults.length > 0
        ? reconResults.map(r => `- ${r.summary}`).join('\n')
        : 'Reconnaissance complete. Open Duo Mode to explore next steps.';
    }

    // 8. Parse briefing from agent output (F7-B multi-level fallback)
    let briefing = parseBriefingFromAgentOutput(agentOutput);

    // 9. Re-run with stricter prompt if parsing failed
    if (!briefing) {
      try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const retry = await openai.chat.completions.create({
          model: getModel('utility'),
          temperature: 0,
          max_tokens: 1500,
          messages: [
            { role: 'system', content: 'You output ONLY valid JSON. No prose. No markdown except the required fence.' },
            {
              role: 'user',
              content: `Parse this agent output into the required JSON format and output it wrapped in \`\`\`briefing fences:\n\n${agentOutput}`
            }
          ]
        });
        briefing = parseBriefingFromAgentOutput(retry.choices[0]?.message?.content || '');
      } catch {
        // If retry also fails, use minimal fallback
      }
    }

    // 10. Final fallback — construct minimal briefing from recon
    if (!briefing) {
      briefing = {
        headline: `Research complete for your ${domain} goal: "${keyword}"`,
        context_summary: `Completed reconnaissance across ${reconResults.length} search queries.`,
        blockers: [],
        recommended_actions: reconResults.slice(0, 3).map((r, i) => ({
          step: `Review: ${r.summary.slice(0, 100)}`,
          why: `Found during reconnaissance of "${r.query}"`,
          effort: (['10min', '1hr', '1day'] as const)[i] || '1hr'
        })),
        open_questions: [
          { question: `What is your most important milestone for this ${domain} goal this week?`, why_it_matters: 'Defines where to focus first.' }
        ]
      };
    }

    // 11. Save briefing (status: ready)
    const { error: updateError } = await supabase
      .from('capsule_briefings')
      .update({
        domain,
        status: 'ready',
        headline: briefing.headline,
        context_summary: briefing.context_summary,
        blockers: briefing.blockers || [],
        recommended_actions: briefing.recommended_actions || [],
        open_questions: briefing.open_questions || [],
        research_results: reconResults,
        raw_agent_output: agentOutput,
        updated_at: new Date().toISOString()
      })
      .eq('id', briefingId);

    if (updateError) {
      console.error('[background] failed to update briefing row:', updateError);
    }

    // 12. Push notification
    await sendPushNotification(user_id, domain, briefing.headline, signal_id, supabase);

    // 13. Auto-create market watch subscription
    await autoCreateMarketWatch(user_id, briefingId, domain, keyword, supabase);

    // 14. Schedule accountability follow-ups
    await scheduleAccountabilityFollowups(user_id, briefingId, briefing.recommended_actions, supabase);

    return NextResponse.json({ ok: true, briefing_id: briefingId, domain, headline: briefing.headline });

  } catch (err: any) {
    console.error('[background] fatal error:', err);

    // Mark briefing as failed
    await supabase
      .from('capsule_briefings')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', briefingId);

    return NextResponse.json({ error: err.message || 'Background agent failed' }, { status: 500 });
  }
}
