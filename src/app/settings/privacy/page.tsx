// Privacy Settings - User Privacy Controls
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserConsent {
  analytics: boolean;
  marketing: boolean;
  dataProcessing: boolean;
  thirdPartySharing: boolean;
}

export default function PrivacySettings() {
  const [consent, setConsent] = useState<UserConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch user consent settings
    fetch('/api/privacy/consent')
      .then((r) => r.json())
      .then((data) => {
        if (data.consent) {
          setConsent(data.consent);
        } else {
          // Default consent
          setConsent({
            analytics: false,
            marketing: false,
            dataProcessing: true, // Required for service
            thirdPartySharing: false,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleConsentChange = async (key: keyof UserConsent, value: boolean) => {
    if (key === 'dataProcessing' && !value) {
      alert('Data processing is required to use the service');
      return;
    }

    const newConsent = { ...consent!, [key]: value };
    setConsent(newConsent);

    try {
      await fetch('/api/privacy/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConsent),
      });
    } catch (error) {
      console.error('Failed to update consent:', error);
      alert('Failed to update consent preferences');
    }
  };

  const handleExportData = async (format: 'json' | 'csv' | 'xml') => {
    setExporting(true);
    try {
      const response = await fetch(`/api/privacy/export-data?format=${format}`);
      
      if (response.status === 429) {
        alert('Rate limit exceeded. You can export data 5 times per hour.');
        return;
      }

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      alert(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      const response = await fetch('/api/privacy/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true, immediate: false }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        router.push('/');
      } else {
        throw new Error('Deletion failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to schedule account deletion');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading Privacy Settings…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            🔒 Privacy Settings
            <span className="px-3 py-1 bg-emerald-900 text-emerald-300 text-sm font-medium rounded-full">
              GDPR/CCPA Compliant
            </span>
          </h1>
          <p className="text-zinc-400 mt-1">
            Manage your data, privacy preferences, and compliance rights
          </p>
        </header>

        {/* Privacy Rights Banner */}
        <div className="bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3">Your Privacy Rights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Right to Access (GDPR Article 15)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Right to Erasure (GDPR Article 17)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Right to Data Portability (GDPR Article 20)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>CCPA Consumer Rights</span>
            </div>
          </div>
        </div>

        {/* Consent Management */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Consent Management</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Control how we use your data. You can update these preferences at any time.
          </p>

          <div className="space-y-4">
            <ConsentToggle
              label="Analytics"
              description="Help us improve by allowing anonymous usage data collection"
              value={consent?.analytics ?? false}
              onChange={(value) => handleConsentChange('analytics', value)}
            />
            <ConsentToggle
              label="Marketing Communications"
              description="Receive updates about new features and improvements"
              value={consent?.marketing ?? false}
              onChange={(value) => handleConsentChange('marketing', value)}
            />
            <ConsentToggle
              label="Data Processing"
              description="Required for service operation (cannot be disabled)"
              value={consent?.dataProcessing ?? true}
              onChange={(value) => handleConsentChange('dataProcessing', value)}
              disabled
            />
            <ConsentToggle
              label="Third-Party Sharing"
              description="We don't share your data with third parties"
              value={consent?.thirdPartySharing ?? false}
              onChange={(value) => handleConsentChange('thirdPartySharing', value)}
              disabled
            />
          </div>
        </section>

        {/* Data Export */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Export Your Data</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Download a copy of all your data in your preferred format. Limited to 5 exports per hour.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExportData('json')}
              disabled={exporting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? 'Exporting...' : 'Export as JSON'}
            </button>
            <button
              onClick={() => handleExportData('csv')}
              disabled={exporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? 'Exporting...' : 'Export as CSV'}
            </button>
            <button
              onClick={() => handleExportData('xml')}
              disabled={exporting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? 'Exporting...' : 'Export as XML'}
            </button>
          </div>

          <p className="text-xs text-zinc-500 mt-4">
            Your export will include: profile data, journal entries, OAuth connections (not tokens),
            audit log, and analytics events.
          </p>
        </section>

        {/* Account Deletion */}
        <section className="bg-red-950/30 border border-red-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-300">Danger Zone</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Once you delete your account, there is no going back. We offer a 30-day grace period.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                <p className="font-semibold mb-2">⚠️ Are you absolutely sure?</p>
                <p className="text-sm text-zinc-300 mb-3">
                  This will schedule your account for deletion in 30 days. You can cancel during this period.
                </p>
                <p className="text-sm text-zinc-400">
                  All your data will be permanently deleted including:
                </p>
                <ul className="text-sm text-zinc-400 mt-2 ml-4 list-disc space-y-1">
                  <li>Profile information</li>
                  <li>Journal entries</li>
                  <li>OAuth connections</li>
                  <li>Preferences and settings</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Privacy Policy Link */}
        <div className="mt-8 text-center">
          <a
            href="/PRIVACY_POLICY.md"
            target="_blank"
            className="text-indigo-400 hover:underline text-sm"
          >
            View Privacy Policy
          </a>
          {' • '}
          <a
            href="/SECURITY.md"
            target="_blank"
            className="text-indigo-400 hover:underline text-sm"
          >
            View Security Policy
          </a>
        </div>
      </div>
    </div>
  );
}

function ConsentToggle({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
      <div className="flex-1">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          value ? 'bg-emerald-600' : 'bg-zinc-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
            value ? 'translate-x-7' : ''
          }`}
        />
      </button>
    </div>
  );
}
