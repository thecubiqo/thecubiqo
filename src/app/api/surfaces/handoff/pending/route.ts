import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getBearerToken, getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const PENDING_HANDOFF_ROUTE = '/api/surfaces/handoff/pending';

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

export async function GET(request: NextRequest) {
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

  const surfaceType = request.nextUrl.searchParams.get('surface_type');
  if (!surfaceType) {
    return NextResponse.json({ error: 'surface_type query param required' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: projects } = await supabase
    .from('duo_projects')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['active', 'planning', 'paused']);

  const projectIds = (projects ?? []).map((project: { id: string }) => project.id);
  if (projectIds.length === 0) {
    return NextResponse.json({ handoffs: [] });
  }

  const { data: artifacts, error } = await supabase
    .from('duo_artifacts')
    .select('id, project_id, task_id, type, artifact_type, content, metadata, produced_by, expires_at, created_at')
    .or('type.eq.handoff,artifact_type.eq.handoff')
    .in('project_id', projectIds)
    .contains('consumed_by', [surfaceType])
    .is('consumed_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[handoff/pending] query error:', error.message);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  if (!artifacts || artifacts.length === 0) {
    return NextResponse.json({ handoffs: [] });
  }

  const ids = artifacts.map((artifact: { id: string }) => artifact.id);
  await supabase.from('duo_artifacts').update({ consumed_at: now }).in('id', ids);

  const handoffs = artifacts.map(
    (artifact: {
      id: string;
      project_id: string;
      task_id: string | null;
      content: unknown;
      metadata: unknown;
      expires_at: string | null;
    }) => {
      const content = parseHandoffContent(artifact.content, artifact.metadata);
      return {
        handoff_id: artifact.id,
        task_id: artifact.task_id,
        project_id: artifact.project_id,
        from_surface: content.from_surface,
        to_surface: content.to_surface,
        artifact_payload: content.artifact_payload,
        created_at: content.created_at,
        expires_at: artifact.expires_at
      };
    }
  );

  return NextResponse.json({ handoffs });
}
