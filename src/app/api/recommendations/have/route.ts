import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const recommendationEventId = body.recommendation_event_id || body.recommendationEventId;
  if (!recommendationEventId) {
    return NextResponse.json({ error: "recommendation_event_id required" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("recommendation_events")
    .update({ user_has_this: true })
    .eq("id", recommendationEventId)
    .or(`user_id.eq.${auth.user.id},user_id.is.null`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
