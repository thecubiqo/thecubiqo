/**
 * Project Preview Lookup API
 *
 * GET /api/emergent/preview/[slug]
 *
 * Looks up a project by slug (subdomain) in the emergent_workspaces table
 * and returns its preview metadata. Used by the wildcard subdomain routing
 * to resolve <slug>.cubiqo.dev → running workspace preview.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid slug' },
        { status: 400 },
      );
    }

    const supabase = (await createClient()) as any;

    // Look up workspace by project name/slug matching the subdomain
    // First try by container_id prefix, then by project name
    const { data: workspace, error } = await supabase
      .from('emergent_workspaces')
      .select('id, project_id, name, runtime, status, preview_url, port, ip_address')
      .or(`name.ilike.${slug},container_id.ilike.${slug}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !workspace) {
      return NextResponse.json(
        { error: 'Project not found', slug },
        { status: 404 },
      );
    }

    // Build preview URL from workspace data if not explicitly set
    let previewUrl = workspace.preview_url;
    if (!previewUrl && workspace.ip_address && workspace.port) {
      previewUrl = `http://${workspace.ip_address}:${workspace.port}`;
    }

    return NextResponse.json({
      project: {
        id: workspace.project_id,
        workspaceId: workspace.id,
        name: workspace.name,
        status: workspace.status,
        runtime: workspace.runtime,
        previewUrl,
      },
    });
  } catch (err) {
    console.error('Preview lookup error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
