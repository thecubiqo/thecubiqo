// Founders Pass - Audit Log Viewer
'use client';

import { useEffect, useState } from 'react';
import type { AuditLogEntry } from '@/lib/founders-pass/types';

export default function AuditPage() {
  const [log, setLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/founders-pass/audit?limit=100')
      .then((r) => r.json())
      .then((data) => setLog(data.log ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Loading audit log…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-2">Audit Log</h1>
      <p className="text-zinc-400 text-sm mb-6">
        Track all administrative actions across flags, sites, and integrations.
      </p>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-left">
              <th className="p-3">Timestamp</th>
              <th className="p-3">Action</th>
              <th className="p-3">Resource</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {log.map((entry) => (
              <tr key={entry.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                <td className="p-3 text-zinc-500 text-xs whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td className="p-3 font-mono text-indigo-300 text-xs">
                  {entry.action}
                </td>
                <td className="p-3 text-zinc-400 text-xs">
                  {entry.resource_type}
                  {entry.resource_id && (
                    <span className="text-zinc-600 ml-1">({entry.resource_id.slice(0, 8)}…)</span>
                  )}
                </td>
                <td className="p-3 text-zinc-500 text-xs max-w-xs truncate">
                  {JSON.stringify(entry.details)}
                </td>
              </tr>
            ))}
            {log.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-zinc-500">
                  No audit entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
