/**
 * RGY signals summary for Memory Management screen (Screen 11)
 * GET /api/signals/summary?days=7
 * Returns aggregate counts, ratio, dominant colour, and trend direction.
 * Source: CubiQo-UI-Architecture.md Screen 11 / CubiQo-RGY-System.md
 */
import { NextRequest, NextResponse } from "next/server";
import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

type SignalSummaryRow = {
  color: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Config error" }, { status: 500 });

  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const windowDays = Math.min(
    Math.max(parseInt(new URL(request.url).searchParams.get("days") ?? "7", 10), 1),
    90
  );
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: signals, error } = await supabase
    .from("signals")
    .select("color,created_at")
    .eq("user_id", user.id)
    .in("status", ["active", "converted"])
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const signalRows = (signals ?? []) as SignalSummaryRow[];
  const counts = { green: 0, yellow: 0, red: 0 };
  for (const s of signalRows) {
    const c = s.color as keyof typeof counts;
    if (c in counts) counts[c]++;
  }

  const total = counts.green + counts.yellow + counts.red;

  const ratio =
    total === 0
      ? { green: 0.33, yellow: 0.34, red: 0.33 }
      : {
          green: Math.round((counts.green / total) * 1000) / 1000,
          yellow: Math.round((counts.yellow / total) * 1000) / 1000,
          red: Math.round((counts.red / total) * 1000) / 1000,
        };

  const dominant =
    total === 0
      ? "balanced"
      : (["green", "yellow", "red"] as const).reduce((a, b) =>
          ratio[b] > ratio[a] ? b : a
        );

  // Trend: compare green density in second half vs first half of window
  const midpoint = new Date(
    Date.now() - (windowDays / 2) * 24 * 60 * 60 * 1000
  ).toISOString();
  const first = signalRows.filter((s: SignalSummaryRow) => s.created_at < midpoint);
  const second = signalRows.filter((s: SignalSummaryRow) => s.created_at >= midpoint);
  const greenRate = (arr: SignalSummaryRow[]) =>
    arr.length > 0
      ? arr.filter((s) => s.color === "green").length / arr.length
      : 0.33;
  const delta = greenRate(second) - greenRate(first);

  let trend: string;
  if (total < 3) trend = "disengaging";
  else if (delta > 0.1) trend = "shifting_green";
  else if (delta < -0.1) trend = "shifting_red";
  else trend = "stabilising";

  return NextResponse.json({
    windowDays,
    since,
    total,
    counts,
    ratio,
    dominant,
    trend,
  });
}
