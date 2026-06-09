/**
 * POST /api/attribution/conversion
 *
 * Marks a recommendation the AUTHENTICATED user actually converted on. This
 * feeds the affiliate analytics ledger, so it must be locked down:
 *   • Requires auth (was previously fully open → anyone could inject conversions).
 *   • Verifies the recommendation_event belongs to the caller (no IDOR).
 *   • Only UPDATES a pre-existing click owned by the user — it never fabricates
 *     a brand-new affiliate_clicks row (the old INSERT branch let an attacker
 *     stuff the ledger with fake clicks). No real click → 404.
 *   • Labels the source honestly as user-reported, not a verified network postback.
 */

import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const recommendationEventId = body?.recommendationEventId || body?.recommendation_event_id;
  if (!recommendationEventId) {
    return NextResponse.json({ error: "Missing recommendationEventId" }, { status: 400 });
  }

  // Ownership check: the event must belong to the authenticated user.
  const { data: recEvent } = await auth.supabase
    .from("recommendation_events")
    .select("id,user_id,affiliate_link_id,session_id")
    .eq("id", recommendationEventId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!recEvent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only update an existing click that already belongs to this user.
  const { data: click } = await auth.supabase
    .from("affiliate_clicks")
    .select("id")
    .eq("recommendation_event_id", recEvent.id)
    .eq("user_id", auth.user.id)
    .order("clicked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!click?.id) {
    // No genuine prior click → do not fabricate one. Reject instead.
    return NextResponse.json({ error: "No click to convert" }, { status: 404 });
  }

  await auth.supabase
    .from("affiliate_clicks")
    .update({
      converted: true,
      conversion_at: new Date().toISOString(),
      conversion_source: "user_reported",
      metadata: {
        attribution_method: "browser_extension",
        merchant: body.merchant ?? null,
        extension_version: body.extensionVersion ?? null,
        url_path: body.urlPath ?? null,
      },
    })
    .eq("id", click.id)
    .eq("user_id", auth.user.id);

  return NextResponse.json({ received: true });
}
