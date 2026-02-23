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

const features = [
  {
    title: 'Voice Conversations',
    body: 'Natural voice interaction with emotional modulation. Cubiqo listens, understands context, and responds with nuance — powered by open models like Llama and Mixtral.',
    stats: [
      { n: 'Open',   label: 'Source models' },
      { n: 'BYO',    label: 'Bring your keys' },
      { n: '∞',      label: 'Conversations' },
    ],
  },
  {
    title: 'Rozana Journal',
    body: 'Daily reflections with AI-guided conversations. Build a living journal that surfaces patterns, insights, and growth over time using your own private data.',
    stats: [
      { n: 'Daily',  label: 'Reflections' },
      { n: 'RGY',    label: 'Life context' },
      { n: '100%',   label: 'Private' },
    ],
  },
];

export default function WorkSection() {
  return (
    <section className="bg-black px-6 md:px-16 py-[140px] border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto">

        <motion.div {...reveal()}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-5">Features</p>
          <h2
            className="text-[40px] md:text-[58px] font-[400] tracking-[-0.03em] leading-[1.06] max-w-3xl text-[#F2EFE8]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Voice. Journal.<br className="hidden md:block" /> Intelligent matching.
          </h2>
        </motion.div>

        <div className="mt-20 grid md:grid-cols-2 gap-px bg-white/[0.08]">
          {features.map((feature, i) => (
            <motion.div key={feature.title} {...reveal(i * 0.1)}>
              <div className="bg-black p-10 md:p-12 h-full flex flex-col">
                <h3
                  className="text-[24px] md:text-[28px] font-[400] text-[#F2EFE8] leading-[1.1] tracking-[-0.02em] mb-6"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {feature.title}
                </h3>
                <p className="text-[15px] text-white/55 leading-[1.8] mb-12 flex-1">{feature.body}</p>
                <div className="grid grid-cols-3 gap-px bg-white/[0.08]">
                  {feature.stats.map(s => (
                    <div key={s.label} className="bg-black pt-5 pb-4 pr-4">
                      <p className="text-[26px] font-[300] text-[#F2EFE8] leading-none tracking-[-0.02em]"
                         style={{ fontFamily: 'var(--font-display)' }}>
                        {s.n}
                      </p>
                      <p className="text-[11px] text-white/35 mt-1.5 leading-[1.4]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div {...reveal(0.2)} className="mt-px bg-white/[0.08]">
          <div className="bg-black px-10 md:px-12 py-10">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/40 mb-4">
              Privacy‑First · Open Source
            </p>
            <h3
              className="text-[24px] font-[400] text-[#F2EFE8] tracking-[-0.02em] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              RGY Context — Your life in colour
            </h3>
            <p className="text-[15px] text-white/55 leading-[1.8] max-w-2xl">
              Red · Yellow · Green. Colour-code every aspect of your life so Cubiqo can surface opportunities,
              flag friction, and guide growth — all powered by models you control.
            </p>
          </div>
        </motion.div>

        <motion.div {...reveal(0.3)} className="mt-14 flex flex-wrap gap-10 items-center">
          <a
            href="https://github.com/thecubiqo/thecubiqo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] uppercase tracking-[0.22em] border border-white/[0.08] px-6 py-3 text-white/55 hover:border-white/[0.14] hover:text-[#F2EFE8] hover:bg-white/[0.04] transition duration-300"
          >
            View on GitHub ↗
          </a>
          <Link
            href="/contact"
            className="text-[12px] uppercase tracking-[0.22em] text-white/40 hover:text-white/70 transition"
          >
            Get early access →
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
