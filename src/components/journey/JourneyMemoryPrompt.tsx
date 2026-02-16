'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import JourneyConsentModal from './JourneyConsentModal';

interface JourneyMemoryPromptProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * JourneyMemoryPrompt
 * 
 * Displays a non-intrusive prompt to users when:
 * 1. Journey Memory feature is enabled by admin
 * 2. User is authenticated
 * 3. User has not opted in yet
 * 4. User has not dismissed the prompt recently
 * 
 * Following market research best practices:
 * - Non-intrusive corner placement
 * - Clear value proposition
 * - Easy to dismiss
 * - Respects user choice
 */
export default function JourneyMemoryPrompt({ 
  position = 'bottom-left' 
}: JourneyMemoryPromptProps) {
  const { user, isAuthenticated } = useAuth();
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [userOptedIn, setUserOptedIn] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check feature status and user consent
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        // Check feature flag and consent status
        const response = await fetch('/api/journey/similarity');
        if (response.ok) {
          const data = await response.json();
          setFeatureEnabled(data.featureEnabled);
          setUserOptedIn(data.userOptedIn);

          // Check if user dismissed the prompt recently
          const dismissedUntil = localStorage.getItem('journey_prompt_dismissed');
          const isDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil);

          // Show prompt if feature enabled, not opted in, and not dismissed
          setShowPrompt(
            data.featureEnabled && 
            !data.userOptedIn && 
            !isDismissed
          );
        }
      } catch (error) {
        console.error('[JourneyPrompt] Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [isAuthenticated, user]);

  const handleDismiss = () => {
    // Dismiss for 24 hours
    const dismissUntil = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('journey_prompt_dismissed', dismissUntil.toString());
    setShowPrompt(false);
  };

  const handleLearnMore = () => {
    setShowConsentModal(true);
  };

  const handleConsent = async (optedIn: boolean, retentionDays: number) => {
    try {
      const response = await fetch('/api/journey/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optedIn, retentionDays }),
      });

      if (response.ok) {
        setUserOptedIn(optedIn);
        setShowPrompt(false);
        setShowConsentModal(false);
      }
    } catch (error) {
      console.error('[JourneyPrompt] Error saving consent:', error);
    }
  };

  // Don't render anything if not showing
  if (loading || !showPrompt || !featureEnabled) {
    return null;
  }

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-20 left-4', // Above powered-by logos
  };

  return (
    <>
      {/* Floating Prompt Button */}
      <div
        className={`fixed ${positionClasses[position]} z-40 animate-fade-in`}
      >
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl border border-white/20 overflow-hidden max-w-sm">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
            aria-label="Dismiss"
          >
            <span className="text-white text-xs">×</span>
          </button>

          <div className="p-4">
            {/* Icon */}
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>

            {/* Content */}
            <h3 className="text-white font-bold text-lg mb-1">
              New: Journey Memory
            </h3>
            <p className="text-white/90 text-sm mb-4">
              Help CubiQo remember your preferences and context for more personalized conversations.
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleLearnMore}
                className="flex-1 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
              >
                Learn More
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
              >
                Later
              </button>
            </div>
          </div>

          {/* Animated Border Glow */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-30 blur-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Consent Modal */}
      <JourneyConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleConsent}
      />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
}
