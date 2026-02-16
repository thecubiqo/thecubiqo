'use client';

import { useEffect, useState } from 'react';
import JourneyConsentModal from '@/components/journey/JourneyConsentModal';
import JourneyPrivacyControls from '@/components/journey/JourneyPrivacyControls';

interface ConsentStatus {
  consent: any;
  hasConsent: boolean;
  optedIn: boolean;
}

interface Memory {
  id: string;
  content: string;
  summary: string | null;
  category: string | null;
  importance_score: number;
  created_at: string;
}

export default function JourneySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchConsentStatus();
  }, []);

  const fetchConsentStatus = async () => {
    try {
      const response = await fetch('/api/journey/consent');
      if (response.ok) {
        const data = await response.json();
        setConsentStatus(data);
        
        // If opted in, fetch memories
        if (data.optedIn) {
          fetchMemories();
        }
      }
    } catch (error) {
      console.error('Failed to fetch consent status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemories = async () => {
    try {
      const response = await fetch('/api/journey/memories');
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);
        setUserId(data.userId);
      }
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    }
  };

  const handleConsent = async (optedIn: boolean, retentionDays: number) => {
    const response = await fetch('/api/journey/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optedIn, retentionDays }),
    });

    if (!response.ok) {
      throw new Error('Failed to save consent');
    }

    await fetchConsentStatus();
  };

  const handleMemoryDeleted = (memoryId: string) => {
    setMemories(memories.filter((m) => m.id !== memoryId));
  };

  const handleAllDeleted = () => {
    setMemories([]);
    fetchConsentStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Journey Memory Settings</h1>
          <p className="text-gray-400">
            Manage your memory preferences and privacy controls
          </p>
        </div>

        {/* Feature Status */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">
                Journey Memory Status
              </h2>
              <p className="text-gray-400">
                {consentStatus?.optedIn
                  ? 'Active - Your memories are being stored'
                  : 'Inactive - Enable to start storing memories'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`px-4 py-2 rounded-full font-semibold ${
                  consentStatus?.optedIn
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {consentStatus?.optedIn ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => setShowConsentModal(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
              >
                {consentStatus?.optedIn ? 'Change Settings' : 'Enable Journey'}
              </button>
            </div>
          </div>

          {consentStatus?.consent && consentStatus.optedIn && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Retention Period:</span>
                  <span className="ml-2 text-white font-semibold">
                    {consentStatus.consent.retention_days === null
                      ? 'Forever'
                      : `${consentStatus.consent.retention_days} days`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Consented At:</span>
                  <span className="ml-2 text-white font-semibold">
                    {new Date(
                      consentStatus.consent.consented_at
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Controls - Only show if opted in */}
        {consentStatus?.optedIn && userId && (
          <JourneyPrivacyControls
            userId={userId}
            memories={memories}
            onMemoryDeleted={handleMemoryDeleted}
            onAllDeleted={handleAllDeleted}
          />
        )}

        {/* Information Card */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mt-8">
          <h3 className="text-xl font-semibold text-white mb-3">
            About Journey Memory
          </h3>
          <div className="space-y-3 text-gray-300">
            <p>
              Journey Memory is a progressive memory system that learns from your
              conversations to provide more personalized and contextual responses.
            </p>
            <p>
              Your data is encrypted, stored securely, and never shared with third
              parties. You have full control over your memories and can delete them
              at any time.
            </p>
            <p className="text-sm text-gray-400">
              This feature is currently behind a feature flag and may not be
              available to all users.
            </p>
          </div>
        </div>
      </div>

      {/* Consent Modal */}
      <JourneyConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleConsent}
      />
    </div>
  );
}
