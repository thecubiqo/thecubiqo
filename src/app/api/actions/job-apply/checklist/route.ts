import { NextRequest, NextResponse } from 'next/server';
import { buildJobApplicationHandoffChecklist } from '@/next/lib/jobs/application-handoff';
import { requireApiUser } from '../../../_lib/supabase-admin';
import { writeAudit } from '../../../_lib/v2-actions';

export const runtime = 'nodejs';

function normalizeBody(body: Record<string, unknown>) {
  return {
    jobUrl: body.job_url ?? body.jobUrl ?? body.url,
    platform: body.platform,
    jobTitle: body.job_title ?? body.jobTitle,
    company: body.company,
    profileData: typeof body.profileData === 'object' && body.profileData ? body.profileData as Record<string, unknown> : {}
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const checklist = buildJobApplicationHandoffChecklist(normalizeBody(body));

  await writeAudit(auth, {
    actionType: 'job_apply_handoff_checklist',
    toolName: 'job_apply',
    status: 'completed',
    message: 'Generated visible job application handoff checklist',
    input: {
      jobUrl: checklist.jobUrl,
      provider: checklist.providerId,
      jobTitle: checklist.jobTitle,
      company: checklist.company
    },
    result: {
      provider: checklist.providerId,
      stepCount: checklist.steps.length,
      finalSubmitAutonomous: checklist.finalSubmitAutonomous
    }
  });

  return NextResponse.json({ checklist });
}
