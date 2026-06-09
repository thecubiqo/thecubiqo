import { NextRequest, NextResponse } from "next/server";

import { requireAdminRequest } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminRequest(request);
  if ("error" in auth) return auth.error;

  const [unpaid, receivedBatches, payoutItems] = await Promise.all([
    auth.supabase
      .from("affiliate_conversions")
      .select("*")
      .in("status", ["approved", "locked"])
      .order("converted_at", { ascending: false })
      .limit(500),
    auth.supabase
      .from("affiliate_payout_batches")
      .select("*")
      .eq("payout_status", "received")
      .order("created_at", { ascending: false })
      .limit(200),
    auth.supabase
      .from("affiliate_payout_items")
      .select("id,payout_batch_id,affiliate_conversion_id,amount,currency,raw_item")
      .is("affiliate_conversion_id", null)
      .limit(200),
  ]);

  return NextResponse.json({
    unpaid_conversions: unpaid.data || [],
    received_unreconciled_batches: receivedBatches.data || [],
    phantom_payout_items: payoutItems.data || [],
    errors: [unpaid.error?.message, receivedBatches.error?.message, payoutItems.error?.message].filter(Boolean),
  });
}
