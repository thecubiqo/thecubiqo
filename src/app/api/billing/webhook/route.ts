import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { getStripe } from "@/next/lib/billing/stripe";

export const runtime = "nodejs";

function unixToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return new NextResponse("Missing stripe-signature header", { status: 400 });
  if (!process.env.STRIPE_WEBHOOK_SECRET) return new NextResponse("Webhook secret not set", { status: 500 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new NextResponse("Webhook signature verification failed", { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return new NextResponse("DB config error", { status: 500 });

  const { data: existing } = await supabase
    .from("billing_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (existing) return new NextResponse("Already processed", { status: 200 });

  const eventObject = event.data.object as unknown as Record<string, unknown>;
  await supabase.from("billing_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    data: eventObject,
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.client_reference_id && session.customer) {
      // Do NOT regress an already-enriched subscription back to bare 'trialing'.
      // Stripe does not guarantee event ordering, so customer.subscription.*
      // (which carries the real status + period boundaries) may have already
      // landed. If a richer row exists, only refresh the customer link; the
      // authoritative status/period come from the subscription.* handler below.
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", session.client_reference_id)
        .maybeSingle();

      if (existingSub?.stripe_subscription_id) {
        await supabase
          .from("subscriptions")
          .update({ stripe_customer_id: String(session.customer), updated_at: new Date().toISOString() })
          .eq("user_id", session.client_reference_id);
      } else {
        await supabase.from("subscriptions").upsert(
          {
            user_id: session.client_reference_id,
            stripe_customer_id: String(session.customer),
            status: "trialing",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
    };
    const userId = sub.metadata?.userId;
    if (userId) {
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: String(sub.customer),
          stripe_subscription_id: sub.id,
          price_id: sub.items.data[0]?.price.id ?? null,
          status: sub.status,
          current_period_start: unixToIso(sub.current_period_start),
          current_period_end: unixToIso(sub.current_period_end),
          cancel_at_period_end: sub.cancel_at_period_end,
          trial_end: unixToIso(sub.trial_end),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (userId) {
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
  }

  return new NextResponse("OK", { status: 200 });
}
