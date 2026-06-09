import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getBearerToken, getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const paramsSchema = z.object({ id: z.string().uuid() });

type HandoffContent = {
  from_surface: string;
  to_surface: string;
  artifact_payload: Record<string, unknown>;
  created_at: string;
};

function parseHandoffContent(content: unknown, metadata: unknown): HandoffContent {
  if (content && typeof content === 'object') return content as HandoffContent;
  if (typeof content === 'string') {
    try {
      return JSON.parse(content) as HandoffContent;
    } catch {
      // Fall through to metadata.
    }
  }
  return metadata as HandoffContent;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid handoff id' }, { status: 400 });
  }

  const { data: artifact, error } = await supabase
    .from('duo_artifacts')
    .select(
      'id, project_id, task_id, type, artifact_type, content, metadata, produced_by, consumed_by, expires_at, consumed_at, created_at'
    )
    .eq('id', parsedParams.data.id)
    .or('type.eq.handoff,artifact_type.eq.handoff')
    .maybeSingle();

  if (error || !artifact) {
    return NextResponse.json({ error: 'Handoff not found' }, { status: 404 });
  }

  const { data: project } = await supabase
    .from('duo_projects')
    .select('id')
    .eq('id', artifact.project_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (artifact.expires_at && new Date(artifact.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Handoff expired', expired_at: artifact.expires_at },
      { status: 410 }
    );
  }

  if (artifact.consumed_at) {
    return NextResponse.json(
      { error: 'Handoff already consumed', consumed_at: artifact.consumed_at },
      { status: 409 }
    );
  }

  await supabase
    .from('duo_artifacts')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', parsedParams.data.id);

  const content = parseHandoffContent(artifact.content, artifact.metadata);

  return NextResponse.json({
    handoff_id: artifact.id,
    task_id: artifact.task_id,
    project_id: artifact.project_id,
    from_surface: content.from_surface,
    to_surface: content.to_surface,
    artifact_payload: content.artifact_payload,
    created_at: content.created_at,
    expires_at: artifact.expires_at
  });
}
