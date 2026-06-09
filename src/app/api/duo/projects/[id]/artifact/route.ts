/**
 * GET /api/duo/projects/[id]/artifact
 *
 * Returns the capsule's latest project-level "live view" artifact — the rich
 * dashboard (stats + results table + next actions) rendered in the artifact
 * pane the moment the capsule opens. The page calls this on load; the capsule
 * engine keeps it fresh via the tick endpoint.
 *
 * Shape: { artifact: { id, artifact_type:'view', title, content:<JSON string> } | null }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { getLatestView } from '@/next/lib/agent/capsule-engine';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  // Ownership check: confirm the project belongs to this user before exposing
  // anything tied to it (defence-in-depth on top of the user-scoped query).
  const { data: project } = await auth.supabase
    .from('duo_projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const artifact = await getLatestView(auth, id);
  return NextResponse.json({ artifact: artifact || null });
}
