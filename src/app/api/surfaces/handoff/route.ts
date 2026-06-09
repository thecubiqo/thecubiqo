import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getBearerToken, getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const handoffSchema = z.object({
  from_surface: z.string().min(1).max(80),
  to_surface: z.string().min(1).max(80),
  task_id: z.string().uuid(),
  project_id: z.string().uuid(),
  artifact_payload: z.record(z.unknown())
});

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const token = getBearerToken(request);
  if (!token || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = handoffSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid handoff payload' }, { status: 400 });
  }

  const { from_surface, to_surface, task_id, project_id, artifact_payload } = parsed.data;

  const { data: project } = await supabase
    .from('duo_projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const content = {
    from_surface,
    to_surface,
    artifact_payload,
    created_at: now
  };

  const { data: artifact, error } = await supabase
    .from('duo_artifacts')
    .insert({
      user_id: user.id,
      project_id,
      task_id,
      trace_id: crypto.randomUUID(),
      artifact_type: 'handoff',
      type: 'handoff',
      title: `Surface handoff: ${from_surface} to ${to_surface}`,
      content: JSON.stringify(content),
      metadata: content,
      produced_by: from_surface,
      consumed_by: [to_surface],
      expires_at: expiresAt,
      created_at: now
    })
    .select('id')
    .single();

  if (error || !artifact) {
    console.error('[handoff] insert error:', error?.message);
    return NextResponse.json({ error: 'Failed to create handoff' }, { status: 500 });
  }

  return NextResponse.json({
    handoff_id: artifact.id,
    expires_at: expiresAt,
    to_surface
  });
}
