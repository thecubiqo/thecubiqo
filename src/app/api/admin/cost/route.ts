import { NextRequest, NextResponse } from "next/server";

import { requireAdminRequest } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminRequest(request);
  if ("error" in auth) return auth.error;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await auth.supabase
    .from("api_usage_events")
    .select("user_id,provider,route,model,units_used,unit_type,cost_estimate,currency,latency_ms,created_at")
    .gt("created_at", since)
    .limit(5000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byProvider = new Map<string, any>();
  const byRoute = new Map<string, any>();
  const byUser = new Map<string, any>();

  for (const row of data || []) {
    for (const [map, key] of [
      [byProvider, row.provider || "unknown"],
      [byRoute, row.route || "unknown"],
      [byUser, row.user_id || "anonymous"],
    ] as const) {
      const entry = map.get(key) || { key, calls: 0, cost_usd: 0, units_used: 0 };
      entry.calls += 1;
      entry.cost_usd += Number(row.cost_estimate || 0);
      entry.units_used += Number(row.units_used || 0);
      map.set(key, entry);
    }
  }

  return NextResponse.json({
    window_days: 30,
    total_calls: data?.length || 0,
    total_cost_usd: (data || []).reduce((sum: number, row: any) => sum + Number(row.cost_estimate || 0), 0),
    by_provider: Array.from(byProvider.values()),
    by_route: Array.from(byRoute.values()),
    by_user: Array.from(byUser.values()),
  });
}
