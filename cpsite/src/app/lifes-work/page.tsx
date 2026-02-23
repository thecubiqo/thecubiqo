import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';
import Link from 'next/link';

export const metadata: Metadata = { title: "Life's Work" };

const pillars = [
  {
    href: '/lifes-work/writing',
    label: 'Writing',
    desc: 'Essays, reflections, and dispatches from the field and the city.',
  },
  {
    href: '/lifes-work/music',
    label: 'Music',
    desc: 'Piano recordings, playlists, and notes on sound.',
  },
  {
    href: '/lifes-work/field-notes',
    label: 'Field Notes',
    desc: 'Image-led posts. Handwritten at times. Always kept.',
  },
];

export default function LifesWorkPage() {
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-4xl mx-auto">
        <H1>Life's Work</H1>
        <P className="mt-4 max-w-xl text-[#5A5752]">
          Writing, music, and field notes — posted simply, kept intact.
        </P>
        <div className="mt-20 grid md:grid-cols-3 gap-px bg-[#E2DDD7]">
          {pillars.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group bg-[#F6F3EE] p-8 hover:bg-[#0B0B0D] hover:text-[#F6F3EE] transition-colors"
            >
              <h2 className="text-[20px] font-[520] mb-3">{p.label}</h2>
              <p className="text-[14px] text-[#5A5752] group-hover:text-[#B9B2A6] leading-[1.6]">{p.desc}</p>
              <span className="block mt-6 text-[13px] group-hover:text-[#F6F3EE]">Explore →</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
