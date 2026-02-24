import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import MomentsGrid from '@/components/gallery/MomentsGrid';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';

export const metadata: Metadata = { title: 'Moments' };

const images = [
  { src: '/images/life/moments/moments-1.jpg', alt: 'A quiet personal moment', width: 267, height: 400 },
  { src: '/images/life/moments/moments-2.jpg', alt: 'Domestic stillness', width: 400, height: 267 },
  { src: '/images/life/moments/moments-3.jpg', alt: 'A human fragment', width: 267, height: 400 },
  { src: '/images/life/moments/moments-4.jpg', alt: 'Everyday light', width: 400, height: 267 },
];

export default function MomentsPage() {
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-5xl mx-auto">
        <H1>Moments</H1>
        <P className="mt-4 max-w-lg text-[#5A5752]">
          Personal, quiet, domestic, human. Curated — not catalogued.
        </P>
        <div className="mt-16">
          <MomentsGrid images={images} />
        </div>
      </main>
      <Footer />
    </>
  );
}
