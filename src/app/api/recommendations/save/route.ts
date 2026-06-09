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

  const { data: rec, error: recError } = await auth.supabase
    .from("recommendation_events")
    .select("id,recommended_entity,tracked_url")
    .eq("id", recommendationEventId)
    .maybeSingle();

  if (recError) return NextResponse.json({ error: recError.message }, { status: 500 });
  if (!rec) return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });

  const { data, error } = await auth.supabase
    .from("saved_recommendations")
    .insert({
      user_id: auth.user.id,
      recommendation_event_id: rec.id,
      entity_name: rec.recommended_entity,
      tracked_url: rec.tracked_url,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, saved_id: data.id });
}
