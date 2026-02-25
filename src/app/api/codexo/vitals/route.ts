/**
 * Codexo Vitals API
 * GET /api/codexo/vitals
 *
 * Returns aggregated usage data for the Codexo dashboard.
 * Replaces the Math.random() placeholder data in CodexoPanel with real
 * numbers pulled from usage_logs, credit_transactions, and credits tables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Start-of-day (00:00:00.000) for a given Date, in ISO string. */
function startOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Monday 00:00:00 of the week containing `date`. */
function startOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? 6 : day - 1; // Mon = 0 offset
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** 1st of the current month 00:00:00. */
function startOfMonth(date: Date): string {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Zero-state returned when the user has no org
// ---------------------------------------------------------------------------

const EMPTY_PERIOD = {
  totalSpend: 0,
  creditsUsed: 0,
  transactionCount: 0,
  byResource: [] as { resourceType: string; credits: number; count: number }[],
};

function emptyResponse() {
  return NextResponse.json({
    success: true,
    data: {
      creditBalance: 0,
      today: { ...EMPTY_PERIOD },
      thisWeek: { ...EMPTY_PERIOD },
      thisMonth: { ...EMPTY_PERIOD },
      recentTransactions: [],
    },
  });
}

// ---------------------------------------------------------------------------
// Types for rows coming back from Supabase (typed loosely so the `as any`
// cast on createClient doesn't fight us).
// ---------------------------------------------------------------------------

interface UsageRow {
  resource_type: string | null;
  credits_consumed: number | string;
  created_at: string;
}

interface TxnRow {
  amount: number | string;
  transaction_type: string | null;
  description: string | null;
  resource_type: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Aggregation logic
// ---------------------------------------------------------------------------

interface PeriodAgg {
  totalSpend: number;
  creditsUsed: number;
  transactionCount: number;
  byResource: { resourceType: string; credits: number; count: number }[];
}

/**
 * Aggregate usage rows and transaction rows that fall within a given window
 * into the shape expected by the response.
 */
function aggregatePeriod(
  usageRows: UsageRow[],
  txnRows: TxnRow[],
  sinceISO: string,
): PeriodAgg {
  // Filter rows to the window (rows are already filtered by Supabase for the
  // broadest window — month — but we reuse the same arrays for narrower
  // windows via an in-memory filter).
  const usage = usageRows.filter((u) => u.created_at >= sinceISO);
  const txns = txnRows.filter((t) => t.created_at >= sinceISO);

  // Total spend = sum of absolute amounts of "usage" transactions
  const totalSpend = txns
    .filter((t) => t.transaction_type === 'usage')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  // Credits used = sum of credits_consumed from usage_logs
  const creditsUsed = usage.reduce(
    (sum, u) => sum + Number(u.credits_consumed),
    0,
  );

  // Group usage by resource_type
  const resMap: Record<string, { credits: number; count: number }> = {};
  for (const u of usage) {
    const rt = u.resource_type || 'unknown';
    if (!resMap[rt]) resMap[rt] = { credits: 0, count: 0 };
    resMap[rt].credits += Number(u.credits_consumed);
    resMap[rt].count += 1;
  }

  const byResource = Object.entries(resMap).map(([resourceType, data]) => ({
    resourceType,
    credits: data.credits,
    count: data.count,
  }));

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    creditsUsed,
    transactionCount: txns.length,
    byResource,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;

    // --- Auth ----------------------------------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, data: null, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // --- Org lookup ----------------------------------------------------
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const orgId = membership?.org_id;

    if (!orgId) {
      return emptyResponse();
    }

    // --- Time boundaries -----------------------------------------------
    const now = new Date();
    const todayISO = startOfDay(now);
    const weekISO = startOfWeek(now);
    const monthISO = startOfMonth(now);

    // --- Parallel data fetches -----------------------------------------
    // Fetch the broadest window (month) so we can derive today/week in memory.
    const [
      { data: credits },
      { data: monthUsage },
      { data: monthTxns },
      { data: recentTxns },
    ] = await Promise.all([
      // 1. Current credit balance
      supabase
        .from('credits')
        .select('balance')
        .eq('org_id', orgId)
        .single(),

      // 2. Usage logs for the current month
      supabase
        .from('usage_logs')
        .select('resource_type, credits_consumed, created_at')
        .eq('org_id', orgId)
        .gte('created_at', monthISO)
        .order('created_at', { ascending: false })
        .limit(500),

      // 3. Credit transactions for the current month
      supabase
        .from('credit_transactions')
        .select(
          'amount, transaction_type, description, resource_type, created_at',
        )
        .eq('org_id', orgId)
        .gte('created_at', monthISO)
        .order('created_at', { ascending: false })
        .limit(500),

      // 4. Last 20 transactions (for the "recent" list, regardless of window)
      supabase
        .from('credit_transactions')
        .select(
          'amount, transaction_type, description, resource_type, created_at',
        )
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const usageRows: UsageRow[] = monthUsage ?? [];
    const txnRows: TxnRow[] = monthTxns ?? [];

    // --- Aggregate per period ------------------------------------------
    const today = aggregatePeriod(usageRows, txnRows, todayISO);
    const thisWeek = aggregatePeriod(usageRows, txnRows, weekISO);
    const thisMonth = aggregatePeriod(usageRows, txnRows, monthISO);

    // --- Format recent transactions ------------------------------------
    const recentTransactions = (recentTxns ?? []).map((t: TxnRow) => ({
      amount: Number(t.amount),
      type: t.transaction_type,
      description: t.description,
      resourceType: t.resource_type,
      createdAt: t.created_at,
    }));

    // --- Respond -------------------------------------------------------
    return NextResponse.json({
      success: true,
      data: {
        creditBalance: credits?.balance ?? 0,
        today: {
          ...today,
          byResource: today.byResource,
        },
        thisWeek,
        thisMonth,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Failed to fetch codexo vitals:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Failed to fetch codexo vitals',
      },
      { status: 500 },
    );
  }
}
