import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Life' };

export default function LifePage() {
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-4xl mx-auto">
        <H1>Life</H1>
        <P className="mt-4 max-w-xl text-[#5A5752]">
          Fragments, places, photographs, and the quiet details.
        </P>

        <div className="mt-20 grid gap-16">
          {/* Places */}
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[#A9A9A9] mb-6">Places</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['Zambia', 'New York', 'New Jersey', 'South Africa'].map((place) => (
                <Link
                  key={place}
                  href={`/life/places#${place.toLowerCase().replace(' ', '-')}`}
                  className="group block border border-[#E2DDD7] p-5 hover:border-[#0B0B0D] transition"
                >
                  <span className="text-[17px] font-[440]">{place}</span>
                  <span className="block mt-1 text-[13px] text-[#A9A9A9] group-hover:text-[#0B0B0D] transition">
                    View →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Moments */}
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[#A9A9A9] mb-6">Moments</h2>
            <P className="text-[#5A5752] mb-6">Personal, quiet, domestic, human.</P>
            <Link
              href="/life/moments"
              className="inline-flex items-center gap-2 border border-[#0B0B0D] px-5 py-2 text-[14px] hover:bg-[#0B0B0D] hover:text-[#F6F3EE] transition"
            >
              Open Moments →
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
