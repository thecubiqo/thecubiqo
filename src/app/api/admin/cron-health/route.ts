import { NextRequest, NextResponse } from "next/server";

import { requireAdminRequest } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminRequest(request);
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("job_runs")
    .select("job_name,dedupe_key,status,started_at,finished_at,error")
    .order("started_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const latestByJob = new Map<string, any>();
  for (const row of data || []) {
    if (!latestByJob.has(row.job_name)) latestByJob.set(row.job_name, row);
  }

  return NextResponse.json({
    jobs: Array.from(latestByJob.values()),
    recent_runs: data || [],
  });
}
