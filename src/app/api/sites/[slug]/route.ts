import { NextRequest, NextResponse } from 'next/server';
import { getBearerToken, getSupabaseAdmin, jsonError, safeTableMissing } from '../../_lib/supabase-admin';

const readSlug = async (context: { params: Promise<{ slug: string }> | { slug: string } }) => {
  const params = await context.params;
  return params.slug;
};

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonError('Supabase server configuration is missing', 500);

  const token = getBearerToken(request);
  const user = token ? (await supabase.auth.getUser(token)).data.user : null;
  const slug = await readSlug(context);

  const { data, error } = await supabase
    .from('sites')
    .select('id,user_id,slug,title,status,content,created_at,updated_at')
    .eq('slug', slug)
    .maybeSingle();

  if (safeTableMissing(error)) {
    return NextResponse.json({ migrationPending: true, error: 'sites is not available in Supabase yet' });
  }

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Site not found', 404);

  const isOwner = user?.id === data.user_id;
  if (data.status !== 'published' && !isOwner) {
    return jsonError('Site not found', 404);
  }

  return NextResponse.json({
    site: {
      id: data.id,
      slug: data.slug,
      title: data.title,
      status: data.status,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
      isOwner
    },
    migrationPending: false
  });
}
