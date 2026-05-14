import { NextRequest, NextResponse } from "next/server";

import { getModel } from "@/next/lib/config/llm";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { searchConfigured, webSearch } from "../../_lib/web-search";

export const runtime = "nodejs";
export const maxDuration = 55;

function assertCron(request: NextRequest) {
  const expected = process.env.CRON_SECRET || "";
  return Boolean(expected && request.headers.get("x-cubiqo-internal") === expected);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function acquireJobLock(supabase: any, jobName: string, dedupeKey: string) {
  const { data, error } = await supabase
    .from("job_runs")
    .insert({ job_name: jobName, dedupe_key: dedupeKey, status: "running" })
    .select("id")
    .single();

  if (error?.code === "23505") return { locked: false, id: null, error: null };
  return { locked: Boolean(data?.id && !error), id: data?.id ?? null, error };
}

async function finishJob(supabase: any, id: string | null, status: "succeeded" | "failed", error?: string) {
  if (!id) return;
  await supabase
    .from("job_runs")
    .update({
      status,
      error: error || null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", id);
}

async function compressDigest(keyword: string, findings: Array<{ title?: string; snippet?: string; url?: string }>) {
  if (!findings.length) return "";

  const fallback = findings
    .slice(0, 3)
    .map((item) => `${item.title || "Update"}: ${item.snippet || item.url || "No summary available."}`)
    .join("\n");

  if (!process.env.OPENAI_API_KEY) return fallback.slice(0, 700);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getModel("utility"),
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content: "Compress search findings into three short CubiQo daily-context bullets. Be factual, source-aware, and concise.",
          },
          {
            role: "user",
            content: `User topic: ${keyword}\n\nFindings:\n${JSON.stringify(findings.slice(0, 5), null, 2)}`,
          },
        ],
      }),
    });
    const data = await res.json().catch(() => null);
    return String(data?.choices?.[0]?.message?.content || fallback).slice(0, 900);
  } catch {
    return fallback.slice(0, 700);
  }
}

export async function GET(request: NextRequest) {
  if (!assertCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
  }

  const lock = await acquireJobLock(supabase, "daily-digest", todayKey());
  if (lock.error) {
    return NextResponse.json({ error: lock.error.message }, { status: 500 });
  }
  if (!lock.locked) {
    return NextResponse.json({ ok: true, skipped: true, reason: "daily digest already ran" });
  }

  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id,primary_goal,goal_domain,language_preference,last_seen_at")
      .not("id", "is", null)
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .limit(25);

    if (error) throw error;

    const results: Array<{ user_id: string; updated: boolean; keyword?: string }> = [];
    for (const profile of profiles || []) {
      const { data: signals } = await supabase
        .from("signals")
        .select("keyword")
        .eq("user_id", profile.id)
        .eq("color", "green")
        .order("created_at", { ascending: false })
        .limit(3);

      const keyword = [
        profile.primary_goal,
        profile.goal_domain,
        ...(signals || []).map((signal: any) => signal.keyword),
      ].filter(Boolean)[0];

      if (!keyword || !searchConfigured()) {
        results.push({ user_id: profile.id, updated: false });
        continue;
      }

      const search = await webSearch(`${keyword} news today current update`, 5);
      const digest = await compressDigest(keyword, search.results || []);
      if (!digest) {
        results.push({ user_id: profile.id, updated: false, keyword });
        continue;
      }

      await supabase
        .from("profiles")
        .update({
          daily_context: digest,
          daily_context_generated_at: new Date().toISOString(),
          daily_context_expires_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", profile.id);

      await supabase.from("api_usage_events").insert({
        user_id: profile.id,
        route: "/api/cron/daily-digest",
        provider: search.provider || "search",
        model: process.env.OPENAI_API_KEY ? getModel("utility") : null,
        metadata: { keyword, result_count: search.results?.length || 0 },
      });

      results.push({ user_id: profile.id, updated: true, keyword });
    }

    await finishJob(supabase, lock.id, "succeeded");
    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (error: any) {
    await finishJob(supabase, lock.id, "failed", error?.message || "daily digest failed");
    return NextResponse.json({ error: error?.message || "daily digest failed" }, { status: 500 });
  }
}
