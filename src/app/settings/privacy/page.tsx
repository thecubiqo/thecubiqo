// Privacy Settings - User Privacy Controls
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ToastContainer, ToastMessage } from '@/components/ui/Toast';

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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const router = useRouter();

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
      addToast('warning', 'Cannot Disable', 'Data processing is required to use the service');
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
      addToast('success', 'Preferences Updated', 'Your consent preferences have been saved');
    } catch (error) {
      console.error('Failed to update consent:', error);
      addToast('error', 'Update Failed', 'Failed to update consent preferences');
      // Revert on error
      setConsent(consent);
    }
  };

  const handleExportData = async (format: 'json' | 'csv' | 'xml') => {
    setExporting(true);
    try {
      const response = await fetch(`/api/privacy/export-data?format=${format}`);

      if (response.status === 429) {
        addToast('warning', 'Rate Limit Exceeded', 'You can export data 5 times per hour');
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

      addToast('success', 'Export Complete', `Data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      addToast('error', 'Export Failed', 'Failed to export data. Please try again.');
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
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        addToast('success', 'Account Deleted', data.message || 'Your account and all data have been completely purged.');
        setTimeout(() => router.push('/'), 2000);
      } else {
        throw new Error('Deletion failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      addToast('error', 'Deletion Failed', 'Failed to completely delete account.');
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
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="min-h-screen bg-black text-white p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3 flex-wrap">
              <span className="text-5xl">🔒</span>
              Privacy Settings
              <Badge variant="default">
                ✓ GDPR/CCPA Compliant
              </Badge>
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">
              Manage your data, privacy preferences, and compliance rights
            </p>
          </header>

          {/* Privacy Rights Banner */}
          <div className="bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-800 rounded-xl p-6 mb-8 hover:shadow-xl hover:shadow-indigo-900/20 transition-all animate-slide-in-up">
            <h2 className="text-2xl font-semibold mb-4">Your Privacy Rights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors">
                <span className="text-green-400 text-xl">✓</span>
                <span className="font-medium">Right to Access (GDPR Article 15)</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors">
                <span className="text-green-400 text-xl">✓</span>
                <span className="font-medium">Right to Erasure (GDPR Article 17)</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors">
                <span className="text-green-400 text-xl">✓</span>
                <span className="font-medium">Right to Data Portability (GDPR Article 20)</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors">
                <span className="text-green-400 text-xl">✓</span>
                <span className="font-medium">CCPA Consumer Rights</span>
              </div>
            </div>
          </div>

          {/* Consent Management */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 hover:shadow-xl hover:shadow-zinc-900/50 transition-all animate-slide-in-up">
            <h2 className="text-2xl font-semibold mb-4">Consent Management</h2>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
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
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 hover:shadow-xl hover:shadow-zinc-900/50 transition-all animate-slide-in-up">
            <h2 className="text-2xl font-semibold mb-4">Export Your Data</h2>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Download a copy of all your data in your preferred format. Limited to 5 exports per hour.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="default"
                onClick={() => handleExportData('json')}
                disabled={exporting}
              >
                {exporting ? '📄 Exporting...' : '📄 Export as JSON'}
              </Button>
              <Button
                variant="default"
                onClick={() => handleExportData('csv')}
                disabled={exporting}
              >
                {exporting ? '📊 Exporting...' : '📊 Export as CSV'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExportData('xml')}
                disabled={exporting}
              >
                {exporting ? '📋 Exporting...' : '📋 Export as XML'}
              </Button>
            </div>

            <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
              Your export will include: profile data, journal entries, OAuth connections (not tokens),
              audit log, and analytics events.
            </p>
          </section>

          {/* Account Deletion */}
          <section className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800 rounded-xl p-6 animate-slide-in-up">
            <h2 className="text-2xl font-semibold mb-4 text-red-300 flex items-center gap-2">
              <span className="text-3xl">⚠️</span>
              Danger Zone
            </h2>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Once you delete your account, there is no going back. We offer a 30-day grace period.
            </p>

            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
              >
                🗑️ Delete My Account
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
                  <p className="font-semibold mb-2 text-lg">⚠️ Are you absolutely sure?</p>
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
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                  >
                    ✓ Yes, Delete My Account
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    ✕ Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Privacy Policy Link */}
          <div className="mt-8 text-center">
            <a
              href="/PRIVACY_POLICY.md"
              target="_blank"
              className="text-indigo-400 hover:text-indigo-300 hover:underline text-sm font-medium transition-colors"
            >
              View Privacy Policy
            </a>
            {' • '}
            <a
              href="/SECURITY.md"
              target="_blank"
              className="text-indigo-400 hover:text-indigo-300 hover:underline text-sm font-medium transition-colors"
            >
              View Security Policy
            </a>
          </div>
        </div>
      </div>
    </>
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
    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-all">
      <div className="flex-1">
        <p className="font-semibold mb-1 text-lg">{label}</p>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`relative w-16 h-8 rounded-full transition-all duration-300 ${value ? 'bg-emerald-600 shadow-lg shadow-emerald-900/50' : 'bg-zinc-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${value ? 'translate-x-8' : ''
            }`}
        />
      </button>
    </div>
  );
}
