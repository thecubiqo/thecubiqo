import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const recommendationEventId = body?.recommendationEventId || body?.recommendation_event_id;
  if (!recommendationEventId) {
    return NextResponse.json({ error: "Missing recommendationEventId" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Config error" }, { status: 500 });

  const { data: recEvent } = await supabase
    .from("recommendation_events")
    .select("id,user_id,affiliate_link_id,session_id")
    .eq("id", recommendationEventId)
    .maybeSingle();

  if (!recEvent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conversionPayload = {
      recommendation_event_id: recEvent.id,
      affiliate_link_id: recEvent.affiliate_link_id,
      user_id: recEvent.user_id,
      session_id: recEvent.session_id,
      converted: true,
      conversion_at: new Date().toISOString(),
      conversion_source: "network_postback",
      metadata: {
        attribution_method: "browser_extension",
        merchant: body.merchant ?? null,
        extension_version: body.extensionVersion ?? null,
        url_path: body.urlPath ?? null,
      },
    };

  const { data: click } = await supabase
    .from("affiliate_clicks")
    .select("id")
    .eq("recommendation_event_id", recEvent.id)
    .order("clicked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (click?.id) {
    await supabase.from("affiliate_clicks").update(conversionPayload).eq("id", click.id);
  } else {
    await supabase.from("affiliate_clicks").insert(conversionPayload);
  }

  return NextResponse.json({ received: true });
}
