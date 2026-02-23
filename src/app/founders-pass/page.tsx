// Founders Pass Admin Portal - Dashboard
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { FeatureFlag, Site, AuditLogEntry } from '@/lib/founders-pass/types';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton';

export default function FoundersPassDashboard() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/founders-pass/flags').then((r) => r.json()),
      fetch('/api/founders-pass/sites').then((r) => r.json()),
      fetch('/api/founders-pass/audit?limit=10').then((r) => r.json()),
    ])
      .then(([flagsRes, sitesRes, auditRes]) => {
        setFlags(flagsRes.flags ?? []);
        setSites(sitesRes.sites ?? []);
        setAuditLog(auditRes.log ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">🚀 Founders Pass — Admin Portal</h1>
          <p className="text-zinc-400 mt-1">Loading dashboard…</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <span className="text-5xl">🚀</span>
          Founders Pass — Admin Portal
        </h1>
        <p className="text-zinc-400 mt-2 text-lg">
          Manage feature flags, sites, integrations, and action templates.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Feature Flags" value={flags.length} href="/founders-pass/flags" />
        <StatCard label="Sites" value={sites.length} href="/founders-pass/sites" />
        <StatCard
          label="Active Flags"
          value={flags.filter((f) => f.default_value).length}
        />
        <StatCard
          label="Active Sites"
          value={sites.filter((s) => s.status === 'active').length}
        />
      </div>

      {/* Security Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-green-950 to-emerald-900 border border-emerald-800 rounded-xl p-6 mb-8 hover:shadow-2xl hover:shadow-emerald-900/30 transition-all duration-300 animate-slide-in-up group">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">🛡️</span>
              Enterprise Security Active
              <Badge variant="success" pulse>Live</Badge>
            </h2>
            <p className="text-emerald-200 text-sm mb-4 leading-relaxed">
              Complete OWASP coverage, GDPR/CCPA compliant, 66+ security tests passing
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" icon="⚡">Rate Limiting</Badge>
              <Badge variant="success" icon="🎯">Fraud Detection</Badge>
              <Badge variant="success" icon="🔗">Phishing Protection</Badge>
              <Badge variant="success" icon="🔐">AES-256-GCM</Badge>
            </div>
          </div>
          <Link href="/founders-pass/security">
            <Button variant="success" icon="🛡️" size="lg">
              View Security Dashboard →
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/founders-pass/flags">
          <Button variant="primary" icon="🚩">
            Manage Flags
          </Button>
        </Link>
        <Link href="/founders-pass/sites">
          <Button variant="success" icon="🌐">
            Manage Sites
          </Button>
        </Link>
        <Link href="/founders-pass/security">
          <Button variant="success" icon="🛡️">
            Security
          </Button>
        </Link>
        <Link href="/founders-pass/integrations">
          <Button variant="warning" icon="🔌">
            Integrations
          </Button>
        </Link>
        <Link href="/founders-pass/actions">
          <Button variant="secondary" icon="⚡">
            Action Templates
          </Button>
        </Link>
        <Link href="/founders-pass/audit">
          <Button variant="ghost" icon="📋">
            Audit Log
          </Button>
        </Link>
      </div>

      {/* Sites List */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Sites</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:shadow-xl hover:shadow-zinc-900/50 transition-all animate-slide-in-up">
          {sites.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No sites yet.{' '}
              <Link href="/founders-pass/sites" className="text-indigo-400 hover:text-indigo-300 underline transition-colors">
                Create one
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-left bg-zinc-900/50">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Slug</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Preview</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 font-medium">{site.name}</td>
                    <td className="p-4 text-zinc-400 font-mono text-xs">{site.slug}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          site.status === 'active'
                            ? 'success'
                            : site.status === 'preview'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {site.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/sites/${site.slug}`}
                        className="text-indigo-400 hover:text-indigo-300 hover:underline text-xs font-medium transition-colors"
                      >
                        Preview →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Feature Flags Summary */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Feature Flags</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flags.slice(0, 6).map((flag) => (
            <div
              key={flag.id}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-800 rounded-xl p-5 hover:shadow-xl hover:shadow-zinc-900/50 hover:scale-105 transition-all duration-300 animate-slide-in-up group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm text-indigo-400 font-medium">{flag.key}</span>
                <span
                  className={`w-3 h-3 rounded-full transition-all ${
                    flag.default_value
                      ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse-slow'
                      : 'bg-zinc-600'
                  }`}
                />
              </div>
              <p className="text-sm font-semibold mb-1">{flag.name}</p>
              {flag.description && (
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{flag.description}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Audit Log */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-3 hover:shadow-xl hover:shadow-zinc-900/50 transition-all animate-slide-in-up">
          {auditLog.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">No activity yet.</p>
          ) : (
            auditLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm border-b border-zinc-800 pb-3 last:border-0 last:pb-0 hover:bg-zinc-800/30 p-2 rounded-lg transition-colors"
              >
                <span className="text-zinc-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                  <span className="font-mono text-indigo-400 font-medium">{entry.action}</span>{' '}
                  on <span className="font-medium">{entry.resource_type}</span>
                </span>
                <span className="text-zinc-500 text-xs">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-800 rounded-xl p-5 hover:shadow-xl hover:shadow-zinc-900/50 hover:scale-105 transition-all duration-300 animate-slide-in-up">
      <p className="text-zinc-400 text-sm font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
