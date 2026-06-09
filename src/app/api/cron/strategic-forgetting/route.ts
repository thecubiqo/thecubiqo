import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { isAuthorizedCron } from "../../_lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 55;

// Accept both Vercel Bearer cron auth and internal-header auth (see cron-auth).
function assertCron(request: NextRequest) {
  return isAuthorizedCron(request);
}

function overlaps(a: string[] = [], b: string[] = []) {
  const set = new Set(a.map((item) => item.toLowerCase()));
  return b.some((item) => set.has(item.toLowerCase()));
}

export async function GET(request: NextRequest) {
  if (!assertCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
  }

  const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,last_seen_at")
    .gt("last_seen_at", new Date(Date.now() - 30 * 86_400_000).toISOString())
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let archived = 0;
  for (const profile of profiles || []) {
    const { data: signals } = await supabase
      .from("signals")
      .select("keyword")
      .eq("user_id", profile.id)
      .gt("created_at", sixtyDaysAgo)
      .limit(100);

    const recentKeywords = (signals || []).map((signal: any) => signal.keyword).filter(Boolean);
    if (!recentKeywords.length) continue;

    const { data: memories } = await supabase
      .from("memory_events")
      .select("id,keywords,weight")
      .eq("user_id", profile.id)
      .is("archived_at", null)
      .lt("created_at", sixtyDaysAgo)
      .eq("weight", 1)
      .limit(100);

    const staleIds = (memories || [])
      .filter((memory: any) => !overlaps(memory.keywords || [], recentKeywords))
      .map((memory: any) => memory.id);

    if (staleIds.length) {
      await supabase
        .from("memory_events")
        .update({ archived_at: new Date().toISOString() })
        .in("id", staleIds);
      archived += staleIds.length;
    }
  }

  return NextResponse.json({ ok: true, archived });
}
