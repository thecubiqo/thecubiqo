'use client';

import { useEffect, useState } from 'react';

interface SelfHealReport {
  id: string;
  executed_at: string;
  diagnostics: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    details: Record<string, any>;
  }>;
  fixes_applied: Array<{
    name: string;
    applied: boolean;
    description: string;
  }>;
  issues_found: string[];
  status: 'success' | 'partial' | 'failed';
  rollback_patch_path: string | null;
  report_path: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  report_signature: string | null;
  duration_ms: number | null;
  created_at: string;
}

export default function SelfHealPage() {
  const [reports, setReports] = useState<SelfHealReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<SelfHealReport | null>(null);
  const [running, setRunning] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/self-heal/reports');
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

  const runSelfHeal = async () => {
    if (running) return;
    
    setRunning(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/self-heal/run', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run self-heal job');
      }
      
      const data = await response.json();
      alert(`Self-heal job completed!\nStatus: ${data.result.status}\nDuration: ${data.result.duration_ms}ms\nEmail sent: ${data.result.email_sent ? 'Yes' : 'No'}`);
      
      // Refresh reports
      await fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-500 border-green-500';
      case 'partial':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500';
      case 'failed':
        return 'bg-red-500/20 text-red-500 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500';
    }
  };

  const getDiagnosticStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading && reports.length === 0) {
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Self-Heal Reports</h1>
            <p className="text-gray-400">
              Daily diagnostics, auto-fixes, and system maintenance logs
            </p>
          </div>
          <button
            onClick={runSelfHeal}
            disabled={running}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {running ? 'Running...' : 'Run Self-Heal Now'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Reports List */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Reports (Last 30)</h2>
          
          {reports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No reports found. Run the self-heal job to generate your first report.
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeColor(report.status)}`}>
                        {report.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {formatDate(report.executed_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {report.email_sent && (
                        <span className="text-green-500 text-sm">✉️ Email Sent</span>
                      )}
                      <span className="text-gray-500 text-sm">
                        {report.duration_ms ? `${report.duration_ms}ms` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-gray-500 text-sm">Diagnostics</p>
                      <p className="text-xl font-semibold">{report.diagnostics.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Fixes Applied</p>
                      <p className="text-xl font-semibold">
                        {report.fixes_applied.filter(f => f.applied).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Issues Found</p>
                      <p className="text-xl font-semibold">{report.issues_found.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Health</p>
                      <p className="text-xl font-semibold">
                        <span className="text-green-500">
                          {report.diagnostics.filter(d => d.status === 'healthy').length}
                        </span>
                        {' / '}
                        <span className="text-yellow-500">
                          {report.diagnostics.filter(d => d.status === 'warning').length}
                        </span>
                        {' / '}
                        <span className="text-red-500">
                          {report.diagnostics.filter(d => d.status === 'critical').length}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedReport?.id === report.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                      {/* Diagnostics */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Diagnostics</h3>
                        <div className="space-y-2">
                          {report.diagnostics.map((diag, idx) => (
                            <div key={idx} className="bg-gray-900 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">{diag.name}</span>
                                <span className={`text-sm font-semibold ${getDiagnosticStatusColor(diag.status)}`}>
                                  {diag.status.toUpperCase()}
                                </span>
                              </div>
                              <pre className="text-xs text-gray-400 overflow-x-auto">
                                {JSON.stringify(diag.details, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fixes Applied */}
                      {report.fixes_applied.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Fixes Applied</h3>
                          <div className="space-y-2">
                            {report.fixes_applied.map((fix, idx) => (
                              <div key={idx} className="bg-gray-900 rounded p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold">{fix.name}</span>
                                  <span className={fix.applied ? 'text-green-500' : 'text-gray-500'}>
                                    {fix.applied ? '✓ Applied' : '✗ Not Applied'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400">{fix.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Issues Found */}
                      {report.issues_found.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Issues Found</h3>
                          <div className="space-y-2">
                            {report.issues_found.map((issue, idx) => (
                              <div key={idx} className="bg-red-900/20 border border-red-500 rounded p-3">
                                <p className="text-sm text-red-400">{issue}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Artifacts */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Artifacts</h3>
                        <div className="bg-gray-900 rounded p-3 space-y-2">
                          <div>
                            <span className="text-gray-400 text-sm">Report:</span>
                            <p className="text-sm font-mono break-all">{report.report_path || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-sm">Rollback Patch:</span>
                            <p className="text-sm font-mono break-all">{report.rollback_patch_path || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-sm">Signature:</span>
                            <p className="text-sm font-mono break-all text-green-500">{report.report_signature || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
