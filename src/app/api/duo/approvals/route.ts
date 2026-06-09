/**
 * Pending duo_approvals list — used by <CubiQoOverlays> to poll for
 * approval cards that need to float over the hero.
 *
 * Source: CubiQo-PhaseB.md §B8 Approval Gate + UI Architecture §Card System.
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
  const status = url.searchParams.get('status') || 'pending';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '5', 10), 25);

  const { data: approvals, error } = await supabase
    .from('duo_approvals')
    .select(
      'id, project_id, task_id, action_type, preview_content, on_reject_note, reversible, reversible_window_seconds, expires_at, platform, endpoint, status, created_at, capsule_color:projects_color'
    )
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error && safeTableMissing(error)) {
    return NextResponse.json({ approvals: [], migrationPending: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ approvals: approvals || [] });
}
