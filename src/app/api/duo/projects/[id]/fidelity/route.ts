import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { getFidelityReport, runFidelityCheck } from '@/next/lib/duo/fidelity-checker';

export const runtime = 'nodejs';

async function assertProjectAccess(auth: Awaited<ReturnType<typeof requireApiUser>> & { error?: undefined }, projectId: string) {
  const { data: project, error } = await auth.supabase
    .from('duo_projects')
    .select('id,user_id')
    .eq('id', projectId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!project) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) };
  return { project };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const access = await assertProjectAccess(auth, id);
  if ('error' in access) return access.error;

  const report = await getFidelityReport(id);
  return report
    ? NextResponse.json(report)
    : NextResponse.json({ error: 'No fidelity data' }, { status: 404 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const access = await assertProjectAccess(auth, id);
  if ('error' in access) return access.error;

  runFidelityCheck(id).catch(() => {});
  return NextResponse.json({ ok: true, message: 'Fidelity check started' }, { status: 202 });
}
