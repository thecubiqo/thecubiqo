import { getSupabaseAdmin } from "@/next/app/api/_lib/supabase-admin";

/**
 * Whether a user currently has paid access.
 *
 * MUST gate on the period boundary, not just status: Stripe leaves
 * status='active' until a webhook flips it, so a failed renewal, a delayed /
 * missed webhook, or a cancel-at-period-end customer can read 'active' past the
 * paid window. Checking the date prevents lapsed subscribers from keeping paid
 * features (a direct revenue leak). A null boundary (e.g. a checkout-created
 * 'trialing' row not yet enriched by subscription.created) is treated as
 * NOT pro — fail closed on money.
 */
export async function isPro(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !userId) return false;

  const { data } = await supabase
    .from("subscriptions")
    .select("status,current_period_end,trial_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return false;
  const now = Date.now();

  if (data.status === "active") {
    return Boolean(data.current_period_end) && new Date(data.current_period_end).getTime() > now;
  }
  if (data.status === "trialing") {
    return Boolean(data.trial_end) && new Date(data.trial_end).getTime() > now;
  }
  return false;
}

export async function getSubscription(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !userId) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("status,current_period_end,cancel_at_period_end,trial_end")
    .eq("user_id", userId)
    .maybeSingle();

  return data || null;
}
