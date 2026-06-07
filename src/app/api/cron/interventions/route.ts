import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 55;

function assertCron(request: NextRequest) {
  const expected = process.env.CRON_SECRET || "";
  return Boolean(expected && request.headers.get("x-cubiqo-internal") === expected);
}

function twoHourWindowKey() {
  const now = new Date();
  const hour = Math.floor(now.getUTCHours() / 2) * 2;
  return `${now.toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}`;
}

async function acquireJobLock(supabase: any) {
  const { data, error } = await supabase
    .from("job_runs")
    .insert({ job_name: "interventions", dedupe_key: twoHourWindowKey(), status: "running" })
    .select("id")
    .single();

  if (error?.code === "23505") return { locked: false, id: null, error: null };
  return { locked: Boolean(data?.id && !error), id: data?.id ?? null, error };
}

async function finishJob(supabase: any, id: string | null, status: "succeeded" | "failed", error?: string) {
  if (!id) return;
  await supabase
    .from("job_runs")
    .update({ status, error: error || null, finished_at: new Date().toISOString() })
    .eq("id", id);
}

async function recentlyNudged(supabase: any, userId: string, type: string) {
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("interventions_log")
    .select("id")
    .eq("user_id", userId)
    .eq("intervention_type", type)
    .gte("created_at", since)
    .limit(1);

  return Boolean(data?.length);
}

async function findIntervention(supabase: any, user: any) {
  const userId = user.id;

  // Find commitments due SOON (in the next 48h) — nudge before the deadline, not after it.
  const { data: commitment } = await supabase
    .from("memory_events")
    .select("id,summary,expires_at")
    .eq("user_id", userId)
    .eq("event_type", "commitment")
    .gte("expires_at", new Date().toISOString())
    .lte("expires_at", new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
    .order("expires_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (commitment && !(await recentlyNudged(supabase, userId, "commitment_due_soon"))) {
    const hoursLeft = Math.round((new Date(commitment.expires_at).getTime() - Date.now()) / 3_600_000);
    return {
      type: "commitment_due_soon",
      signal_id: null,
      message: `You have a commitment due in ~${hoursLeft}h: ${commitment.summary.slice(0, 140)}. On track?`,
      metadata: { memory_event_id: commitment.id, hours_until_due: hoursLeft },
    };
  }

  const { data: aiProfile } = await supabase
    .from("user_ai_profile")
    .select("open_loops")
    .eq("user_id", userId)
    .maybeSingle();

  if (Array.isArray(aiProfile?.open_loops) && aiProfile.open_loops.length && !(await recentlyNudged(supabase, userId, "open_loop"))) {
    return {
      type: "open_loop",
      signal_id: null,
      message: `Still keeping ${String(aiProfile.open_loops[0]).slice(0, 120)} open. What changed since last time?`,
      metadata: { open_loop: aiProfile.open_loops[0] },
    };
  }

  const { data: staleSignal } = await supabase
    .from("signals")
    .select("id,keyword,created_at")
    .eq("user_id", userId)
    .eq("color", "green")
    .lt("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (staleSignal && !(await recentlyNudged(supabase, userId, "goal_staleness"))) {
    return {
      type: "goal_staleness",
      signal_id: staleSignal.id,
      message: `${staleSignal.keyword} has been open for a week. Any progress, or should we reset the next step?`,
      metadata: { signal_created_at: staleSignal.created_at },
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  if (!assertCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
  }

  const lock = await acquireJobLock(supabase);
  if (lock.error) {
    return NextResponse.json({ error: lock.error.message }, { status: 500 });
  }
  if (!lock.locked) {
    return NextResponse.json({ ok: true, skipped: true, reason: "interventions already ran for this window" });
  }

  try {
    const { data: activeUsers, error } = await supabase
      .from("profiles")
      .select("id,last_seen_at,visit_count")
      .gt("last_seen_at", new Date(Date.now() - 14 * 86_400_000).toISOString())
      .order("last_seen_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const created: any[] = [];
    for (const user of activeUsers || []) {
      const intervention = await findIntervention(supabase, user);
      if (!intervention) continue;

      const { data } = await supabase
        .from("interventions_log")
        .insert({
          user_id: user.id,
          intervention_type: intervention.type,
          signal_id: intervention.signal_id,
          message_sent: intervention.message,
          delivered_via: "queued",
          metadata: intervention.metadata,
        })
        .select("id,intervention_type,message_sent")
        .single();

      if (data) created.push({ user_id: user.id, ...data });
    }

    await finishJob(supabase, lock.id, "succeeded");
    return NextResponse.json({ ok: true, created });
  } catch (error: any) {
    await finishJob(supabase, lock.id, "failed", error?.message || "interventions failed");
    return NextResponse.json({ error: error?.message || "interventions failed" }, { status: 500 });
  }
}
