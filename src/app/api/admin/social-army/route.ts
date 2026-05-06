import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

async function readTable(supabase: any, table: string) {
  const { data, error } = await supabase.from(table).select('*').limit(50);
  if (safeTableMissing(error)) return { data: [], migrationPending: true, error: null };
  return { data: data || [], migrationPending: false, error: error?.message || null };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const admin = await isAdminUser(auth.supabase, auth.user.id);
  if (admin.migrationPending) {
    return NextResponse.json({
      migrationPending: true,
      admin: false,
      error: 'admin_roles is not available in Supabase yet'
    });
  }

  if (!admin.admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const [campaigns, accounts, tasks, reports] = await Promise.all([
    readTable(auth.supabase, 'social_campaigns'),
    readTable(auth.supabase, 'social_accounts'),
    readTable(auth.supabase, 'social_tasks'),
    readTable(auth.supabase, 'social_reports')
  ]);

  const warnings = [campaigns, accounts, tasks, reports].filter(item => item.error).map(item => item.error);

  return NextResponse.json({
    admin: true,
    migrationPending: [campaigns, accounts, tasks, reports].some(item => item.migrationPending),
    campaigns: campaigns.data,
    accounts: accounts.data,
    tasks: tasks.data,
    reports: reports.data,
    warnings,
    automation: {
      tenTenTen: 'disabled',
      reason: 'The 10 platforms x 10 accounts x 10 minutes workflow is intentionally read-only until permissions, account custody, and audit policy are approved.'
    }
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Social Army automation is not enabled. This endpoint is read-only until ops, legal, credentials, and audit controls are designed.'
    },
    { status: 403 }
  );
}
