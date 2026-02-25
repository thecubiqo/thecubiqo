'use client';

import { useState, useEffect, useCallback } from 'react';

interface Deployment {
  id: string;
  projectId: string;
  environment: string;
  platform: string;
  status: string;
  url: string | null;
  message: string;
  timestamp: string;
}

interface ExecutionStat {
  language: string;
  count: number;
  successRate: number;
  avgTime: number;
}

export default function AnalyticsPanel() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [stats, setStats] = useState<ExecutionStat[]>([
    { language: 'TypeScript', count: 0, successRate: 100, avgTime: 0 },
    { language: 'JavaScript', count: 0, successRate: 100, avgTime: 0 },
    { language: 'Python', count: 0, successRate: 100, avgTime: 0 },
  ]);
  const [activeView, setActiveView] = useState<'deployments' | 'executions'>('deployments');

  // Track deployments in localStorage for persistence
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cubiqo-deployments');
      if (stored) setDeployments(JSON.parse(stored));
      const storedStats = localStorage.getItem('cubiqo-exec-stats');
      if (storedStats) setStats(JSON.parse(storedStats));
    } catch {}
  }, []);

  const addDeployment = useCallback((deployment: Deployment) => {
    setDeployments(prev => {
      const updated = [deployment, ...prev].slice(0, 50);
      try { localStorage.setItem('cubiqo-deployments', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const trackExecution = useCallback((language: string, success: boolean, timeMs: number) => {
    setStats(prev => {
      const updated = prev.map(s => {
        if (s.language.toLowerCase() === language.toLowerCase()) {
          const newCount = s.count + 1;
          const successCount = Math.round(s.successRate * s.count / 100) + (success ? 1 : 0);
          return {
            ...s,
            count: newCount,
            successRate: Math.round((successCount / newCount) * 100),
            avgTime: Math.round((s.avgTime * s.count + timeMs) / newCount),
          };
        }
        return s;
      });
      try { localStorage.setItem('cubiqo-exec-stats', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // Expose methods globally for other components to call
  useEffect(() => {
    (window as any).__cubiqoAnalytics = { addDeployment, trackExecution };
    return () => { delete (window as any).__cubiqoAnalytics; };
  }, [addDeployment, trackExecution]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': case 'ready': return 'text-green-400 bg-green-500/10';
      case 'queued': case 'building': return 'text-yellow-400 bg-yellow-500/10';
      case 'failed': case 'error': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-800 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-xl">📊</div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Analytics
          </h3>
        </div>

        {/* Toggle */}
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setActiveView('deployments')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeView === 'deployments'
                ? 'bg-teal-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            🚀 Deployments
          </button>
          <button
            onClick={() => setActiveView('executions')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeView === 'executions'
                ? 'bg-teal-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            ⚡ Executions
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeView === 'deployments' ? (
          <div className="space-y-3">
            {deployments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🚀</div>
                <h4 className="text-sm font-semibold text-white mb-1">No Deployments Yet</h4>
                <p className="text-xs text-gray-500">Click &quot;Deploy Now&quot; to push your code to production</p>
              </div>
            ) : (
              deployments.map((d) => (
                <div key={d.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(d.status)}`}>
                      {d.status}
                    </span>
                    <span className="text-xs text-gray-500">{d.timestamp}</span>
                  </div>
                  <p className="text-xs text-gray-300">{d.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>📦 {d.projectId}</span>
                    <span>🌐 {d.environment}</span>
                    <span>☁️ {d.platform}</span>
                  </div>
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                    >
                      🔗 {d.url}
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Execution Stats */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.language} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{s.count}</div>
                  <div className="text-xs text-gray-400">{s.language}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {s.successRate}% success · {s.avgTime}ms avg
                  </div>
                </div>
              ))}
            </div>

            {/* Total Stats */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Total Executions</span>
                  <div className="text-lg font-bold text-white">{stats.reduce((a, s) => a + s.count, 0)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Deployments</span>
                  <div className="text-lg font-bold text-white">{deployments.length}</div>
                </div>
                <div>
                  <span className="text-gray-500">Avg Success Rate</span>
                  <div className="text-lg font-bold text-green-400">
                    {stats.reduce((a, s) => a + s.count, 0) > 0
                      ? Math.round(stats.reduce((a, s) => a + s.successRate * s.count, 0) / Math.max(1, stats.reduce((a, s) => a + s.count, 0)))
                      : 100}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Last Deploy</span>
                  <div className="text-sm font-bold text-white">
                    {deployments[0]?.timestamp || 'Never'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
