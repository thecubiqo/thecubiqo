"use client";

import { useState } from "react";

type VoiceUnlockGateProps = {
  greetingText: string;
  audioUrl: string | null;
  onVoiceEnabled?: () => void;
};

export function VoiceUnlockGate({ greetingText, audioUrl, onVoiceEnabled }: VoiceUnlockGateProps) {
  const [unlocked, setUnlocked] = useState(false);

  async function unlock() {
    setUnlocked(true);
    onVoiceEnabled?.();
    if (!audioUrl) return;
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch {
      // Browser kept audio locked. The visible text greeting is still present.
    }
  }

  return (
    <div>
      <p>{greetingText}</p>
      {!unlocked && (
        <button type="button" onClick={unlock} aria-label="Start CubiQo voice">
          Tap to start CubiQo
        </button>
      )}
    </div>
  );
}
