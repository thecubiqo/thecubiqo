'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SelfHealReport {
  id: string;
  run_date: string;
  status: 'success' | 'partial' | 'failed';
  diagnostics: any[];
  repairs: any[];
  rollback_patch: string;
  fixed_issues: string[];
  critical_issues: string[];
  recommendations: string[];
  email_sent: boolean;
  email_sent_at: string | null;
  email_to: string;
  execution_time_ms: number;
  created_at: string;
}

export default function SelfHealReportsPage() {
  const [reports, setReports] = useState<SelfHealReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<SelfHealReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/api/admin/self-heal'
        : `/api/admin/self-heal?status=${statusFilter}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const data = await response.json();
      setReports(data.reports || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'partial':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'partial':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">🔧 Self-Heal Reports</h1>
              <p className="text-gray-400">
                Daily automated system diagnostics and repair reports
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Filter */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setStatusFilter('success')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setStatusFilter('partial')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'partial'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Partial
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'failed'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {loading && reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-2xl">Loading reports...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">No Reports Yet</h2>
            <p className="text-gray-400 mb-6">
              Self-heal reports will appear here once the daily job runs.
            </p>
            <p className="text-sm text-gray-500">
              The job is scheduled to run daily at 10:00 local time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800/80 transition cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded border text-sm font-semibold ${getStatusBadgeClass(report.status)}`}>
                        {report.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {formatDate(report.run_date)}
                      </span>
                      {report.email_sent && (
                        <span className="text-green-400 text-sm">
                          ✓ Email Sent
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-gray-500 text-sm">Fixed Issues</p>
                        <p className="text-xl font-bold text-green-400">
                          {report.fixed_issues.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Critical Issues</p>
                        <p className="text-xl font-bold text-red-400">
                          {report.critical_issues.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Recommendations</p>
                        <p className="text-xl font-bold text-yellow-400">
                          {report.recommendations.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Execution Time</p>
                        <p className="text-xl font-bold text-blue-400">
                          {report.execution_time_ms}ms
                        </p>
                      </div>
                    </div>
                  </div>

                  <button className="text-gray-400 hover:text-white transition ml-4">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-8 z-50"
            onClick={() => setSelectedReport(null)}
          >
            <div
              className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Report Details</h2>
                  <p className="text-gray-400">{formatDate(selectedReport.run_date)}</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className={`mb-6 px-4 py-2 rounded border text-sm font-semibold inline-block ${getStatusBadgeClass(selectedReport.status)}`}>
                {selectedReport.status.toUpperCase()}
              </div>

              {/* Fixed Issues */}
              {selectedReport.fixed_issues.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-green-400 mb-3">✅ Fixed Issues</h3>
                  <ul className="space-y-2">
                    {selectedReport.fixed_issues.map((issue, idx) => (
                      <li key={idx} className="bg-green-900/20 border border-green-500/30 rounded p-3 text-sm">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critical Issues */}
              {selectedReport.critical_issues.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-red-400 mb-3">🚨 Critical Issues</h3>
                  <ul className="space-y-2">
                    {selectedReport.critical_issues.map((issue, idx) => (
                      <li key={idx} className="bg-red-900/20 border border-red-500/30 rounded p-3 text-sm">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {selectedReport.recommendations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-yellow-400 mb-3">💡 Recommendations</h3>
                  <ul className="space-y-2">
                    {selectedReport.recommendations.map((rec, idx) => (
                      <li key={idx} className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 text-sm">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Diagnostics */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">🔍 Diagnostics</h3>
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4">Check</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.diagnostics.map((diag: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-700">
                          <td className="py-3 px-4">{diag.name}</td>
                          <td className={`py-3 px-4 font-semibold ${getStatusColor(diag.status)}`}>
                            {diag.status.toUpperCase()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">{diag.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Repairs */}
              {selectedReport.repairs.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-3">🔧 Repairs</h3>
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4">Action</th>
                          <th className="text-left py-3 px-4">Type</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.repairs.map((repair: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-700">
                            <td className="py-3 px-4 text-sm">{repair.description}</td>
                            <td className="py-3 px-4 text-sm text-gray-400">{repair.type}</td>
                            <td className={`py-3 px-4 font-semibold text-sm ${
                              repair.status === 'success' ? 'text-green-400' :
                              repair.status === 'failed' ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {repair.status.toUpperCase()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rollback Patch */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">📝 Rollback Patch</h3>
                <pre className="bg-gray-800 rounded-lg p-4 text-sm overflow-x-auto text-gray-300">
                  {selectedReport.rollback_patch}
                </pre>
              </div>

              {/* Email Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2">📧 Email Report</h3>
                <div className="text-sm text-gray-400">
                  <p>To: {selectedReport.email_to}</p>
                  <p>
                    Status: {selectedReport.email_sent ? (
                      <span className="text-green-400">
                        ✓ Sent at {formatDate(selectedReport.email_sent_at || '')}
                      </span>
                    ) : (
                      <span className="text-yellow-400">⚠ Not sent</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
