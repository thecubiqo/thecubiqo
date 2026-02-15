'use client';

import { useState, useEffect } from 'react';

interface JourneyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (optedIn: boolean, retentionDays: number) => Promise<void>;
}

export default function JourneyConsentModal({ 
  isOpen, 
  onClose, 
  onConsent 
}: JourneyConsentModalProps) {
  const [retentionDays, setRetentionDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retentionOptions = [
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
    { value: 180, label: '6 Months' },
    { value: 365, label: '1 Year' },
    { value: -1, label: 'Forever' },
  ];

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConsent(true, retentionDays === -1 ? 0 : retentionDays);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save consent');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConsent(false, 0);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preference');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Journey Memory System
          </h2>
          <p className="text-gray-400">
            Enhance your experience with progressive memory
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 mb-8">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-3">
              What is Journey Memory?
            </h3>
            <p className="text-gray-300 mb-4">
              Journey Memory learns from your conversations to provide more personalized 
              and contextual responses. It stores key information, preferences, and 
              insights to help create a more meaningful experience over time.
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Remember your preferences and context across conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Find similar past conversations using AI-powered search</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Full control over your data with privacy tools and rollback</span>
              </li>
            </ul>
          </div>

          {/* Privacy Controls */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-3">
              Your Privacy, Your Choice
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Data Retention Period
                </label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  disabled={loading}
                >
                  {retentionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-400 mt-2">
                  Your memories will be automatically deleted after this period
                </p>
              </div>

              <div className="text-sm text-gray-400 space-y-2">
                <p>• You can delete all memories at any time</p>
                <p>• You can revoke consent and disable this feature anytime</p>
                <p>• All data is encrypted and only accessible to you</p>
                <p>• We never share your data with third parties</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            No Thanks
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Enable Journey Memory'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          By enabling, you agree to our data retention and privacy policies
        </p>
      </div>
    </div>
  );
}
