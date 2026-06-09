import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

// Constant-time string compare — avoids leaking the shared secret via response
// timing on the affiliate postback secret check.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const partnerToken = request.headers.get("x-partner-token") || "";
  const expected = process.env.AFFILIATE_POSTBACK_SECRET || "";
  const { data: partner } = partnerToken
    ? await supabase
        .from("affiliate_partner_programs")
        .select("platform,network,postback_token")
        .eq("postback_token", partnerToken)
        .maybeSingle()
    : { data: null };

  const secretOk = Boolean(expected) && timingSafeEqual(partnerToken, expected);
  if (!secretOk && !partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieId = body.cookie_id || body.cookieId;
  const recommendationEventId = body.recommendation_event_id || body.recommendationEventId;
  const externalOrderId = body.order_id || body.orderId || body.external_order_id;
  const externalConversionId = body.external_conversion_id || body.conversion_id || body.transaction_id || externalOrderId || crypto.randomUUID();
  const network = body.network || partner?.network || "direct";
  const platform = body.platform || partner?.platform || null;
  const status = normalizeStatus(body.status);

  let clickQuery = supabase.from("affiliate_clicks").update({
    converted: true,
    conversion_value: body.conversion_value ?? body.amount ?? null,
    conversion_currency: body.conversion_currency ?? body.currency ?? "GBP",
    conversion_at: new Date().toISOString(),
    conversion_source: "network_postback",
    external_order_id: externalOrderId ?? null,
    metadata: body,
  });

  if (recommendationEventId) clickQuery = clickQuery.eq("recommendation_event_id", recommendationEventId);
  else if (cookieId) clickQuery = clickQuery.eq("cookie_id", cookieId);

  const { data: clickRows } = recommendationEventId || cookieId
    ? await clickQuery.select("id,recommendation_event_id").limit(1)
    : { data: [] };

  const click = clickRows?.[0] || null;
  const conversionPayload = {
    recommendation_event_id: recommendationEventId || click?.recommendation_event_id || null,
    affiliate_click_id: click?.id || null,
    network,
    platform,
    external_conversion_id: externalConversionId,
    conversion_type: body.conversion_type || body.type || "purchase",
    order_reference: externalOrderId || null,
    sale_amount: body.sale_amount ?? body.amount ?? null,
    sale_currency: body.sale_currency ?? body.currency ?? "GBP",
    expected_commission: body.expected_commission ?? body.commission ?? null,
    approved_commission: status === "approved" ? (body.approved_commission ?? body.commission ?? null) : null,
    commission_currency: body.commission_currency ?? body.currency ?? "GBP",
    status,
    converted_at: body.converted_at || body.conversion_at || new Date().toISOString(),
    approved_at: status === "approved" ? new Date().toISOString() : null,
    raw_payload: body,
  };

  const { data, error } = await supabase
    .from("affiliate_conversions")
    .upsert(conversionPayload, { onConflict: "network,external_conversion_id" })
    .select("id,status")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 200 });

  return NextResponse.json({ ok: true, conversion_id: data?.id, status: data?.status, click_matched: Boolean(click) });
}

function normalizeStatus(value: unknown) {
  const raw = String(value || "pending").toLowerCase();
  if (["approved", "rejected", "reversed", "locked", "paid", "reconciled"].includes(raw)) return raw;
  return "pending";
}
