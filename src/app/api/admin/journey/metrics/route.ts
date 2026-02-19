/**
 * Admin Journey Metrics API
 * Provides analytics and monitoring for Journey memory system
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-guard';

export const GET = withAdminAuth(async (_request, { supabase }) => {
  // Get feature flag status
  const { data: featureFlag } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('name', 'journey_memory')
    .single();

  // Count total users with consents
  const { count: totalUsers } = await supabase
    .from('journey_consents')
    .select('*', { count: 'exact', head: true });

  // Count opted-in users
  const { count: optedInUsers } = await supabase
    .from('journey_consents')
    .select('*', { count: 'exact', head: true })
    .eq('opted_in', true)
    .is('revoked_at', null);

  // Count total memories
  const { count: totalMemories } = await supabase
    .from('journey_memories')
    .select('*', { count: 'exact', head: true });

  // Get recent consents
  const { data: recentConsents } = await supabase
    .from('journey_consents')
    .select('id, user_id, opted_in, retention_days, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get top users by memory count
  let topUsers = [];
  try {
    const { data } = await supabase
      .rpc('get_top_journey_users', { limit_count: 10 });
    topUsers = data || [];
  } catch {
    topUsers = [];
  }

  // Get rollback logs
  const { data: rollbackLogs } = await supabase
    .from('journey_rollback_logs')
    .select('id, user_id, action_type, affected_count, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get metrics aggregates
  const { data: metricsAgg } = await supabase
    .from('journey_metrics')
    .select('memory_completeness_score, similarity_queries_count, premium_feature_uses')
    .order('metric_date', { ascending: false })
    .limit(30);

  // Calculate averages
  const avgMemoriesPerUser = totalUsers && totalUsers > 0
    ? (totalMemories || 0) / totalUsers
    : 0;

  const avgCompletenessScore = metricsAgg && metricsAgg.length > 0
    ? metricsAgg.reduce((sum, m) => sum + (m.memory_completeness_score || 0), 0) / metricsAgg.length
    : 0;

  const totalQueries = metricsAgg && metricsAgg.length > 0
    ? metricsAgg.reduce((sum, m) => sum + (m.similarity_queries_count || 0), 0)
    : 0;

  const totalPremiumUses = metricsAgg && metricsAgg.length > 0
    ? metricsAgg.reduce((sum, m) => sum + (m.premium_feature_uses || 0), 0)
    : 0;

  const avgQueriesPerUser = optedInUsers && optedInUsers > 0
    ? totalQueries / optedInUsers
    : 0;

  return NextResponse.json({
    featureEnabled: featureFlag?.enabled || false,
    metrics: {
      totalUsers: totalUsers || 0,
      optedInUsers: optedInUsers || 0,
      totalMemories: totalMemories || 0,
      avgMemoriesPerUser,
      avgCompletenessScore,
      recentConsents: recentConsents || [],
      topUsers: topUsers || [],
      rollbackLogs: rollbackLogs || [],
      monetizationStats: {
        totalQueries,
        premiumFeatureUses: totalPremiumUses,
        avgQueriesPerUser,
      },
    },
  });
});
