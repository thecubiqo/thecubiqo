// Security Dashboard - Real-time Security Monitoring
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonMetricCard } from '@/components/ui/LoadingSkeleton';

interface SecurityMetrics {
  rateLimit: {
    totalBlocks: number;
    globalBlocks: number;
    authBlocks: number;
    apiBlocks: number;
    blockRate: number;
  };
  fraud: {
    totalTransactions: number;
    flaggedTransactions: number;
    blockedTransactions: number;
    averageRiskScore: number;
  };
  phishing: {
    urlsScanned: number;
    suspiciousUrls: number;
    maliciousUrls: number;
    blockedClicks: number;
  };
  auth: {
    successfulLogins: number;
    failedLogins: number;
    mfaChallenges: number;
    failureRate: number;
  };
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch from actual metrics API
    // For now, using mock data based on our implementation
    fetch('/api/founders-pass/health')
      .then((r) => r.json())
      .then((health) => {
        setHealthStatus(health);
        
        // Mock metrics - in production, these would come from monitoring service
        setMetrics({
          rateLimit: {
            totalBlocks: 127,
            globalBlocks: 45,
            authBlocks: 67,
            apiBlocks: 15,
            blockRate: 0.023, // 2.3%
          },
          fraud: {
            totalTransactions: 1543,
            flaggedTransactions: 38,
            blockedTransactions: 5,
            averageRiskScore: 18,
          },
          phishing: {
            urlsScanned: 456,
            suspiciousUrls: 23,
            maliciousUrls: 3,
            blockedClicks: 3,
          },
          auth: {
            successfulLogins: 892,
            failedLogins: 34,
            mfaChallenges: 156,
            failureRate: 0.037, // 3.7%
          },
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                🛡️ Security Dashboard
              </h1>
              <p className="text-zinc-400 mt-1">Loading security metrics…</p>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-5xl">🛡️</span>
              Security Dashboard
              {healthStatus?.security && (
                <Badge variant="success" pulse>
                  All Systems Secure
                </Badge>
              )}
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">
              Real-time security monitoring and threat detection
            </p>
          </div>
          <Link
            href="/founders-pass"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Security Status Overview */}
      {healthStatus?.security && (
        <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
            Security Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusItem
              label="Rate Limiting"
              value={healthStatus.security.rateLimit}
              icon="⚡"
            />
            <StatusItem
              label="Encryption"
              value={healthStatus.security.encryption}
              icon="🔐"
            />
            <StatusItem
              label="MFA"
              value={healthStatus.security.authentication.mfa}
              icon="🔑"
            />
            <StatusItem
              label="GDPR Compliance"
              value={healthStatus.security.compliance.gdpr}
              icon="✓"
            />
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <>
          {/* Rate Limiting Metrics */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ⚡ Rate Limiting
              <span className="text-sm text-zinc-500 font-normal">
                (Last 24 hours)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total Blocks"
                value={metrics.rateLimit.totalBlocks}
                trend={metrics.rateLimit.blockRate < 0.05 ? 'good' : 'warning'}
                sublabel={`${(metrics.rateLimit.blockRate * 100).toFixed(1)}% block rate`}
              />
              <MetricCard
                label="Global Blocks"
                value={metrics.rateLimit.globalBlocks}
                sublabel="100 req/min limit"
              />
              <MetricCard
                label="Auth Blocks"
                value={metrics.rateLimit.authBlocks}
                sublabel="10 req/5min limit"
              />
              <MetricCard
                label="API Blocks"
                value={metrics.rateLimit.apiBlocks}
                sublabel="50 req/min limit"
              />
            </div>
          </section>

          {/* Fraud Detection Metrics */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🎯 Fraud Detection
              <span className="text-sm text-zinc-500 font-normal">
                (Last 24 hours)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Transactions Analyzed"
                value={metrics.fraud.totalTransactions}
                trend="neutral"
              />
              <MetricCard
                label="Flagged for Review"
                value={metrics.fraud.flaggedTransactions}
                trend={
                  metrics.fraud.flaggedTransactions / metrics.fraud.totalTransactions >
                  0.1
                    ? 'warning'
                    : 'good'
                }
                sublabel={`${((metrics.fraud.flaggedTransactions / metrics.fraud.totalTransactions) * 100).toFixed(1)}% flag rate`}
              />
              <MetricCard
                label="Blocked Transactions"
                value={metrics.fraud.blockedTransactions}
                trend="warning"
                sublabel="High risk detected"
              />
              <MetricCard
                label="Avg Risk Score"
                value={metrics.fraud.averageRiskScore}
                trend={metrics.fraud.averageRiskScore < 30 ? 'good' : 'warning'}
                sublabel="Out of 100"
              />
            </div>
          </section>

          {/* Phishing Detection Metrics */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🔗 Phishing Detection
              <span className="text-sm text-zinc-500 font-normal">
                (Last 24 hours)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="URLs Scanned"
                value={metrics.phishing.urlsScanned}
                trend="neutral"
              />
              <MetricCard
                label="Suspicious URLs"
                value={metrics.phishing.suspiciousUrls}
                trend="warning"
                sublabel={`${((metrics.phishing.suspiciousUrls / metrics.phishing.urlsScanned) * 100).toFixed(1)}% threat rate`}
              />
              <MetricCard
                label="Malicious URLs"
                value={metrics.phishing.maliciousUrls}
                trend="critical"
                sublabel="Blocked automatically"
              />
              <MetricCard
                label="Clicks Prevented"
                value={metrics.phishing.blockedClicks}
                trend="good"
                sublabel="User protections"
              />
            </div>
          </section>

          {/* Authentication Metrics */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🔐 Authentication
              <span className="text-sm text-zinc-500 font-normal">
                (Last 24 hours)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Successful Logins"
                value={metrics.auth.successfulLogins}
                trend="good"
              />
              <MetricCard
                label="Failed Attempts"
                value={metrics.auth.failedLogins}
                trend={metrics.auth.failureRate > 0.1 ? 'warning' : 'good'}
                sublabel={`${(metrics.auth.failureRate * 100).toFixed(1)}% failure rate`}
              />
              <MetricCard
                label="MFA Challenges"
                value={metrics.auth.mfaChallenges}
                trend="neutral"
                sublabel="High-risk triggers"
              />
              <MetricCard
                label="Security Level"
                value="High"
                trend="good"
                sublabel="All systems operational"
              />
            </div>
          </section>
        </>
      )}

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/founders-pass/audit">
            <Button variant="primary" icon="📋">
              View Audit Log
            </Button>
          </Link>
          <Link href="/api/founders-pass/health" target="_blank">
            <Button variant="success" icon="✓">
              Health Check API
            </Button>
          </Link>
          <a href="/SECURITY.md" target="_blank">
            <Button variant="warning" icon="📖">
              Security Documentation
            </Button>
          </a>
          <a href="/MONITORING_GUIDE.md" target="_blank">
            <Button variant="secondary" icon="📊">
              Monitoring Guide
            </Button>
          </a>
        </div>
      </section>

      {/* Security Features */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Security Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon="⚡"
            title="Rate Limiting"
            description="5-tier rate limiting prevents abuse and DDoS attacks"
            status="Active"
          />
          <FeatureCard
            icon="🎯"
            title="Fraud Detection"
            description="AI-powered risk scoring with automatic blocking"
            status="Active"
          />
          <FeatureCard
            icon="🔗"
            title="Phishing Protection"
            description="Real-time URL scanning and typosquatting detection"
            status="Active"
          />
          <FeatureCard
            icon="🔐"
            title="Encryption"
            description="AES-256-GCM for sensitive data and OAuth tokens"
            status="Active"
          />
          <FeatureCard
            icon="🛡️"
            title="Security Headers"
            description="CSP, HSTS, XSS protection, and frame options"
            status="Active"
          />
          <FeatureCard
            icon="✓"
            title="GDPR/CCPA Compliance"
            description="Data export, deletion, and consent management"
            status="Compliant"
          />
        </div>
      </section>
    </div>
  );
}

function StatusItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-900/20 hover:bg-emerald-900/30 transition-colors">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-emerald-200 text-sm font-medium">{label}</p>
        <p className="text-emerald-100 text-xs capitalize">{value}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
  sublabel,
}: {
  label: string;
  value: number | string;
  trend?: 'good' | 'warning' | 'critical' | 'neutral';
  sublabel?: string;
}) {
  const trendColors = {
    good: 'border-emerald-800 bg-gradient-to-br from-emerald-950 to-emerald-900/50 hover:shadow-lg hover:shadow-emerald-900/20',
    warning: 'border-amber-800 bg-gradient-to-br from-amber-950 to-amber-900/50 hover:shadow-lg hover:shadow-amber-900/20',
    critical: 'border-red-800 bg-gradient-to-br from-red-950 to-red-900/50 hover:shadow-lg hover:shadow-red-900/20',
    neutral: 'border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-800/50 hover:shadow-lg hover:shadow-zinc-900/20',
  };

  const trendIndicators = {
    good: '✓',
    warning: '⚠',
    critical: '✕',
    neutral: '•',
  };

  const isNumber = typeof value === 'number';

  return (
    <div
      className={`border rounded-xl p-4 transition-all duration-300 hover:scale-105 animate-slide-in-up ${trendColors[trend || 'neutral']}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-zinc-400 text-sm font-medium">{label}</p>
        {trend && trend !== 'neutral' && (
          <span className="text-lg">{trendIndicators[trend]}</span>
        )}
      </div>
      <p className="text-3xl font-bold mb-1">
        {isNumber ? <AnimatedNumber value={value} /> : value}
      </p>
      {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  status,
}: {
  icon: string;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-900/50 transition-all duration-300 hover:scale-105 animate-slide-in-up group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
        <Badge variant="success">{status}</Badge>
      </div>
      <h3 className="font-semibold mb-2 text-lg">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
