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
  const status = url.searchParams.get('status') || 'awaiting_user';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '5', 10), 25);

  const { data: tasks, error } = await supabase
    .from('duo_tasks')
    .select(
      'id, project_id, title, question_text, expires_at, status, created_at, capsule_color:projects_color'
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
