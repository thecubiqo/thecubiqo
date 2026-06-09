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

  // isPro must agree with lib/billing/gates.isPro: gate on the period boundary,
  // not just status, so a lapsed/expired subscription doesn't read as Pro.
  const now = Date.now();
  const isPro =
    (status === "active" && !!data?.current_period_end && new Date(data.current_period_end).getTime() > now) ||
    (status === "trialing" && !!data?.trial_end && new Date(data.trial_end).getTime() > now);

  // Return an explicit, allow-listed shape — never spread the raw row.
  return NextResponse.json({
    status,
    isPro,
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? null,
    trialEnd: data?.trial_end ?? null,
  });
}
