/**
 * CQ-to-CQ message thread list — used by the /messenger page.
 *
 * Source: CubiQo-PhaseA.md §5.2 Social Layer / CQ-to-CQ Messaging.
 * Returns the threads the signed-in user is a party to, ordered by most
 * recent activity. Falls back to empty list with `migrationPending: true`
 * if the schema isn't in place yet so the UI can render the canonical
 * "share your CQ Number to start a thread" empty state.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const { data: threads, error } = await supabase
    .from('cq_threads')
    .select(
      'id, peer_user_id, peer_cq_number, peer_display_name, last_message_preview, unread_count, updated_at'
    )
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error && safeTableMissing(error)) {
    return NextResponse.json({ threads: [], migrationPending: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    threads: (threads || []).map((t: any) => ({
      id: t.id,
      cq_number: t.peer_cq_number,
      display_name: t.peer_display_name,
      last_message_preview: t.last_message_preview,
      unread_count: t.unread_count ?? 0,
      updated_at: t.updated_at
    }))
  });
}
