'use client';

import { useState, useEffect } from 'react';
import { AgentReport } from '@/types/agent';

export default function AgentPortalPage() {
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [selectedAgentId]);

  const loadReports = async () => {
    try {
      const url = selectedAgentId 
        ? `/api/agents/reports?agentId=${selectedAgentId}&limit=50`
        : '/api/agents/reports?limit=50';
      
      const res = await fetch(url);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeColor = (type: AgentReport['reportType']) => {
    switch (type) {
      case 'activity':
        return 'bg-blue-900 text-blue-200';
      case 'task_completion':
        return 'bg-green-900 text-green-200';
      case 'error':
        return 'bg-red-900 text-red-200';
      case 'status':
        return 'bg-purple-900 text-purple-200';
      default:
        return 'bg-gray-900 text-gray-200';
    }
  };

  const uniqueAgents = Array.from(new Set(reports.map(r => r.agentId)));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Agent Portal</h1>
          <p className="text-gray-400">Monitor agent activities and reports</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="px-4 py-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Agents</option>
            {uniqueAgents.map((agentId) => (
              <option key={agentId} value={agentId}>
                {agentId}
              </option>
            ))}
          </select>

          <button
            onClick={loadReports}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition"
          >
            Refresh
          </button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-4 text-gray-400">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No reports available yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Reports will appear here when agents perform activities.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.reportType)}`}>
                        {report.reportType}
                      </span>
                      <h3 className="text-lg font-semibold">{report.agentName}</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Agent ID: {report.agentId}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>

                {report.message && (
                  <p className="text-gray-300 mb-4">{report.message}</p>
                )}

                {report.data && Object.keys(report.data).length > 0 && (
                  <div className="bg-gray-900 rounded p-4 mt-4">
                    <h4 className="text-sm font-semibold mb-2 text-gray-400">Report Data:</h4>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(report.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {reports.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total Reports</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Activity Reports</p>
              <p className="text-2xl font-bold text-blue-400">
                {reports.filter(r => r.reportType === 'activity').length}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Completed Tasks</p>
              <p className="text-2xl font-bold text-green-400">
                {reports.filter(r => r.reportType === 'task_completion').length}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Errors</p>
              <p className="text-2xl font-bold text-red-400">
                {reports.filter(r => r.reportType === 'error').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
