'use client';

import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/next/components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  const router = useRouter();
  return <OnboardingWizard onComplete={() => router.push('/chat')} />;
}
