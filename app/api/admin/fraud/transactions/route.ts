import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/fraud/transactions
 * List transactions with fraud scores
 * Admin-only access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { searchParams } = new URL(request.url);

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // pending, processing, completed, failed, refunded, disputed
    const flaggedOnly = searchParams.get('flaggedOnly') === 'true';
    const minFraudScore = searchParams.get('minFraudScore')
      ? parseFloat(searchParams.get('minFraudScore')!)
      : null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    const offset = (page - 1) * limit;

    // Build query
    let query = (supabase as any)
      .from('transactions')
      .select('*, profiles!transactions_user_id_fkey(email, display_name, handle)', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (flaggedOnly) {
      query = query.eq('flagged_for_review', true);
    }

    if (minFraudScore !== null) {
      query = query.gte('fraud_score', minFraudScore);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Get fraud statistics
    const { data: fraudStats } = await (supabase as any)
      .from('transactions')
      .select('fraud_score, flagged_for_review, status');

    const statistics = {
      totalTransactions: fraudStats?.length || 0,
      flaggedForReview: fraudStats?.filter((t: any) => t.flagged_for_review).length || 0,
      highRiskCount: fraudStats?.filter((t: any) => t.fraud_score && t.fraud_score >= 70).length || 0,
      mediumRiskCount: fraudStats?.filter((t: any) => t.fraud_score && t.fraud_score >= 40 && t.fraud_score < 70).length || 0,
      lowRiskCount: fraudStats?.filter((t: any) => t.fraud_score && t.fraud_score < 40).length || 0,
      avgFraudScore: fraudStats?.length
        ? Number((fraudStats.reduce((sum: number, t: any) => sum + (t.fraud_score || 0), 0) / fraudStats.length).toFixed(2))
        : 0,
      statusBreakdown: {
        pending: fraudStats?.filter((t: any) => t.status === 'pending').length || 0,
        processing: fraudStats?.filter((t: any) => t.status === 'processing').length || 0,
        completed: fraudStats?.filter((t: any) => t.status === 'completed').length || 0,
        failed: fraudStats?.filter((t: any) => t.status === 'failed').length || 0,
        refunded: fraudStats?.filter((t: any) => t.status === 'refunded').length || 0,
        disputed: fraudStats?.filter((t: any) => t.status === 'disputed').length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: transactions,
      statistics,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/fraud/transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/fraud/transactions
 * Create transaction record with fraud scoring
 * Admin-only access
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      user_id,
      transaction_type,
      amount,
      currency = 'USD',
      status = 'pending',
      payment_method,
      transaction_data = {},
    } = body;

    // Validate required fields
    if (!transaction_type || amount === undefined) {
      return NextResponse.json(
        { error: 'transaction_type and amount are required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      );
    }

    // Calculate fraud score based on various factors
    let fraudScore = 0;

    // Factor 1: High amount transactions are riskier
    if (amount > 1000) fraudScore += 20;
    else if (amount > 500) fraudScore += 10;
    else if (amount > 100) fraudScore += 5;

    // Factor 2: Check user's transaction history
    if (user_id) {
      const { data: userTransactions } = await (supabase as any)
        .from('transactions')
        .select('status, fraud_score')
        .eq('user_id', user_id);

      const failedTransactions = userTransactions?.filter((t: any) => t.status === 'failed').length || 0;
      const disputedTransactions = userTransactions?.filter((t: any) => t.status === 'disputed').length || 0;

      if (failedTransactions > 3) fraudScore += 25;
      else if (failedTransactions > 1) fraudScore += 15;

      if (disputedTransactions > 0) fraudScore += 30;

      // Check if user had high fraud scores before
      const avgPreviousFraudScore = userTransactions?.length
        ? userTransactions.reduce((sum: number, t: any) => sum + (t.fraud_score || 0), 0) / userTransactions.length
        : 0;

      if (avgPreviousFraudScore > 70) fraudScore += 20;
      else if (avgPreviousFraudScore > 40) fraudScore += 10;
    }

    // Factor 3: Payment method risk
    const riskyPaymentMethods = ['crypto', 'gift_card', 'wire_transfer'];
    if (payment_method && riskyPaymentMethods.includes(payment_method)) {
      fraudScore += 15;
    }

    // Cap fraud score at 100
    fraudScore = Math.min(fraudScore, 100);

    // Determine if transaction should be flagged for review
    const flaggedForReview = fraudScore >= 50;

    // Create transaction
    const { data: transaction, error: createError } = await (supabase as any)
      .from('transactions')
      .insert({
        user_id,
        transaction_type,
        amount,
        currency,
        status,
        payment_method,
        transaction_data,
        fraud_score: fraudScore,
        flagged_for_review: flaggedForReview,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating transaction:', createError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // If fraud score is high, create a security alert
    if (fraudScore >= 70) {
      await (supabase as any).rpc('create_security_alert', {
        p_alert_type: 'fraud_detected',
        p_severity: fraudScore >= 90 ? 'critical' : 'high',
        p_user_id: user_id || null,
        p_user_email: null,
        p_ip_address: null,
        p_user_agent: null,
        p_alert_data: {
          transaction_id: transaction.id,
          fraud_score: fraudScore,
          amount,
          transaction_type,
        },
      });
    }

    // Log admin action
    await (supabase as any).rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: (profile as any)?.email || '',
      p_action_type: 'transaction_created',
      p_action_details: {
        transaction_id: transaction.id,
        amount,
        fraud_score: fraudScore,
        flagged: flaggedForReview,
      },
    });

    return NextResponse.json({
      success: true,
      data: transaction,
      fraudAnalysis: {
        score: fraudScore,
        flagged: flaggedForReview,
        riskLevel: fraudScore >= 70 ? 'high' : fraudScore >= 40 ? 'medium' : 'low',
      },
      message: 'Transaction created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/admin/fraud/transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
