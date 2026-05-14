import { NextRequest, NextResponse } from "next/server";

import { requireAdminRequest } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminRequest(request);
  if ("error" in auth) return auth.error;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    dau,
    mau,
    signals,
    briefings,
    usage,
  ] = await Promise.all([
    auth.supabase.from("profiles").select("id", { count: "exact", head: true }).gt("last_seen_at", since24h),
    auth.supabase.from("profiles").select("id", { count: "exact", head: true }).gt("last_seen_at", since30d),
    auth.supabase.from("signals").select("id", { count: "exact", head: true }).gt("created_at", since24h),
    auth.supabase.from("capsule_briefings").select("id", { count: "exact", head: true }).gt("created_at", since24h),
    auth.supabase.from("api_usage_events").select("cost_estimate,latency_ms,route").gt("created_at", since24h).limit(1000),
  ]);

  const costs = (usage.data || []).reduce((sum: number, row: any) => sum + Number(row.cost_estimate || 0), 0);
  const avgLatency = usage.data?.length
    ? Math.round((usage.data || []).reduce((sum: number, row: any) => sum + Number(row.latency_ms || 0), 0) / usage.data.length)
    : 0;

  return NextResponse.json({
    dau: dau.count || 0,
    mau: mau.count || 0,
    signals_24h: signals.count || 0,
    briefings_24h: briefings.count || 0,
    api_cost_estimate_24h: costs,
    avg_latency_ms_24h: avgLatency,
    events_sampled: usage.data?.length || 0,
  });
}
