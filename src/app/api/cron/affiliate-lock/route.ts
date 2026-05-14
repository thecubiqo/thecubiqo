import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

function assertCron(request: NextRequest) {
  const expected = process.env.CRON_SECRET || "";
  return Boolean(expected && request.headers.get("x-cubiqo-internal") === expected);
}

export async function GET(request: NextRequest) {
  if (!assertCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });

  const { data: conversions, error } = await supabase
    .from("affiliate_conversions")
    .select("id,platform,converted_at")
    .eq("status", "approved")
    .not("converted_at", "is", null)
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let locked = 0;
  for (const conversion of conversions || []) {
    const { data: partner } = await supabase
      .from("affiliate_partner_programs")
      .select("validation_window_days")
      .eq("platform", conversion.platform)
      .maybeSingle();

    const days = Number(partner?.validation_window_days ?? 30);
    const lockAt = new Date(new Date(conversion.converted_at).getTime() + days * 86_400_000);
    if (Date.now() < lockAt.getTime()) continue;

    await supabase
      .from("affiliate_conversions")
      .update({ status: "locked", locked_at: new Date().toISOString() })
      .eq("id", conversion.id)
      .eq("status", "approved");
    locked += 1;
  }

  return NextResponse.json({ ok: true, checked: conversions?.length || 0, locked });
}
