'use client';

import { useCallback, useEffect, useState } from 'react';

interface SystemEvent {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown> | null;
}

interface EventsData {
  events: SystemEvent[];
  stats: {
    total: number;
    typeCounts: Record<string, number>;
  };
  timestamp: string;
}

export default function EventsPage() {
  const [data, setData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (selectedType) {
        params.append('type', selectedType);
      }

      const response = await fetch(`/api/admin/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const responseData = await response.json();
      setData(responseData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedType, limit]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Handle future timestamps (clock skew)
    if (diffMs < 0) {
      return 'just now';
    }
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getEventTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('error') || lowerType.includes('fail')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (lowerType.includes('warn')) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    if (lowerType.includes('success') || lowerType.includes('complete')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (lowerType.includes('auth') || lowerType.includes('login')) {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
    if (lowerType.includes('create') || lowerType.includes('add')) {
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
    if (lowerType.includes('delete') || lowerType.includes('remove')) {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatJsonPreview = (data: Record<string, unknown> | null) => {
    if (!data) return 'N/A';
    try {
      const str = JSON.stringify(data);
      if (str.length > 100) {
        return str.substring(0, 100) + '...';
      }
      return str;
    } catch {
      return 'Invalid JSON';
    }
  };

  const getLatestEventTime = () => {
    if (!data?.events || data.events.length === 0) return 'N/A';
    const latestEvent = data.events.reduce((latest, event) => {
      return new Date(event.created_at) > new Date(latest.created_at) ? event : latest;
    });
    return formatRelativeTime(latestEvent.created_at);
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">System Events</h1>
              <p className="text-gray-400">
                Monitor and analyze system events in real-time
              </p>
            </div>
            <button
              onClick={fetchEvents}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
          {data && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {formatDate(data.timestamp)}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Events"
                value={data.stats.total}
                subtitle={`${data.events.length} shown`}
                color="blue"
              />
              <StatCard
                title="Event Types"
                value={Object.keys(data.stats.typeCounts).length}
                subtitle="Unique types"
                color="purple"
              />
              <StatCard
                title="Latest Event"
                value={getLatestEventTime()}
                subtitle="Most recent"
                color="green"
              />
            </div>

            {/* Event Type Filters */}
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Filter by Type</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedType === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  All ({data.stats.total})
                </button>
                {Object.entries(data.stats.typeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        selectedType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {type} ({count})
                    </button>
                  ))}
              </div>
            </div>

            {/* Limit Control */}
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Results Limit</h2>
              <div className="flex items-center gap-4">
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={25}>25 events</option>
                  <option value={50}>50 events</option>
                  <option value={100}>100 events</option>
                  <option value={200}>200 events</option>
                </select>
                <span className="text-gray-400 text-sm">
                  Showing {data.events.length} of {data.stats.total} total events
                </span>
              </div>
            </div>

            {/* Events Table */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Events</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Timestamp</th>
                      <th className="text-left py-3 px-4">Details</th>
                      <th className="text-left py-3 px-4">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No events found
                          {selectedType && (
                            <span>
                              {' '}
                              for type "{selectedType}".{' '}
                              <button
                                onClick={() => setSelectedType(null)}
                                className="text-blue-400 hover:text-blue-300 underline"
                              >
                                Clear filter
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ) : (
                      data.events.map((event) => (
                        <tr
                          key={event.id}
                          className="border-b border-gray-800 hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold border ${getEventTypeColor(
                                event.type
                              )}`}
                            >
                              {event.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-white">{formatDate(event.created_at)}</p>
                              <p className="text-sm text-gray-500">
                                {formatRelativeTime(event.created_at)}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-md">
                              <code className="text-xs text-gray-400 break-all">
                                {formatJsonPreview(event.data)}
                              </code>
                              {event.data && JSON.stringify(event.data).length > 100 && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-xs text-blue-400 hover:text-blue-300">
                                    View full data
                                  </summary>
                                  <pre className="mt-2 p-2 bg-gray-950 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(event.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-xs text-gray-500">{event.id}</code>
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
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
}

function StatCard({ title, value, subtitle, color }: StatCardProps) {
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
