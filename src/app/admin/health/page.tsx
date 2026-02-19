'use client';

import { useState, useEffect } from 'react';

interface HealthData {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  version: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  environment: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  checks: {
    server: string;
    supabase_connection: string;
    database_schema: { status: string; tables?: Record<string, string> } | string;
    env_vars: string | { status: string; missing: string[] };
    ai_apis: string;
  };
  responseTime: string;
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setError(null);
      const res = await fetch('/api/health');
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch health status');
      }
      
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading health status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Health Status</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchHealth}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">No health data available</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'critical':
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return 'bg-green-500/20 border-green-500';
      case 'degraded':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'critical':
      case 'error':
        return 'bg-red-500/20 border-red-500';
      default:
        return 'bg-gray-500/20 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'error':
      case 'critical':
        return '❌';
      case 'missing':
        return '⚠️';
      case 'not_configured':
        return '⚠️';
      case 'no_keys_configured':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const heapUsedPercent = (data.memory.heapUsed / data.memory.heapTotal) * 100;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">System Health</h1>
            <p className="text-gray-400">Real-time system status and diagnostics</p>
          </div>
          <button
            onClick={fetchHealth}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Large Status Indicator */}
        <div className={`mb-8 p-6 rounded-lg border ${getStatusBgColor(data.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">System Status</h2>
              <p className={`text-3xl font-bold uppercase ${getStatusColor(data.status)}`}>
                {data.status}
              </p>
            </div>
            <div className={`text-6xl ${getStatusColor(data.status)}`}>
              {data.status === 'healthy' ? '✅' : data.status === 'degraded' ? '⚠️' : '❌'}
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-4">Last updated: {new Date(data.timestamp).toLocaleString()}</p>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Version</p>
            <p className="text-2xl font-bold">{data.version}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Uptime</p>
            <p className="text-2xl font-bold">{data.uptime.formatted}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Response Time</p>
            <p className="text-2xl font-bold">{data.responseTime}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Environment</p>
            <p className="text-2xl font-bold capitalize">{data.environment}</p>
          </div>
        </div>

        {/* Memory Section */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
          <h2 className="text-2xl font-bold mb-6">Memory Usage</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">RSS (Resident Set Size)</span>
                <span className="font-mono">{data.memory.rss} MB</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Heap Total</span>
                <span className="font-mono">{data.memory.heapTotal} MB</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Heap Used</span>
                <span className="font-mono">
                  {data.memory.heapUsed} MB ({heapUsedPercent.toFixed(1)}% of total heap)
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    heapUsedPercent > 90 ? 'bg-red-500' : heapUsedPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${heapUsedPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Checks Section */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
          <h2 className="text-2xl font-bold mb-6">Health Checks</h2>
          <div className="space-y-4">
            {/* Server */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(data.checks.server)}</span>
                <div>
                  <p className="font-semibold">Server</p>
                  <p className="text-sm text-gray-400">Core server status</p>
                </div>
              </div>
              <span className={`font-mono text-sm ${getStatusColor(data.checks.server)}`}>
                {data.checks.server}
              </span>
            </div>

            {/* Supabase Connection */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(data.checks.supabase_connection)}</span>
                <div>
                  <p className="font-semibold">Supabase Connection</p>
                  <p className="text-sm text-gray-400">Database connectivity</p>
                </div>
              </div>
              <span className={`font-mono text-sm ${getStatusColor(data.checks.supabase_connection)}`}>
                {data.checks.supabase_connection}
              </span>
            </div>

            {/* Database Schema */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {typeof data.checks.database_schema === 'object'
                      ? getStatusIcon(data.checks.database_schema.status)
                      : getStatusIcon('error')}
                  </span>
                  <div>
                    <p className="font-semibold">Database Schema</p>
                    <p className="text-sm text-gray-400">Table structure validation</p>
                  </div>
                </div>
                <span className={`font-mono text-sm ${
                  typeof data.checks.database_schema === 'object'
                    ? getStatusColor(data.checks.database_schema.status)
                    : 'text-red-400'
                }`}>
                  {typeof data.checks.database_schema === 'object'
                    ? data.checks.database_schema.status
                    : 'error'}
                </span>
              </div>
              
              {typeof data.checks.database_schema === 'object' && data.checks.database_schema.tables && (
                <div className="mt-4 ml-11">
                  <p className="text-sm text-gray-400 mb-2">Tables:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(data.checks.database_schema.tables).map(([table, status]) => (
                      <div key={table} className="flex items-center justify-between bg-gray-900 px-3 py-2 rounded">
                        <span className="text-sm">{table}</span>
                        <span className="text-xs ml-2">{getStatusIcon(status)} {status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {typeof data.checks.database_schema === 'string' && (
                <p className="text-sm text-red-400 mt-2 ml-11">{data.checks.database_schema}</p>
              )}
            </div>

            {/* Environment Variables */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {typeof data.checks.env_vars === 'object'
                      ? getStatusIcon(data.checks.env_vars.status)
                      : getStatusIcon(data.checks.env_vars)}
                  </span>
                  <div>
                    <p className="font-semibold">Environment Variables</p>
                    <p className="text-sm text-gray-400">Required configuration</p>
                  </div>
                </div>
                <span className={`font-mono text-sm ${
                  typeof data.checks.env_vars === 'object'
                    ? getStatusColor(data.checks.env_vars.status)
                    : getStatusColor(data.checks.env_vars)
                }`}>
                  {typeof data.checks.env_vars === 'object'
                    ? data.checks.env_vars.status
                    : data.checks.env_vars}
                </span>
              </div>
              
              {typeof data.checks.env_vars === 'object' && data.checks.env_vars.missing && (
                <div className="mt-3 ml-11 p-3 bg-yellow-900/20 border border-yellow-500 rounded">
                  <p className="text-sm text-yellow-400 font-semibold mb-1">Missing variables:</p>
                  <ul className="text-sm text-yellow-300 space-y-1">
                    {data.checks.env_vars.missing.map((varName) => (
                      <li key={varName} className="font-mono">• {varName}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI APIs */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(data.checks.ai_apis)}</span>
                <div>
                  <p className="font-semibold">AI APIs</p>
                  <p className="text-sm text-gray-400">API key configuration</p>
                </div>
              </div>
              <span className={`font-mono text-sm ${getStatusColor(data.checks.ai_apis)}`}>
                {data.checks.ai_apis}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
