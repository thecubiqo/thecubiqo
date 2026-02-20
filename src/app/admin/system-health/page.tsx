'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  activeSessions: number;
  errorRate: number;
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
    cpu: 0,
    memory: 0,
    disk: 0,
    activeSessions: 0,
    errorRate: 0,
  });
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>({
    level: 'safe',
    score: 100,
    issues: [],
  });
  const [quarantine, setQuarantine] = useState<any[]>([]);

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!scanning) {
        updateMetrics();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [scanning]);

  const updateMetrics = () => {
    // Simulate metric updates (in production, fetch from actual APIs)
    setMetrics({
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      activeSessions: Math.floor(Math.random() * 50),
      errorRate: Math.random() * 5,
    });

    // Calculate threat level based on metrics
    const issues: string[] = [];
    let score = 100;

    if (metrics.cpu > 80) {
      issues.push('High CPU usage detected');
      score -= 20;
    }
    if (metrics.memory > 85) {
      issues.push('Memory usage critical');
      score -= 25;
    }
    if (metrics.disk > 90) {
      issues.push('Disk space low');
      score -= 15;
    }
    if (metrics.errorRate > 3) {
      issues.push('Elevated error rate');
      score -= 20;
    }

    const level: ThreatLevel['level'] = 
      score >= 90 ? 'safe' :
      score >= 70 ? 'caution' :
      score >= 50 ? 'warning' :
      'critical';

    setThreatLevel({ level, score, issues });
  };

  const runManualScan = async () => {
    setScanning(true);
    
    // Simulate scanning animation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fetch actual diagnostics
    try {
      const response = await fetch('/api/admin/system-health/scan', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuarantine(data.issues || []);
      }
    } catch (error) {
      console.error('Scan failed:', error);
    }
    
    setScanning(false);
    setLastScan(new Date());
    updateMetrics();
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
            title="CPU Usage"
            value={`${metrics.cpu.toFixed(1)}%`}
            icon="⚙️"
            threshold={80}
            current={metrics.cpu}
          />
          <MetricCard
            title="Memory"
            value={`${metrics.memory.toFixed(1)}%`}
            icon="💾"
            threshold={85}
            current={metrics.memory}
          />
          <MetricCard
            title="Disk Space"
            value={`${metrics.disk.toFixed(1)}%`}
            icon="💿"
            threshold={90}
            current={metrics.disk}
          />
          <MetricCard
            title="Active Sessions"
            value={metrics.activeSessions.toString()}
            icon="👥"
            threshold={100}
            current={metrics.activeSessions}
            isCount
          />
          <MetricCard
            title="Error Rate"
            value={`${metrics.errorRate.toFixed(2)}%`}
            icon="⚠️"
            threshold={3}
            current={metrics.errorRate}
          />
          <MetricCard
            title="Response Time"
            value={`${(Math.random() * 200).toFixed(0)}ms`}
            icon="⚡"
            threshold={200}
            current={Math.random() * 200}
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
}: {
  title: string;
  value: string;
  icon: string;
  threshold: number;
  current: number;
  isCount?: boolean;
}) {
  const isWarning = !isCount && current > threshold;
  const percentage = isCount ? (current / threshold) * 100 : current;

  return (
    <div className={`bg-gray-900 rounded-lg p-6 border-2 ${
      isWarning ? 'border-red-500/50' : 'border-gray-800'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-gray-400 text-sm">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${
        isWarning ? 'text-red-400' : 'text-white'
      }`}>
        {value}
      </p>
      {!isCount && (
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
