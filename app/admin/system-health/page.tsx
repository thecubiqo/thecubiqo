'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface HealthApiResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    supabase: { status: string; latency?: number };
    agents: { status: string; totalAgents?: number; activeAgents?: number };
    memory: { status: string; heapUsedMB?: number; heapTotalMB?: number; rssMB?: number };
    uptime: { status: string; uptimeSeconds?: number; uptimeHuman?: string };
  };
  timestamp: string;
}

interface SystemMetrics {
  memoryPercent: number;
  heapUsedMB: number;
  heapTotalMB: number;
  activeAgents: number;
  totalAgents: number;
  responseTimeMs: number;
  uptimeSeconds: number;
  supabaseStatus: string;
  agentsStatus: string;
}

interface ThreatLevel {
  level: 'safe' | 'caution' | 'warning' | 'critical';
  score: number;
  issues: string[];
}

export default function SystemHealthPage() {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    memoryPercent: 0,
    heapUsedMB: 0,
    heapTotalMB: 0,
    activeAgents: 0,
    totalAgents: 0,
    responseTimeMs: 0,
    uptimeSeconds: 0,
    supabaseStatus: 'unknown',
    agentsStatus: 'unknown',
  });
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>({
    level: 'safe',
    score: 100,
    issues: [],
  });
  const [quarantine, setQuarantine] = useState<any[]>([]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/health');
      if (!res.ok) return;
      const data: HealthApiResponse = await res.json();

      const heapUsed = data.services.memory?.heapUsedMB ?? 0;
      const heapTotal = data.services.memory?.heapTotalMB ?? 1;
      const memPct = heapTotal > 0 ? (heapUsed / heapTotal) * 100 : 0;
      const latency = data.services.supabase?.latency ?? 0;
      const activeAgents = data.services.agents?.activeAgents ?? 0;
      const totalAgents = data.services.agents?.totalAgents ?? 0;
      const uptimeSec = data.services.uptime?.uptimeSeconds ?? 0;

      const updated: SystemMetrics = {
        memoryPercent: memPct,
        heapUsedMB: heapUsed,
        heapTotalMB: heapTotal,
        activeAgents,
        totalAgents,
        responseTimeMs: latency,
        uptimeSeconds: uptimeSec,
        supabaseStatus: data.services.supabase?.status ?? 'unknown',
        agentsStatus: data.services.agents?.status ?? 'unknown',
      };
      setMetrics(updated);

      // Compute threat level from real data
      const issues: string[] = [];
      let score = 100;

      if (memPct > 85) {
        issues.push('Memory usage critical');
        score -= 25;
      } else if (memPct > 70) {
        issues.push('Memory usage elevated');
        score -= 10;
      }
      if (data.services.supabase?.status !== 'healthy') {
        issues.push('Database connectivity degraded');
        score -= 30;
      }
      if (data.services.agents?.status === 'degraded') {
        issues.push('Agent services degraded');
        score -= 15;
      } else if (data.services.agents?.status !== 'healthy') {
        issues.push('Agent services unhealthy');
        score -= 25;
      }
      if (latency > 500) {
        issues.push('High database response time');
        score -= 15;
      }

      const level: ThreatLevel['level'] =
        score >= 90 ? 'safe' :
        score >= 70 ? 'caution' :
        score >= 50 ? 'warning' :
        'critical';

      setThreatLevel({ level, score: Math.max(score, 0), issues });
    } catch (err) {
      console.error('Failed to fetch health data:', err);
    }
  }, []);

  // Fetch on mount and every 10 seconds
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => {
      if (!scanning) fetchHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth, scanning]);

  const runManualScan = async () => {
    setScanning(true);

    try {
      const response = await fetch('/api/admin/self-heal/run', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setQuarantine(data.issues || []);
      }
    } catch (error) {
      console.error('Scan failed:', error);
    }

    await fetchHealth();
    setScanning(false);
    setLastScan(new Date());
  };

  const getThreatColor = (level: ThreatLevel['level']) => {
    switch (level) {
      case 'safe':
        return 'text-green-400';
      case 'caution':
        return 'text-yellow-400';
      case 'warning':
        return 'text-orange-400';
      case 'critical':
        return 'text-red-400';
    }
  };

  const getThreatBg = (level: ThreatLevel['level']) => {
    switch (level) {
      case 'safe':
        return 'bg-green-500/20 border-green-500';
      case 'caution':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'warning':
        return 'bg-orange-500/20 border-orange-500';
      case 'critical':
        return 'bg-red-500/20 border-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">🛡️ System Health Monitor</h1>
              <p className="text-gray-400">
                Real-time system diagnostics and threat detection
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={runManualScan}
                disabled={scanning}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {scanning ? '🔄 Scanning...' : '🔍 Run Manual Scan'}
              </button>
              <Link
                href="/admin/self-heal"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                📋 View Reports
              </Link>
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                ← Dashboard
              </Link>
            </div>
          </div>

          {lastScan && (
            <p className="text-sm text-gray-500">
              Last scan: {lastScan.toLocaleString()}
            </p>
          )}
        </div>

        {/* Threat Level Indicator */}
        <div className={`mb-8 p-8 rounded-lg border-2 ${getThreatBg(threatLevel.level)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">System Status</h2>
              <p className={`text-5xl font-bold ${getThreatColor(threatLevel.level)}`}>
                {threatLevel.level.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">Health Score</p>
              <p className={`text-6xl font-bold ${getThreatColor(threatLevel.level)}`}>
                {threatLevel.score}
              </p>
            </div>
          </div>
          
          {threatLevel.issues.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="font-semibold text-sm">⚠️ Active Issues:</p>
              {threatLevel.issues.map((issue, idx) => (
                <div key={idx} className="text-sm bg-black/30 rounded px-3 py-2">
                  {issue}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title="Memory (Heap)"
            value={`${metrics.memoryPercent.toFixed(1)}%`}
            icon="💾"
            threshold={85}
            current={metrics.memoryPercent}
            subtitle={`${metrics.heapUsedMB} / ${metrics.heapTotalMB} MB`}
          />
          <MetricCard
            title="Active Agents"
            value={`${metrics.activeAgents} / ${metrics.totalAgents}`}
            icon="🤖"
            threshold={metrics.totalAgents}
            current={metrics.activeAgents}
            isCount
          />
          <MetricCard
            title="DB Response Time"
            value={metrics.responseTimeMs > 0 ? `${metrics.responseTimeMs}ms` : 'N/A'}
            icon="⚡"
            threshold={500}
            current={metrics.responseTimeMs}
          />
          <MetricCard
            title="Supabase"
            value={metrics.supabaseStatus.charAt(0).toUpperCase() + metrics.supabaseStatus.slice(1)}
            icon="🗄️"
            threshold={1}
            current={metrics.supabaseStatus === 'healthy' ? 0 : 1}
            isStatus
          />
          <MetricCard
            title="Agent Services"
            value={metrics.agentsStatus.charAt(0).toUpperCase() + metrics.agentsStatus.slice(1)}
            icon="⚙️"
            threshold={1}
            current={metrics.agentsStatus === 'healthy' ? 0 : 1}
            isStatus
          />
          <MetricCard
            title="CPU Usage"
            value="N/A"
            icon="🖥️"
            threshold={80}
            current={0}
            subtitle="Not available server-side"
          />
        </div>

        {/* Scanning Animation */}
        {scanning && (
          <div className="bg-gray-900 rounded-lg p-12 text-center mb-8">
            <div className="text-6xl mb-4 animate-pulse">🔍</div>
            <h2 className="text-2xl font-bold mb-2">Scanning System...</h2>
            <p className="text-gray-400 mb-6">
              Running comprehensive diagnostics
            </p>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-500 animate-[progress_3s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Quarantine Section */}
        {quarantine.length > 0 && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-400">
              🔒 Quarantined Issues
            </h2>
            <div className="space-y-3">
              {quarantine.map((item, idx) => (
                <div key={idx} className="bg-black/30 rounded p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    </div>
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition">
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/self-heal"
            className="bg-gray-900 hover:bg-gray-800 rounded-lg p-6 text-center transition"
          >
            <div className="text-4xl mb-2">📋</div>
            <p className="font-semibold">View Reports</p>
          </Link>
          <button
            onClick={runManualScan}
            className="bg-gray-900 hover:bg-gray-800 rounded-lg p-6 text-center transition"
          >
            <div className="text-4xl mb-2">🔍</div>
            <p className="font-semibold">Manual Scan</p>
          </button>
          <Link
            href="/admin"
            className="bg-gray-900 hover:bg-gray-800 rounded-lg p-6 text-center transition"
          >
            <div className="text-4xl mb-2">📊</div>
            <p className="font-semibold">Dashboard</p>
          </Link>
          <Link
            href="/api/metrics/performance"
            className="bg-gray-900 hover:bg-gray-800 rounded-lg p-6 text-center transition"
          >
            <div className="text-4xl mb-2">⚡</div>
            <p className="font-semibold">Performance</p>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  threshold,
  current,
  isCount = false,
  isStatus = false,
  subtitle,
}: {
  title: string;
  value: string;
  icon: string;
  threshold: number;
  current: number;
  isCount?: boolean;
  isStatus?: boolean;
  subtitle?: string;
}) {
  const isWarning = !isCount && !isStatus && current > threshold;
  const isStatusWarning = isStatus && current > 0;
  const showWarning = isWarning || isStatusWarning;
  const percentage = isCount ? (threshold > 0 ? (current / threshold) * 100 : 0) : current;

  return (
    <div className={`bg-gray-900 rounded-lg p-6 border-2 ${
      showWarning ? 'border-red-500/50' : 'border-gray-800'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-gray-400 text-sm">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${
        showWarning ? 'text-red-400' : 'text-white'
      }`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
      {!isCount && !isStatus && (
        <div className="mt-3 w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isWarning ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
