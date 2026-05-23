import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('media_generations')
    .select('id,media_type,prompt,status,storage_url,storage_path,created_at,completed_at,expires_at')
    .eq('user_id', auth.user.id)
    .in('status', ['complete', 'completed'])
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}
