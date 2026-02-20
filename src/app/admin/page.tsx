'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';

interface AdminStats {
  stats: {
    totalAgents: number;
    activeAgents: number;
    activeSessions: number;
    totalMessages: number;
  };
  agents: Array<{
    id: string;
    name: string;
    status: string;
    model: string;
    activeTasks: number;
    totalTasks: number;
    createdAt: string;
    updatedAt: string;
  }>;
  recentActivity: Array<{
    sessionId: string;
    agentId: string;
    channel: string;
    status: string;
    messageCount: number;
    updatedAt: string;
  }>;
  systemHealth: {
    status: string;
    uptime?: number;
    memory?: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
      case 'healthy':
        return 'text-green-500';
      case 'idle':
        return 'text-blue-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen text-white p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-gray-400">
                  Real-time monitoring of agents, sessions, and system health
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/admin/experiments'}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  🧪 Experiments
                </button>
                <button
                  onClick={() => window.location.href = '/admin/gate'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  🎚️ Feature Gate
                </button>
                <button
                  onClick={() => window.location.href = '/admin/spending'}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  💰 Spending
                </button>
              </div>
            </div>
            {stats && (
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {formatDate(stats.timestamp)}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}

          {stats && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Agents"
                  value={stats.stats.totalAgents}
                  subtitle={`${stats.stats.activeAgents} active`}
                  color="blue"
                />
                <StatCard
                  title="Active Sessions"
                  value={stats.stats.activeSessions}
                  subtitle="Currently running"
                  color="green"
                />
                <StatCard
                  title="Total Messages"
                  value={stats.stats.totalMessages}
                  subtitle="Memory count"
                  color="purple"
                />
                <StatCard
                  title="System Status"
                  value={stats.systemHealth.status}
                  subtitle={
                    stats.systemHealth.uptime
                      ? formatUptime(stats.systemHealth.uptime)
                      : 'Unknown'
                  }
                  color={stats.systemHealth.status === 'healthy' ? 'green' : 'red'}
                />
              </div>

              {/* System Health */}
              {stats.systemHealth.memory && (
                <div className="bg-gray-900 rounded-lg p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-4">System Health</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Heap Used</p>
                      <p className="text-2xl font-semibold">
                        {stats.systemHealth.memory.heapUsed} MB
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Heap Total</p>
                      <p className="text-2xl font-semibold">
                        {stats.systemHealth.memory.heapTotal} MB
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">RSS Memory</p>
                      <p className="text-2xl font-semibold">
                        {stats.systemHealth.memory.rss} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agents */}
              <div className="bg-gray-900 rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">Agents</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Model</th>
                        <th className="text-left py-3 px-4">Tasks</th>
                        <th className="text-left py-3 px-4">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.agents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No agents found
                          </td>
                        </tr>
                      ) : (
                        stats.agents.map((agent) => (
                          <tr
                            key={agent.id}
                            className="border-b border-gray-800 hover:bg-gray-800/50"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-semibold">{agent.name}</p>
                                <p className="text-sm text-gray-500">{agent.id}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold ${getStatusColor(agent.status)}`}>
                                {agent.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400">{agent.model}</td>
                            <td className="py-3 px-4">
                              <span className="text-green-400">{agent.activeTasks}</span>
                              <span className="text-gray-500"> / {agent.totalTasks}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {formatDate(agent.updatedAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {stats.recentActivity.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                  ) : (
                    stats.recentActivity.map((activity) => (
                      <div
                        key={activity.sessionId}
                        className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold">{activity.agentId}</span>
                            <span className="text-sm text-gray-500">
                              {activity.channel}
                            </span>
                            <span className={`text-sm ${getStatusColor(activity.status)}`}>
                              {activity.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Session: {activity.sessionId.slice(0, 8)}... • {activity.messageCount} messages
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(activity.updatedAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}

function StatCard({ title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-500/10',
    green: 'border-green-500 bg-green-500/10',
    purple: 'border-purple-500 bg-purple-500/10',
    red: 'border-red-500 bg-red-500/10',
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-6`}>
      <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
