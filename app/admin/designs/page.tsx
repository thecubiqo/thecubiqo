'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { invalidateDesignTogglesCache } from '@/hooks/useDesignToggles';

interface DesignToggle {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: 'design' | 'feature' | 'experiment';
  is_enabled: boolean;
  config: Record<string, any>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface GroupedToggles {
  design: DesignToggle[];
  feature: DesignToggle[];
  experiment: DesignToggle[];
}

export default function DesignsAdminPage() {
  const [grouped, setGrouped] = useState<GroupedToggles>({
    design: [],
    feature: [],
    experiment: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchToggles = async () => {
    try {
      const response = await fetch('/api/admin/designs');
      if (!response.ok) throw new Error('Failed to fetch toggles');
      const data = await response.json();
      setGrouped(data.grouped || { design: [], feature: [], experiment: [] });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToggles();
  }, []);

  const handleToggle = async (toggleId: string, currentState: boolean) => {
    setUpdatingId(toggleId);
    try {
      const response = await fetch(`/api/admin/designs?id=${toggleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !currentState }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update toggle');
      }

      // Invalidate cache and refresh
      invalidateDesignTogglesCache();
      await fetchToggles();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update toggle');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Design & Feature Toggles</h1>
              <p className="text-gray-400">
                Enable or disable designs, features, and experiments
              </p>
            </div>
            <Link
              href="/admin"
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Design Toggles */}
        <Section
          title="🎨 Design Toggles"
          description="Visual design and UI variants"
          toggles={grouped.design}
          onToggle={handleToggle}
          updatingId={updatingId}
          formatDate={formatDate}
        />

        {/* Feature Toggles */}
        <Section
          title="⚡ Feature Toggles"
          description="Functional features and capabilities"
          toggles={grouped.feature}
          onToggle={handleToggle}
          updatingId={updatingId}
          formatDate={formatDate}
        />

        {/* Experiment Toggles */}
        <Section
          title="🧪 Experiments"
          description="A/B tests and experimental features"
          toggles={grouped.experiment}
          onToggle={handleToggle}
          updatingId={updatingId}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  description: string;
  toggles: DesignToggle[];
  onToggle: (id: string, currentState: boolean) => void;
  updatingId: string | null;
  formatDate: (date: string) => string;
}

function Section({
  title,
  description,
  toggles,
  onToggle,
  updatingId,
  formatDate,
}: SectionProps) {
  if (toggles.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {toggles.map((toggle) => (
          <ToggleCard
            key={toggle.id}
            toggle={toggle}
            onToggle={onToggle}
            isUpdating={updatingId === toggle.id}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
}

interface ToggleCardProps {
  toggle: DesignToggle;
  onToggle: (id: string, currentState: boolean) => void;
  isUpdating: boolean;
  formatDate: (date: string) => string;
}

function ToggleCard({ toggle, onToggle, isUpdating, formatDate }: ToggleCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border-2 border-gray-800 hover:border-gray-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{toggle.display_name}</h3>
          {toggle.description && (
            <p className="text-sm text-gray-400 mb-2">{toggle.description}</p>
          )}
          <p className="text-xs text-gray-500">ID: {toggle.name}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => onToggle(toggle.id, toggle.is_enabled)}
          disabled={isUpdating}
          className={`
            relative inline-flex h-8 w-14 items-center rounded-full transition-colors
            ${toggle.is_enabled ? 'bg-green-600' : 'bg-gray-700'}
            ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-6 w-6 transform rounded-full bg-white transition-transform
              ${toggle.is_enabled ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
        <span
          className={`text-sm font-semibold ${
            toggle.is_enabled ? 'text-green-400' : 'text-gray-500'
          }`}
        >
          {toggle.is_enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          Last updated: {formatDate(toggle.updated_at)}
        </p>
      </div>
    </div>
  );
}
