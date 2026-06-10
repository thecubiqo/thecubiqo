'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const ParticleWaveHD = dynamic(() => import('../components/ParticleWaveHD'), { ssr: false });

export default function HeroPage() {
  const router = useRouter();

  return (
    <div
      className="relative h-screen w-screen cursor-pointer overflow-hidden bg-[#0a0a0f]"
      onClick={() => router.push('/chat')}
    >
      <div className="absolute inset-0">
        <ParticleWaveHD isVoiceMode={false} audioLevel={0} />
      </div>

      {/* Minimal tap cue — bottom centre */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 select-none">
        <p className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-500 animate-pulse">
          tap anywhere to begin
        </p>
      </div>
    </div>
  );
}
