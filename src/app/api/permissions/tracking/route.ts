import { NextRequest, NextResponse } from "next/server";

import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const status = body.status === "granted" ? "granted" : "denied";
  const supabase = getSupabaseAdmin();
  const token = getBearerToken(request);

  if (supabase && token) {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user?.id) {
      await supabase.from("user_permissions").upsert({
        user_id: data.user.id,
        tracking: status,
        tracking_granted_at: status === "granted" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
  }

  const response = NextResponse.json({ ok: true, tracking: status });
  response.cookies.set("cubiqo_tracking_consent", status, {
    sameSite: "lax",
    secure: true,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}
