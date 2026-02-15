'use client';

import { useEffect, useState } from 'react';
import type { FeatureFlag } from '@/types/feature-flags';

interface HealthReport {
  timestamp: string;
  summary: {
    total: number;
    enabled: number;
    disabled: number;
    stale: number;
    unused: number;
  };
  issues: HealthIssue[];
}

interface HealthIssue {
  type: 'stale' | 'unused' | 'misconfigured' | 'warning';
  severity: 'low' | 'medium' | 'high';
  flag: FeatureFlag;
  message: string;
  recommendation: string;
}

export default function SelfHealPage() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/feature-flags');
      if (!response.ok) throw new Error('Failed to fetch feature flags');
      
      const data = await response.json();
      const flags: FeatureFlag[] = data.flags;

      // Analyze flags for issues
      const issues: HealthIssue[] = [];
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      flags.forEach((flag) => {
        const createdAt = new Date(flag.created_at);
        const updatedAt = new Date(flag.updated_at);

        // Check for stale flags (not updated in 30 days)
        if (updatedAt < thirtyDaysAgo) {
          issues.push({
            type: 'stale',
            severity: 'medium',
            flag,
            message: `Flag has not been updated in ${Math.floor((now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1000))} days`,
            recommendation: 'Review if this flag is still needed or should be removed',
          });
        }

        // Check for flags that are disabled for a long time
        if (!flag.enabled && createdAt < thirtyDaysAgo) {
          issues.push({
            type: 'unused',
            severity: 'low',
            flag,
            message: 'Flag has been disabled for over 30 days',
            recommendation: 'Consider deleting this flag if no longer needed',
          });
        }

        // Check for site/user scoped flags without target_id
        if ((flag.scope === 'site' || flag.scope === 'user') && !flag.target_id) {
          issues.push({
            type: 'misconfigured',
            severity: 'high',
            flag,
            message: `${flag.scope} scoped flag has no target_id`,
            recommendation: 'Add a target_id or change scope to global',
          });
        }

        // Check for percentage rollout issues
        if (flag.scope === 'global' && flag.config?.percentage !== undefined) {
          const percentage = flag.config.percentage;
          if (percentage < 0 || percentage > 100) {
            issues.push({
              type: 'misconfigured',
              severity: 'high',
              flag,
              message: `Invalid percentage: ${percentage}`,
              recommendation: 'Set percentage between 0 and 100',
            });
          } else if (percentage === 100 && flag.enabled) {
            issues.push({
              type: 'warning',
              severity: 'low',
              flag,
              message: 'Flag is fully rolled out at 100%',
              recommendation: 'Consider removing percentage config if no longer needed',
            });
          }
        }
      });

      const healthReport: HealthReport = {
        timestamp: now.toISOString(),
        summary: {
          total: flags.length,
          enabled: flags.filter((f) => f.enabled).length,
          disabled: flags.filter((f) => !f.enabled).length,
          stale: issues.filter((i) => i.type === 'stale').length,
          unused: issues.filter((i) => i.type === 'unused').length,
        },
        issues: issues.sort((a, b) => {
          const severityOrder = { high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }),
      };

      setReport(healthReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Self-Heal Dashboard</h1>
            <p className="text-gray-400">
              Daily health reports and recommendations for feature flags
            </p>
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : '🔄 Refresh Report'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Summary */}
        {report && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <StatCard title="Total Flags" value={report.summary.total} color="blue" />
              <StatCard title="Enabled" value={report.summary.enabled} color="green" />
              <StatCard title="Disabled" value={report.summary.disabled} color="gray" />
              <StatCard title="Stale" value={report.summary.stale} color="yellow" />
              <StatCard title="Unused" value={report.summary.unused} color="red" />
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Report Summary</h2>
                <span className="text-sm text-gray-500">
                  Generated: {new Date(report.timestamp).toLocaleString()}
                </span>
              </div>
              
              {report.issues.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-xl text-green-400 font-semibold mb-2">
                    All Clear!
                  </p>
                  <p className="text-gray-400">
                    No issues detected with your feature flags
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report.issues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} />
                  ))}
                </div>
              )}
            </div>

            {/* Action Recommendations */}
            {report.issues.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Recommended Actions</h2>
                <div className="space-y-3">
                  {getRecommendations(report.issues).map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg"
                    >
                      <span className="text-2xl">{rec.icon}</span>
                      <div>
                        <p className="font-semibold mb-1">{rec.title}</p>
                        <p className="text-sm text-gray-400">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'gray' | 'yellow' | 'red';
}

function StatCard({ title, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-500/10',
    green: 'border-green-500 bg-green-500/10',
    gray: 'border-gray-600 bg-gray-600/10',
    yellow: 'border-yellow-500 bg-yellow-500/10',
    red: 'border-red-500 bg-red-500/10',
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-6`}>
      <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

interface IssueCardProps {
  issue: HealthIssue;
}

function IssueCard({ issue }: IssueCardProps) {
  const severityColor = {
    low: 'border-gray-600 bg-gray-800',
    medium: 'border-yellow-600 bg-yellow-900/20',
    high: 'border-red-600 bg-red-900/20',
  };

  const severityIcon = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🚨',
  };

  return (
    <div className={`${severityColor[issue.severity]} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{severityIcon[issue.severity]}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-lg">{issue.flag.name}</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                issue.type === 'stale'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : issue.type === 'unused'
                  ? 'bg-gray-500/20 text-gray-400'
                  : issue.type === 'misconfigured'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {issue.type}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                issue.severity === 'high'
                  ? 'bg-red-500/20 text-red-400'
                  : issue.severity === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {issue.severity}
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-2">{issue.message}</p>
          <p className="text-sm text-gray-400">
            💡 <strong>Recommendation:</strong> {issue.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

function getRecommendations(issues: HealthIssue[]) {
  const recommendations: Array<{
    icon: string;
    title: string;
    description: string;
  }> = [];

  const highSeverityCount = issues.filter((i) => i.severity === 'high').length;
  const staleCount = issues.filter((i) => i.type === 'stale').length;
  const unusedCount = issues.filter((i) => i.type === 'unused').length;

  if (highSeverityCount > 0) {
    recommendations.push({
      icon: '🚨',
      title: 'Address High Severity Issues First',
      description: `You have ${highSeverityCount} high severity issue(s) that need immediate attention.`,
    });
  }

  if (staleCount > 0) {
    recommendations.push({
      icon: '🔄',
      title: 'Review Stale Flags',
      description: `${staleCount} flag(s) have not been updated in over 30 days. Consider archiving or updating them.`,
    });
  }

  if (unusedCount > 0) {
    recommendations.push({
      icon: '🗑️',
      title: 'Clean Up Unused Flags',
      description: `${unusedCount} disabled flag(s) have been inactive for a while. Consider deleting them to reduce clutter.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      icon: '✨',
      title: 'Keep Up the Good Work',
      description: 'Your feature flags are in good health. Continue monitoring regularly.',
    });
  }

  return recommendations;
}
