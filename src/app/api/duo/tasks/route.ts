/**
 * Duo tasks filter — used by <CubiQoOverlays> to poll for question
 * cards (status=awaiting_user) that need user input to unblock.
 *
 * Source: CubiQo-PhaseB.md §B7 Tool Execution / §B8 Approval Gate.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const url = new URL(request.url);
  // UI says "awaiting_user"; the schema value (duo_tasks_status_check) is
  // 'waiting_user'. Map it, and select only columns duo_tasks actually has.
  const rawStatus = url.searchParams.get('status') || 'awaiting_user';
  const status = rawStatus === 'awaiting_user' ? 'waiting_user' : rawStatus;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '5', 10), 25);

  const { data: tasks, error } = await supabase
    .from('duo_tasks')
    .select(
      'id, project_id, title, question_text:description, status, created_at'
    )
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error && safeTableMissing(error)) {
    return NextResponse.json({ tasks: [], migrationPending: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: tasks || [] });
}
