import { getSupabaseAdmin } from "@/next/app/api/_lib/supabase-admin";

export async function isPro(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !userId) return false;

  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.status === "active" || data?.status === "trialing";
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
