'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Feature {
  id: string;
  feature_name: string;
  is_released: boolean;
  description: string | null;
  released_at: string | null;
  released_by: string | null;
  canRelease: boolean;
  metadata?: {
    name: string;
    description: string;
    category: 'Core' | 'Admin';
    releasable: boolean;
  };
}

interface FeaturesResponse {
  features: Feature[];
  timestamp: string;
}

export default function FeatureGatePage() {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/admin/features');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to fetch features');
      }
      const data: FeaturesResponse = await response.json();
      setFeatures(data.features);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFeature = async (featureName: string, currentStatus: boolean) => {
    setUpdating(featureName);
    try {
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName,
          isReleased: !currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update feature');
      }

      // Refresh features list
      await fetchFeatures();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  // Separate features by category
  const coreFeatures = features.filter((f) => f.metadata?.category === 'Core');
  const adminFeatures = features.filter((f) => f.metadata?.category === 'Admin');

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold">Feature Gate Control</h1>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              ← Back to Admin
            </button>
          </div>
          <p className="text-gray-400">
            Control which features are released to the public. Founders always have full
            access.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Core Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="text-green-400 mr-2">●</span>
            Core Features (Can be Released)
          </h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold">Feature</th>
                  <th className="text-left py-4 px-6 font-semibold">Description</th>
                  <th className="text-center py-4 px-6 font-semibold">Status</th>
                  <th className="text-center py-4 px-6 font-semibold">Released</th>
                  <th className="text-center py-4 px-6 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {coreFeatures.map((feature) => (
                  <tr
                    key={feature.id}
                    className="border-t border-gray-800 hover:bg-gray-800/50"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold">{feature.metadata?.name || feature.feature_name}</div>
                      <div className="text-sm text-gray-500">{feature.feature_name}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {feature.metadata?.description || feature.description}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {feature.is_released ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                          ✓ Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 text-gray-400 text-sm font-semibold">
                          ✕ Private
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">
                      {formatDate(feature.released_at)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleFeature(feature.feature_name, feature.is_released)}
                        disabled={updating === feature.feature_name}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          feature.is_released
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updating === feature.feature_name
                          ? 'Updating...'
                          : feature.is_released
                          ? 'Make Private'
                          : 'Release Public'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Features */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="text-red-400 mr-2">●</span>
            Admin Features (Permanently Founder-Only)
          </h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold">Feature</th>
                  <th className="text-left py-4 px-6 font-semibold">Description</th>
                  <th className="text-center py-4 px-6 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {adminFeatures.map((feature) => (
                  <tr
                    key={feature.id}
                    className="border-t border-gray-800"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold">{feature.metadata?.name || feature.feature_name}</div>
                      <div className="text-sm text-gray-500">{feature.feature_name}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {feature.metadata?.description || feature.description}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold">
                        🔒 Founder Only
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-500 italic">
            These features can never be released to regular users for security and operational reasons.
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-400">ℹ️ How Feature Gates Work</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• <strong>Founders</strong> always have access to all features, regardless of release status</li>
            <li>• <strong>Released features</strong> become visible and usable by all authenticated users</li>
            <li>• <strong>Admin features</strong> (Admin Panel, Deploy, Feature Gate) stay founder-only permanently</li>
            <li>• Changes take effect immediately for all users</li>
            <li>• You can toggle features on/off as needed for gradual rollouts or testing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
