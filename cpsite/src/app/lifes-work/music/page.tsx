import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';

export const metadata: Metadata = { title: 'Features' };

export default function MusicPage() {
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-3xl mx-auto">
        <H1>Features</H1>
        <P className="mt-4 text-[#5A5752]">Deep-dives into Cubiqo features and the thinking behind them.</P>

        <div className="mt-16 space-y-12">
          {/* Demo embed placeholder */}
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[#A9A9A9] mb-6">Latest demo</h2>
            <div className="bg-[#F0EDE8] border border-[#E2DDD7] rounded-none p-6 text-[14px] text-[#A9A9A9]">
              Demo embed — add iframe or video here.
            </div>
          </section>

          {/* Feature posts */}
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[#A9A9A9] mb-6">Feature posts</h2>
            <p className="text-[#A9A9A9] text-[15px]">Feature posts will appear here.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
