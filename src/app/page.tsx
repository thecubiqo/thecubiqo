import { FullscreenApp } from '@/components/FullscreenApp';

export const dynamic = 'force-dynamic';

export default function Home() {
  return <FullscreenApp showTopRightCTA={true} showParticleLanding={true} />;
}
