'use client';

import { useEffect, useState } from 'react';

interface JournalStats {
  totalEntries: number;
  uniqueUsers: number;
  avgDurationMinutes: number;
  avgWordCount: number;
  avgCompletionRate: number;
  emailsQueued: number;
  emailsSent: number;
}

interface DailyEntry {
  date: string;
  count: number;
}

interface MoodDistribution {
  [mood: string]: number;
}

interface RecentEntry {
  id: string;
  date: string;
  mood: string;
  wordCount: number;
  durationMinutes: number;
  userId: string;
}

interface JournalData {
  success: boolean;
  period: string;
  stats: JournalStats;
  charts: {
    dailyEntries: DailyEntry[];
    moodDistribution: MoodDistribution;
  };
  recentEntries: RecentEntry[];
}

export default function JournalAnalyticsPage() {
  const [data, setData] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

  const fetchData = async (days: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/journal?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch journal analytics');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedPeriod);
  }, [selectedPeriod]);

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
  };

  const getMoodColor = (mood: string): string => {
    const colors: Record<string, string> = {
      happy: 'bg-green-500/20 text-green-400 border-green-500/30',
      excited: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      neutral: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      calm: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      sad: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      anxious: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      angry: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[mood.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading && !data) {
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
          <h1 className="text-4xl font-bold mb-2">Journal Analytics</h1>
          <p className="text-gray-400">
            Track journal entry metrics, mood patterns, and user engagement
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => handlePeriodChange(7)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              selectedPeriod === 7
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handlePeriodChange(30)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              selectedPeriod === 30
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handlePeriodChange(90)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              selectedPeriod === 90
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Last 90 Days
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Entries"
                value={data.stats.totalEntries}
                subtitle={data.period}
                color="blue"
              />
              <StatCard
                title="Unique Users"
                value={data.stats.uniqueUsers}
                subtitle="Active journalists"
                color="green"
              />
              <StatCard
                title="Avg Duration"
                value={`${data.stats.avgDurationMinutes.toFixed(1)}m`}
                subtitle="Per entry"
                color="purple"
              />
              <StatCard
                title="Avg Word Count"
                value={Math.round(data.stats.avgWordCount)}
                subtitle="Per entry"
                color="blue"
              />
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Completion Rate"
                value={`${data.stats.avgCompletionRate.toFixed(1)}%`}
                subtitle="Average completion"
                color="green"
              />
              <StatCard
                title="Emails Queued"
                value={data.stats.emailsQueued}
                subtitle="Pending delivery"
                color="purple"
              />
              <StatCard
                title="Emails Sent"
                value={data.stats.emailsSent}
                subtitle="Successfully delivered"
                color="green"
              />
            </div>

            {/* Mood Distribution */}
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Mood Distribution</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.charts.moodDistribution).map(([mood, count]) => (
                  <div
                    key={mood}
                    className={`px-4 py-3 rounded-lg border ${getMoodColor(mood)}`}
                  >
                    <div className="font-semibold capitalize">{mood}</div>
                    <div className="text-2xl font-bold mt-1">{count}</div>
                    <div className="text-xs opacity-75">entries</div>
                  </div>
                ))}
                {Object.keys(data.charts.moodDistribution).length === 0 && (
                  <p className="text-gray-500">No mood data available</p>
                )}
              </div>
            </div>

            {/* Daily Entries Chart */}
            {data.charts.dailyEntries.length > 0 && (() => {
              const maxCount = Math.max(...data.charts.dailyEntries.map(e => e.count));
              return (
                <div className="bg-gray-900 rounded-lg p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-4">Daily Entries</h2>
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 items-end min-w-max" style={{ height: '200px' }}>
                      {data.charts.dailyEntries.map((entry) => {
                        const heightPercent = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
                        return (
                          <div key={entry.date} className="flex flex-col items-center gap-2">
                            <div className="text-xs text-gray-500">{entry.count}</div>
                            <div
                              className="w-12 bg-blue-500 rounded-t"
                              style={{ height: `${heightPercent}%` }}
                            />
                            <div className="text-xs text-gray-400 whitespace-nowrap transform -rotate-45 origin-top-left mt-2">
                              {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Recent Entries Table */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Recent Entries</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Mood</th>
                      <th className="text-left py-3 px-4">Words</th>
                      <th className="text-left py-3 px-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEntries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          No recent entries found
                        </td>
                      </tr>
                    ) : (
                      data.recentEntries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-gray-800 hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4 text-gray-400">{entry.date}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm text-gray-400">
                              {entry.userId}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize border ${getMoodColor(
                                entry.mood
                              )}`}
                            >
                              {entry.mood}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{entry.wordCount}</td>
                          <td className="py-3 px-4 text-gray-400">
                            {entry.durationMinutes.toFixed(1)}m
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
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
