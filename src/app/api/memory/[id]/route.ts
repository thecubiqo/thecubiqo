/**
 * Memory event CRUD — single item
 * PATCH  /api/memory/[id]  → edit summary
 * DELETE /api/memory/[id]  → soft-delete (sets deleted_at, 30-day grace before purge)
 * Source: CubiQo-UI-Architecture.md Screen 11
 */
import { NextRequest, NextResponse } from "next/server";
import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Config error" }, { status: 500 });

  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!("summary" in body)) {
    return NextResponse.json({ error: "summary required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("memory_events")
    .update({
      summary: String(body.summary).slice(0, 2000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id,summary,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Config error" }, { status: 500 });

  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { error } = await supabase
    .from("memory_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null); // idempotent

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ deleted: true, gracePeriodDays: 30 });
}
