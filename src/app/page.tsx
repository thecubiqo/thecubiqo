'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const ParticleWaveHD = dynamic(() => import('../components/ParticleWaveHD'), { ssr: false });

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="landing-page" onClick={() => router.push('/app')}>
      <div className="landing-visual" aria-hidden="true">
        <ParticleWaveHD isVoiceMode={false} audioLevel={0} />
      </div>
      <div className="landing-lockup">
        <h1 className="landing-title">CubiQo</h1>
        <p className="landing-subtitle">One Mind. Many Dimensions.</p>
      </div>
      <p className="landing-entry">Tap anywhere to begin</p>
    </div>
  );
}
