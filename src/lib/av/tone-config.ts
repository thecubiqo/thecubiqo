import type { RGYMode, ToneConfig } from '@/next/types/av';

const TONE_BY_MODE: Record<RGYMode, ToneConfig> = {
  green: {
    waveformColor: '#34d399',
    waveformAmplitude: 56,
    idleAmplitude: 7
  },
  yellow: {
    waveformColor: '#fbbf24',
    waveformAmplitude: 46,
    idleAmplitude: 6
  },
  red: {
    waveformColor: '#fb7185',
    waveformAmplitude: 38,
    idleAmplitude: 5
  },
  balanced: {
    waveformColor: '#67e8f9',
    waveformAmplitude: 50,
    idleAmplitude: 6
  }
};

export function getToneForMode(mode: RGYMode): ToneConfig {
  return TONE_BY_MODE[mode] ?? TONE_BY_MODE.balanced;
}
