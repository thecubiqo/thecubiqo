'use client';

import { useRouter } from 'next/navigation';
import OnboardingFlow, { OnboardingConfig } from '@/components/OnboardingFlow';

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = async (config: OnboardingConfig) => {
    // Save onboarding config to localStorage as local fast-cache
    localStorage.setItem('cubiqo-onboarding', JSON.stringify({
      completed: true,
      timestamp: new Date().toISOString(),
      config,
    }));

    // Save to Postgres
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config, skipped: false }),
      });
    } catch (e) {
      console.error('Failed to save onboarding to DB', e);
    }

    // Redirect to main app
    router.push('/');
  };

  const handleSkip = async () => {
    // Mark as skipped but still save a basic config
    localStorage.setItem('cubiqo-onboarding', JSON.stringify({
      completed: true,
      skipped: true,
      timestamp: new Date().toISOString(),
    }));

    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true }),
      });
    } catch (e) {
      console.error('Failed to save onboarding (skip) to DB', e);
    }

    router.push('/');
  };

  return <OnboardingFlow onComplete={handleComplete} onSkip={handleSkip} />;
}
