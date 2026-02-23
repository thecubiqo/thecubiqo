import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';

export const metadata: Metadata = { title: 'Music' };

export default function MusicPage() {
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-3xl mx-auto">
        <H1>Music</H1>
        <P className="mt-4 text-[#5A5752]">Piano. Direction. Sound.</P>

        <div className="mt-16 space-y-12">
          {/* Spotify embed placeholder */}
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[#A9A9A9] mb-6">Now Playing</h2>
            <div className="bg-[#F0EDE8] border border-[#E2DDD7] rounded-none p-6 text-[14px] text-[#A9A9A9]">
              Spotify / SoundCloud embed — add iframe here.
            </div>
          </section>

          {/* Piano recordings */}
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[#A9A9A9] mb-6">Recordings</h2>
            <p className="text-[#A9A9A9] text-[15px]">Recordings will appear here.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
