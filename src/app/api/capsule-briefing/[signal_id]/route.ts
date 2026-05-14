/**
 * Capsule Briefing API
 * GET  /api/capsule-briefing/[signal_id]  — returns briefing for a signal
 * PATCH /api/capsule-briefing/[signal_id] — marks action complete (adaptive briefing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

// ─────────────────────────────────────────────────────────────────────────────
// GET — fetch briefing by signal_id
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signal_id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const resolvedParams = await params;
  const { signal_id } = resolvedParams;
  if (!signal_id) {
    return NextResponse.json({ error: 'signal_id is required' }, { status: 400 });
  }

  const { data: briefing, error } = await auth.supabase
    .from('capsule_briefings')
    .select(`
      id, signal_id, domain, status, headline, context_summary,
      blockers, recommended_actions, open_questions, research_results,
      created_at, updated_at
    `)
    .eq('signal_id', signal_id)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!briefing) {
    return NextResponse.json({ briefing: null, status: 'not_found' });
  }

  // Fetch completed actions for this briefing
  const { data: completions } = await auth.supabase
    .from('briefing_action_completions')
    .select('action_index, completed_at, completion_note')
    .eq('briefing_id', briefing.id)
    .order('completed_at', { ascending: true });

  const completedIndexes = new Set((completions || []).map((c: any) => c.action_index));

  // Filter out completed actions from recommended_actions
  const pendingActions = (briefing.recommended_actions || []).filter(
    (_: any, i: number) => !completedIndexes.has(i)
  );

  return NextResponse.json({
    briefing: {
      ...briefing,
      recommended_actions: pendingActions,
      completed_actions: completions || []
    },
    status: briefing.status
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — mark action complete (adaptive briefing, F5)
// Body: { action_index: number, completion_note?: string }
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ signal_id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { signal_id } = await params;
  const body = await request.json().catch(() => ({}));
  const { action_index, completion_note } = body;

  if (typeof action_index !== 'number') {
    return NextResponse.json({ error: 'action_index (number) is required' }, { status: 400 });
  }

  // Verify briefing ownership
  const { data: briefing, error: fetchError } = await auth.supabase
    .from('capsule_briefings')
    .select('id, recommended_actions, status')
    .eq('signal_id', signal_id)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!briefing) return NextResponse.json({ error: 'Briefing not found' }, { status: 404 });

  // Record completion
  const { error: completionError } = await auth.supabase
    .from('briefing_action_completions')
    .insert({
      briefing_id: briefing.id,
      user_id: auth.user.id,
      action_index,
      completion_note: completion_note || null,
      completed_at: new Date().toISOString()
    });

  if (completionError) {
    return NextResponse.json({ error: completionError.message }, { status: 500 });
  }

  // Check if all actions are now complete → prompt outcome capture
  const { data: completions } = await auth.supabase
    .from('briefing_action_completions')
    .select('action_index')
    .eq('briefing_id', briefing.id);

  const completedCount = (completions || []).length;
  const totalActions = (briefing.recommended_actions || []).length;
  const allComplete = completedCount >= totalActions;

  if (allComplete && briefing.status === 'ready') {
    // Mark briefing as completed — trigger outcome capture
    await auth.supabase
      .from('capsule_briefings')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', briefing.id);
  }

  return NextResponse.json({
    ok: true,
    action_index,
    completed_count: completedCount,
    total_actions: totalActions,
    all_complete: allComplete,
    outcome_capture_prompted: allComplete
  });
}
