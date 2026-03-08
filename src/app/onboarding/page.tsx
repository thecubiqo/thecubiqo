'use client';

import { useRouter } from 'next/navigation';
import BranchedOnboarding, { OnboardingData } from '@/components/BranchedOnboarding';
import { useAuth } from '@/hooks/useAuth';

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const handleComplete = async (data: OnboardingData) => {
    // Save to Postgres
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: data, skipped: false }),
      });

      if (response.ok) {
        await refreshProfile();
        router.push('/chat');
      }
    } catch (e) {
      console.error('Failed to save onboarding to DB', e);
      // Fallback redirect
      router.push('/chat');
    }
  };

  const handleSkip = async () => {
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true }),
      });
      await refreshProfile();
    } catch (e) {
      console.error('Failed to save onboarding (skip) to DB', e);
    }

    router.push('/chat');
  };

  return <BranchedOnboarding onComplete={handleComplete} onSkip={handleSkip} />;
}
