import HeroStage    from '@/components/hero/HeroStage';
import WorkSection   from '@/components/sections/WorkSection';
import BlogPreview   from '@/components/sections/BlogPreview';
import MusicSection  from '@/components/sections/MusicSection';
import ContactSection from '@/components/sections/ContactSection';
import Footer        from '@/components/sections/Footer';

export default function HomePage() {
  return (
    <main>
      <HeroStage />
      <WorkSection />
      <BlogPreview />
      <MusicSection />
      <ContactSection />
      <Footer />
    </main>
  );
}

