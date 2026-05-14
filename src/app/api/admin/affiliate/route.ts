import { NextRequest, NextResponse } from "next/server";

import { requireAdminRequest } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminRequest(request);
  if ("error" in auth) return auth.error;

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [shown, clicked, saved, dismissed, conversions, payouts, partners, costs] = await Promise.all([
    auth.supabase.from("recommendation_events").select("affiliate_tier,recommended_entity", { count: "exact" }).gt("created_at", since30d).limit(1000),
    auth.supabase.from("affiliate_clicks").select("affiliate_link_id,clicked_at", { count: "exact" }).gt("clicked_at", since30d).limit(1000),
    auth.supabase.from("saved_recommendations").select("id", { count: "exact" }).gt("saved_at", since30d),
    auth.supabase.from("recommendation_events").select("id", { count: "exact" }).eq("user_has_this", true).gt("created_at", since30d),
    auth.supabase.from("affiliate_conversions").select("network,platform,status,approved_commission,commission_currency").gt("created_at", since30d).limit(2000),
    auth.supabase.from("affiliate_payout_batches").select("network,payout_amount,payout_currency,payout_status").gt("created_at", since30d).limit(1000),
    auth.supabase.from("affiliate_partner_programs").select("platform,display_name,approval_status,active,network").order("platform").limit(200),
    auth.supabase.from("api_usage_events").select("cost_estimate,currency").gt("created_at", since30d).limit(5000),
  ]);

  const conversionRows = conversions.data || [];
  const payoutRows = payouts.data || [];
  const paidGbp = payoutRows
    .filter((row: any) => ["received", "reconciled"].includes(row.payout_status))
    .reduce((sum: number, row: any) => sum + Number(row.payout_amount || 0), 0);
  const pendingPayoutGbp = payoutRows
    .filter((row: any) => ["pending", "in_transit"].includes(row.payout_status))
    .reduce((sum: number, row: any) => sum + Number(row.payout_amount || 0), 0);
  const approvedGbp = conversionRows
    .filter((row: any) => ["approved", "locked", "paid", "reconciled"].includes(row.status))
    .reduce((sum: number, row: any) => sum + Number(row.approved_commission || 0), 0);
  const apiCost = (costs.data || []).reduce((sum: number, row: any) => sum + Number(row.cost_estimate || 0), 0);

  const byPartner = new Map<string, { platform: string; approved_gbp: number; paid_gbp: number }>();
  for (const row of conversionRows as any[]) {
    const platform = row.platform || "unknown";
    const entry = byPartner.get(platform) || { platform, approved_gbp: 0, paid_gbp: 0 };
    if (["approved", "locked", "paid", "reconciled"].includes(row.status)) entry.approved_gbp += Number(row.approved_commission || 0);
    byPartner.set(platform, entry);
  }
  const byNetwork = new Map<string, { network: string; approved_gbp: number; paid_gbp: number }>();
  for (const row of conversionRows as any[]) {
    const network = row.network || "unknown";
    const entry = byNetwork.get(network) || { network, approved_gbp: 0, paid_gbp: 0 };
    if (["approved", "locked", "paid", "reconciled"].includes(row.status)) entry.approved_gbp += Number(row.approved_commission || 0);
    byNetwork.set(network, entry);
  }
  for (const row of payoutRows as any[]) {
    const entry = byNetwork.get(row.network || "unknown") || { network: row.network || "unknown", approved_gbp: 0, paid_gbp: 0 };
    if (["received", "reconciled"].includes(row.payout_status)) entry.paid_gbp += Number(row.payout_amount || 0);
    byNetwork.set(entry.network, entry);
  }

  return NextResponse.json({
    partner_statuses: (partners.data || []).map((partner: any) => ({
      platform: partner.platform,
      approval_status: partner.approval_status,
      active: partner.active,
      last_click_at: (clicked.data || []).find((click: any) => click.affiliate_link_id === partner.id)?.clicked_at || null,
    })),
    recommendations_shown: shown.count || 0,
    recommendations_clicked: clicked.count || 0,
    recommendations_saved: saved.count || 0,
    recommendations_dismissed: dismissed.count || 0,
    conversions_pending: conversionRows.filter((row: any) => row.status === "pending").length,
    conversions_approved: conversionRows.filter((row: any) => row.status === "approved").length,
    conversions_rejected: conversionRows.filter((row: any) => row.status === "rejected").length,
    conversions_reversed: conversionRows.filter((row: any) => row.status === "reversed").length,
    conversions_locked: conversionRows.filter((row: any) => row.status === "locked").length,
    payouts_pending_gbp: pendingPayoutGbp,
    payouts_paid_gbp: paidGbp,
    revenue_by_partner: Array.from(byPartner.values()),
    revenue_by_network: Array.from(byNetwork.values()),
    gross_revenue_gbp: paidGbp,
    api_cost_gbp: apiCost,
    gross_margin_gbp: paidGbp - apiCost,
    gross_margin_pct: paidGbp ? ((paidGbp - apiCost) / paidGbp) * 100 : 0,
    ctr: shown.count ? (clicked.count || 0) / shown.count : 0,
  });
}
