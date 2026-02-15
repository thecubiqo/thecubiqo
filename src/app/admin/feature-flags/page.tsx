'use client';

import { useEffect, useState } from 'react';
import type {
  FeatureFlag,
  FeatureFlagAudit,
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
} from '@/types/feature-flags';

interface FeatureFlagsData {
  flags: FeatureFlag[];
  auditLogs: FeatureFlagAudit[] | null;
  count: number;
}

export default function FeatureFlagsAdmin() {
  const [data, setData] = useState<FeatureFlagsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [viewingAudit, setViewingAudit] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      const response = await fetch('/api/admin/feature-flags');
      if (!response.ok) throw new Error('Failed to fetch feature flags');
      const data = await response.json();
      setData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      const response = await fetch(
        `/api/admin/feature-flags?id=${flag.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !flag.enabled }),
        }
      );

      if (!response.ok) throw new Error('Failed to toggle flag');
      await fetchFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDelete = async (flagId: string) => {
    if (!confirm('Are you sure you want to delete this flag?')) return;

    try {
      const response = await fetch(
        `/api/admin/feature-flags?id=${flagId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to delete flag');
      await fetchFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleCreate = async (request: CreateFeatureFlagRequest) => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error('Failed to create flag');
      setShowCreateModal(false);
      await fetchFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleUpdate = async (
    flagId: string,
    request: UpdateFeatureFlagRequest
  ) => {
    try {
      const response = await fetch(
        `/api/admin/feature-flags?id=${flagId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) throw new Error('Failed to update flag');
      setEditingFlag(null);
      await fetchFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading && !data) {
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
            <h1 className="text-4xl font-bold mb-2">Feature Flags</h1>
            <p className="text-gray-400">
              Manage Founders Pass feature flags and rollout rules
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + Create Flag
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Flags"
              value={data.count}
              color="blue"
            />
            <StatCard
              title="Enabled Flags"
              value={data.flags.filter((f) => f.enabled).length}
              color="green"
            />
            <StatCard
              title="Disabled Flags"
              value={data.flags.filter((f) => !f.enabled).length}
              color="gray"
            />
          </div>
        )}

        {/* Flags Table */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Feature Flags</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Scope</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.flags.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No feature flags found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  data?.flags.map((flag) => (
                    <tr
                      key={flag.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold">{flag.name}</p>
                          <p className="text-xs text-gray-500">{flag.id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {flag.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            flag.scope === 'global'
                              ? 'bg-blue-500/20 text-blue-400'
                              : flag.scope === 'site'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {flag.scope}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggle(flag)}
                          className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                            flag.enabled
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingFlag(flag)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setViewingAudit(flag.id)}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            Audit
                          </button>
                          <button
                            onClick={() => handleDelete(flag.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingFlag) && (
          <FlagModal
            flag={editingFlag}
            onClose={() => {
              setShowCreateModal(false);
              setEditingFlag(null);
            }}
            onSave={(request) => {
              if (editingFlag) {
                handleUpdate(editingFlag.id, request);
              } else {
                handleCreate(request as CreateFeatureFlagRequest);
              }
            }}
          />
        )}

        {/* Audit Log Modal */}
        {viewingAudit && (
          <AuditLogModal
            flagId={viewingAudit}
            onClose={() => setViewingAudit(null)}
          />
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'gray';
}

function StatCard({ title, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-500/10',
    green: 'border-green-500 bg-green-500/10',
    gray: 'border-gray-600 bg-gray-600/10',
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-6`}>
      <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

interface FlagModalProps {
  flag: FeatureFlag | null;
  onClose: () => void;
  onSave: (request: CreateFeatureFlagRequest | UpdateFeatureFlagRequest) => void;
}

function FlagModal({ flag, onClose, onSave }: FlagModalProps) {
  const [name, setName] = useState(flag?.name || '');
  const [description, setDescription] = useState(flag?.description || '');
  const [enabled, setEnabled] = useState(flag?.enabled ?? false);
  const [scope, setScope] = useState(flag?.scope || 'global');
  const [targetId, setTargetId] = useState(flag?.target_id || '');
  const [percentage, setPercentage] = useState(
    flag?.config?.percentage?.toString() || '100'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config: any = {};
    
    if (percentage !== '100') {
      config.percentage = parseInt(percentage, 10);
    }

    const request: any = {
      description: description || null,
      enabled,
      scope,
      target_id: targetId || null,
      config,
    };

    if (!flag) {
      request.name = name;
    }

    onSave(request);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {flag ? 'Edit Flag' : 'Create Flag'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!flag}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
              placeholder="founders_pass_v2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Brief description of this flag"
              rows={3}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Enabled</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="global">Global</option>
              <option value="site">Site</option>
              <option value="user">User</option>
            </select>
          </div>

          {(scope === 'site' || scope === 'user') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Target ID ({scope === 'site' ? 'Site ID' : 'User ID'})
              </label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder={scope === 'site' ? 'site-123' : 'user-uuid'}
              />
            </div>
          )}

          {scope === 'global' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Rollout Percentage ({percentage}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {flag ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AuditLogModalProps {
  flagId: string;
  onClose: () => void;
}

function AuditLogModal({ flagId, onClose }: AuditLogModalProps) {
  const [auditLogs, setAuditLogs] = useState<FeatureFlagAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await fetch(
          `/api/admin/feature-flags?audit=true&flagId=${flagId}`
        );
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        const data = await response.json();
        setAuditLogs(data.auditLogs || []);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [flagId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Audit Log</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No audit logs found
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.action === 'created'
                        ? 'bg-green-500/20 text-green-400'
                        : log.action === 'deleted'
                        ? 'bg-red-500/20 text-red-400'
                        : log.action === 'toggled'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Flag: <span className="text-white">{log.flag_name}</span>
                </p>
                {log.changes && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                      View changes
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
