import { NextRequest, NextResponse } from "next/server";

import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ status: "free", isPro: false });

  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ status: "free", isPro: false });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ status: "free", isPro: false });

  const { data } = await supabase
    .from("subscriptions")
    .select("status,current_period_end,cancel_at_period_end,trial_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const status = data?.status || "free";
  return NextResponse.json({
    status,
    isPro: status === "active" || status === "trialing",
    ...data,
  });
}
