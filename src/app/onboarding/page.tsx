'use client';

import { useRouter } from 'next/navigation';
import OnboardingFlow, { OnboardingConfig } from '@/components/OnboardingFlow';

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = (config: OnboardingConfig) => {
    // Save onboarding config to localStorage
    localStorage.setItem('cubiqo-onboarding', JSON.stringify({
      completed: true,
      timestamp: new Date().toISOString(),
      config,
    }));

    // Redirect to main app
    router.push('/');
  };

  const handleSkip = () => {
    // Mark as skipped but still save a basic config
    localStorage.setItem('cubiqo-onboarding', JSON.stringify({
      completed: true,
      skipped: true,
      timestamp: new Date().toISOString(),
    }));

    router.push('/');
  };

  return <OnboardingFlow onComplete={handleComplete} onSkip={handleSkip} />;
}
