import HeroStage from '@/components/hero/HeroStage';
import Statement from '@/components/sections/Statement';
import ThreeTiles from '@/components/sections/ThreeTiles';
import SocialPulse from '@/components/sections/SocialPulse';
import Footer from '@/components/sections/Footer';

export default function HomePage() {
  return (
    <main>
      <HeroStage />
      <Statement />
      <ThreeTiles />
      <SocialPulse />
      <Footer />
    </main>
  );
}
