/**
 * Business Vitals API
 * Returns real-time business metrics from credit_transactions and usage_logs tables.
 * Replaces the hardcoded Math.random() data in the Codexo dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/emergent/analytics/business-vitals
export async function GET(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const orgId = membership?.org_id;

    if (!orgId) {
      // Return zeros if no org found (new user or not a member of any org)
      return NextResponse.json({
        success: true,
        data: {
          todaySpend: 0,
          todayCreditsUsed: 0,
          todayTransactions: 0,
          recentTransactions: [],
          usageByResource: [],
          creditBalance: 0,
        },
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // 1. Get credit balance
    const { data: credits } = await supabase
      .from('credits')
      .select('balance')
      .eq('org_id', orgId)
      .single();

    // 2. Get today's credit transactions (spend)
    const { data: todayTransactions } = await supabase
      .from('credit_transactions')
      .select('amount, transaction_type, description, resource_type, created_at')
      .eq('org_id', orgId)
      .gte('created_at', todayISO)
      .order('created_at', { ascending: false })
      .limit(50);

    // 3. Get today's usage logs
    const { data: todayUsage } = await supabase
      .from('usage_logs')
      .select('resource_type, credits_consumed, quantity, unit, metadata, created_at')
      .eq('org_id', orgId)
      .gte('created_at', todayISO)
      .order('created_at', { ascending: false })
      .limit(50);

    // 4. Get recent transactions (last 10)
    const { data: recentTransactions } = await supabase
      .from('credit_transactions')
      .select('amount, transaction_type, description, resource_type, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate aggregates
    const txns = todayTransactions || [];
    const usage = todayUsage || [];

    const todaySpend = txns
      .filter((t: any) => t.transaction_type === 'usage')
      .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);

    const todayCreditsUsed = usage.reduce(
      (sum: number, u: any) => sum + Number(u.credits_consumed), 0
    );

    // Group usage by resource type
    const usageMap: Record<string, { credits: number; count: number }> = {};
    for (const u of usage) {
      const rt = (u as any).resource_type || 'unknown';
      if (!usageMap[rt]) usageMap[rt] = { credits: 0, count: 0 };
      usageMap[rt].credits += Number((u as any).credits_consumed);
      usageMap[rt].count += 1;
    }
    const usageByResource = Object.entries(usageMap).map(([type, data]) => ({
      resourceType: type,
      creditsConsumed: data.credits,
      count: data.count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        creditBalance: credits?.balance ?? 0,
        todaySpend,
        todayCreditsUsed,
        todayTransactions: txns.length,
        recentTransactions: (recentTransactions || []).map((t: any) => ({
          amount: t.amount,
          type: t.transaction_type,
          description: t.description,
          resourceType: t.resource_type,
          createdAt: t.created_at,
        })),
        usageByResource,
      },
    });
  } catch (error) {
    console.error('Failed to fetch business vitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business vitals' },
      { status: 500 }
    );
  }
}
