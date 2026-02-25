'use client';

import { useEffect, useState } from 'react';

interface JourneyMetrics {
  totalUsers: number;
  optedInUsers: number;
  totalMemories: number;
  avgMemoriesPerUser: number;
  avgCompletenessScore: number;
  recentConsents: Array<{
    id: string;
    user_id: string;
    opted_in: boolean;
    retention_days: number;
    created_at: string;
  }>;
  topUsers: Array<{
    user_id: string;
    memory_count: number;
    avg_importance: number;
    last_memory_at: string;
  }>;
  rollbackLogs: Array<{
    id: string;
    user_id: string;
    action_type: string;
    affected_count: number;
    reason: string;
    created_at: string;
  }>;
  monetizationStats: {
    totalQueries: number;
    premiumFeatureUses: number;
    avgQueriesPerUser: number;
  };
}

export default function AdminJourneyMetrics() {
  const [metrics, setMetrics] = useState<JourneyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(false);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/journey/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.metrics);
      setFeatureEnabled(data.featureEnabled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async () => {
    try {
      const response = await fetch('/api/admin/journey/feature-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !featureEnabled }),
      });

      if (!response.ok) throw new Error('Failed to toggle feature');
      
      setFeatureEnabled(!featureEnabled);
      await fetchMetrics();
    } catch (err) {
      alert('Failed to toggle feature: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Journey Memory Admin</h1>
              <p className="text-gray-400">
                Analytics, metrics, and rollback controls
              </p>
            </div>
            <button
              onClick={toggleFeature}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                featureEnabled
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-green-600 hover:bg-green-500'
              }`}
            >
              {featureEnabled ? 'Disable Feature' : 'Enable Feature'}
            </button>
          </div>
          {metrics && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {formatDate(new Date().toISOString())}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Feature Status */}
        <div className="bg-gray-900 rounded-lg p-6 border-2 mb-8"
          style={{ borderColor: featureEnabled ? '#10b981' : '#6b7280' }}
        >
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${featureEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
            <div>
              <h2 className="text-xl font-semibold">Feature Status</h2>
              <p className="text-gray-400">
                {featureEnabled ? 'Journey Memory is currently enabled' : 'Journey Memory is currently disabled'}
              </p>
            </div>
          </div>
        </div>

        {metrics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Users"
                value={metrics.totalUsers}
                subtitle={`${metrics.optedInUsers} opted in`}
                color="blue"
              />
              <MetricCard
                title="Total Memories"
                value={metrics.totalMemories}
                subtitle={`${metrics.avgMemoriesPerUser.toFixed(1)} avg/user`}
                color="purple"
              />
              <MetricCard
                title="Completeness Score"
                value={`${Math.round(metrics.avgCompletenessScore * 100)}%`}
                subtitle="Average profile"
                color="green"
              />
              <MetricCard
                title="Similarity Queries"
                value={metrics.monetizationStats.totalQueries}
                subtitle={`${metrics.monetizationStats.avgQueriesPerUser.toFixed(1)} avg/user`}
                color="yellow"
              />
            </div>

            {/* Monetization Stats */}
            <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Monetization Hooks</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Queries</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {metrics.monetizationStats.totalQueries}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Premium Uses</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {metrics.monetizationStats.premiumFeatureUses}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Avg Queries/User</p>
                  <p className="text-3xl font-bold text-green-400">
                    {metrics.monetizationStats.avgQueriesPerUser.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                💡 These metrics can be used to identify power users for premium
                feature upsells
              </p>
            </div>

            {/* Top Users */}
            <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Top Users by Memory Count</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">User ID</th>
                      <th className="text-left py-3 px-4">Memory Count</th>
                      <th className="text-left py-3 px-4">Avg Importance</th>
                      <th className="text-left py-3 px-4">Last Memory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No users with memories yet
                        </td>
                      </tr>
                    ) : (
                      metrics.topUsers.map((user) => (
                        <tr
                          key={user.user_id}
                          className="border-b border-gray-800 hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4 font-mono text-sm">
                            {user.user_id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-4 text-green-400 font-semibold">
                            {user.memory_count}
                          </td>
                          <td className="py-3 px-4">
                            {Math.round(user.avg_importance * 100)}%
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">
                            {formatDate(user.last_memory_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Consents */}
            <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Recent Consents</h2>
              <div className="space-y-3">
                {metrics.recentConsents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No consents yet</p>
                ) : (
                  metrics.recentConsents.map((consent) => (
                    <div
                      key={consent.id}
                      className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-sm">
                            {consent.user_id.slice(0, 8)}...
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              consent.opted_in
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {consent.opted_in ? 'Opted In' : 'Opted Out'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Retention: {consent.retention_days} days
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(consent.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rollback Logs */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">
                Rollback & Deletion Logs
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {metrics.rollbackLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No rollback events yet
                  </p>
                ) : (
                  metrics.rollbackLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-semibold text-white">
                            {log.action_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="ml-2 text-sm text-gray-400">
                            by {log.user_id ? log.user_id.slice(0, 8) + '...' : 'system'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-1">
                        {log.reason}
                      </p>
                      <p className="text-sm text-gray-500">
                        Affected: {log.affected_count} memories
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
}

function MetricCard({ title, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-500/10',
    green: 'border-green-500 bg-green-500/10',
    purple: 'border-purple-500 bg-purple-500/10',
    red: 'border-red-500 bg-red-500/10',
    yellow: 'border-yellow-500 bg-yellow-500/10',
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-6`}>
      <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
