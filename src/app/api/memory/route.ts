/**
 * Memory events collection
 * GET    /api/memory           → paginated list of active memory events
 * DELETE /api/memory           → bulk soft-delete (clear all — requires UI confirmation)
 * Source: CubiQo-UI-Architecture.md Screen 11
 */
import { NextRequest, NextResponse } from "next/server";
import { getBearerToken, getSupabaseAdmin } from "../_lib/supabase-admin";

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
