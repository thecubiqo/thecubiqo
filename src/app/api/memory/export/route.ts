/**
 * Memory export endpoint
 * GET /api/memory/export?format=json|csv
 * Returns all non-deleted memory events for the authenticated user.
 * Source: CubiQo-UI-Architecture.md Screen 11
 */
import { NextRequest, NextResponse } from "next/server";
import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Config error" }, { status: 500 });

  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const format = new URL(request.url).searchParams.get("format") || "json";

  const { data, error } = await supabase
    .from("memory_events")
    .select("id,event_type,summary,keywords,weight,created_at")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const datestamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const header = "id,event_type,summary,keywords,weight,created_at";
    const rows = (data || []).map((r: any) =>
      [
        r.id,
        r.event_type ?? "",
        `"${String(r.summary ?? "").replace(/"/g, '""')}"`,
        (r.keywords ?? []).join("|"),
        r.weight ?? 1,
        r.created_at,
      ].join(",")
    );
    return new NextResponse([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cubiqo-memory-${datestamp}.csv"`,
      },
    });
  }

  // JSON default
  return new NextResponse(
    JSON.stringify({ memories: data ?? [], exportedAt: new Date().toISOString(), count: (data ?? []).length }),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cubiqo-memory-${datestamp}.json"`,
      },
    }
  );
}
