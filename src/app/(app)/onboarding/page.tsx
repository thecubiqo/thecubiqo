'use client';

import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/next/components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  const router = useRouter();

  function handleComplete(firstMessage?: string) {
    if (firstMessage?.trim()) {
      // Carry the first message into the chat page via query param.
      // The chat page reads ?q= and pre-populates + auto-fires the input.
      router.push(`/chat?q=${encodeURIComponent(firstMessage.trim())}`);
    } else {
      router.push('/chat');
    }
  }

  return <OnboardingWizard onComplete={handleComplete} />;
}
