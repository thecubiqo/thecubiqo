'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const reveal = (delay = 0) => ({
  initial:     { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-60px' },
  transition:  { duration: 1.0, ease: EASE, delay },
});

const tracks = [
  { title: 'Chopin — Nocturne Op. 9 No. 2',  type: 'Piano',           dur: '4:33' },
  { title: 'Evangeline',                       type: 'Original',        dur: '3:12' },
  { title: 'Field Songs — Zambia Sketches',    type: 'Field recording', dur: '6:48' },
];

function MinimalPlayer({ title, type, dur }: { title: string; type: string; dur: string }) {
  return (
    <div className="group flex items-center gap-6 py-6 border-b border-white/[0.08]">
      <button
        aria-label={`Play ${title}`}
        className="w-9 h-9 shrink-0 border border-white/[0.08] flex items-center justify-center hover:border-white/20 hover:bg-white/[0.04] transition"
      >
        <svg width="9" height="11" viewBox="0 0 9 11" fill="none" aria-hidden="true">
          <path d="M1 1L8 5.5L1 10V1Z" stroke="rgba(242,239,232,0.45)" strokeWidth="1" fill="none" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-[#F2EFE8] leading-none mb-2.5 group-hover:text-white transition">
          {title}
        </p>
        <div className="h-px w-full bg-white/[0.08] relative overflow-hidden">
          <div className="h-px bg-white/25 w-0 group-hover:w-1/3 transition-all duration-700" />
        </div>
        <p className="mt-1.5 text-[11px] text-white/25">{type}</p>
      </div>
      <span className="text-[11px] font-mono text-white/30 shrink-0">{dur}</span>
    </div>
  );
}

export default function MusicSection() {
  return (
    <section className="bg-black px-6 md:px-16 py-[140px] border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto">

        <motion.div {...reveal()}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-5">Music</p>
          <h2
            className="text-[40px] md:text-[58px] font-[400] tracking-[-0.03em] leading-[1.06] text-[#F2EFE8]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sound as memory.
          </h2>
          <p className="mt-6 text-[15px] text-white/55 max-w-lg leading-[1.8]">
            Piano. Direction. Composition. Music as a second language — or the
            first, before words organized themselves into sense.
          </p>
        </motion.div>

        <motion.div {...reveal(0.15)} className="mt-20 max-w-2xl">
          {tracks.map(t => (
            <MinimalPlayer key={t.title} {...t} />
          ))}
        </motion.div>

        <motion.div {...reveal(0.25)} className="mt-14">
          <Link
            href="/lifes-work/music"
            className="text-[12px] uppercase tracking-[0.22em] text-white/40 hover:text-white/70 transition"
          >
            All music →
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
