/**
 * Memory events collection
 * GET    /api/memory           → paginated list of active memory events
 * POST   /api/memory           → create a memory event (agents, systems, or user-triggered)
 * DELETE /api/memory           → bulk soft-delete (clear all — requires UI confirmation)
 * Source: CubiQo-UI-Architecture.md Screen 11
 */
import { NextRequest, NextResponse } from "next/server";
import { getBearerToken, getSupabaseAdmin } from "../_lib/supabase-admin";
import { guardPermission } from "@/next/lib/agent/permission-guard";

const VALID_EVENT_TYPES = [
  "session_summary", "goal_update", "commitment", "blocker",
  "outcome", "episode", "journal_insight", "preference",
  "profile_correction", "crisis_signal",
] as const;

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Config error" }, { status: 500 });

  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const url = new URL(request.url);
  const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10), 1);
  const perPage = Math.min(parseInt(url.searchParams.get("per_page") ?? "20", 10), 100);
  const search = url.searchParams.get("q")?.trim() ?? "";

  let query = supabase
    .from("memory_events")
    .select("id,event_type,summary,keywords,weight,created_at,updated_at", { count: "exact" })
    .eq("user_id", user.id)
    .is("archived_at", null)
    .is("deleted_at", null)
    .order("weight", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (search) {
    query = query.ilike("summary", `%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    memories: data ?? [],
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.ceil((count ?? 0) / perPage),
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Config error" }, { status: 500 });

  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  // ── Permission gate: memory write requires memory permission ───────────────
  const memoryDenied = await guardPermission(supabase, user.id, 'memory');
  if (memoryDenied) return memoryDenied;

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const {
    event_type,
    summary,
    keywords = [],
    weight = 1,
    confidence,
    source = "user",
    user_confirmed = false,
    expires_at,
    metadata = {},
    signal_ids = [],
  } = body;

  if (!event_type || !VALID_EVENT_TYPES.includes(event_type as typeof VALID_EVENT_TYPES[number])) {
    return NextResponse.json({
      error: `event_type must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
    }, { status: 400 });
  }
  if (!summary || typeof summary !== "string" || !String(summary).trim()) {
    return NextResponse.json({ error: "summary is required" }, { status: 400 });
  }

  const w = Math.max(1, Math.min(3, Number(weight) || 1));
  const payload: Record<string, unknown> = {
    user_id: user.id,
    event_type,
    summary: String(summary).trim().slice(0, 500),
    keywords: Array.isArray(keywords) ? keywords.map(String).slice(0, 10) : [],
    weight: w,
    source: String(source || "user").slice(0, 40),
    user_confirmed: Boolean(user_confirmed),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  };
  if (confidence !== undefined) payload.confidence = Math.max(0, Math.min(1, Number(confidence)));
  if (expires_at) payload.expires_at = String(expires_at);
  if (Array.isArray(signal_ids) && signal_ids.length) payload.signal_ids = signal_ids;

  const { data, error } = await supabase
    .from("memory_events")
    .insert(payload)
    .select("id,event_type,summary,weight,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memory: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Config error" }, { status: 500 });

  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  // Bulk soft-delete — sets deleted_at on all non-deleted events
  // UI must show confirmation before calling this endpoint
  const { error } = await supabase
    .from("memory_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cleared: true, gracePeriodDays: 30 });
}
