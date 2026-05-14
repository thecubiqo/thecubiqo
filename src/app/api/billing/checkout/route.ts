import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "../../_lib/supabase-admin";
import { createCheckoutSession } from "@/next/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const priceId = process.env.STRIPE_PRICE_ID_PRO_GBP;
  if (!priceId) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 500 });
  }

  try {
    const session = await createCheckoutSession(auth.user.id, auth.user.email || "", priceId);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}
