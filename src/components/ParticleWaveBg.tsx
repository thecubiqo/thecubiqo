'use client';

import dynamic from 'next/dynamic';

const ParticleWaveHD = dynamic(() => import('../../original_particle_wave'), { ssr: false });

export default function ParticleWaveBg() {
  return <ParticleWaveHD isVoiceMode={false} audioLevel={0} />;
}
