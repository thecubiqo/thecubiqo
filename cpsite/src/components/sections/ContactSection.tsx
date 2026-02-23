'use client';

import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const reveal = (delay = 0) => ({
  initial:     { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-60px' },
  transition:  { duration: 1.0, ease: EASE, delay },
});

const links = [
  { label: 'Email',     href: 'mailto:hello@carlphillips.com', external: false },
  { label: 'LinkedIn',  href: 'https://linkedin.com/in/carlphillips',  external: true },
  { label: 'Facebook',  href: 'https://facebook.com/carlphillips',     external: true },
  { label: 'Instagram', href: 'https://instagram.com/carlphillips',    external: true },
];

export default function ContactSection() {
  return (
    <section className="bg-black px-6 md:px-16 py-[140px] border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto">

        <motion.div {...reveal()}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-5">Contact</p>
          <h2
            className="text-[40px] md:text-[58px] font-[400] tracking-[-0.03em] leading-[1.06] text-[#F2EFE8]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            For collaboration,<br className="hidden md:block" /> inquiry, or conversation.
          </h2>
        </motion.div>

        <motion.div {...reveal(0.1)} className="mt-16 border-t border-b border-white/[0.08] py-10">
          <a
            href="mailto:hello@carlphillips.com"
            className="group flex items-center justify-between"
          >
            <span
              className="text-[24px] md:text-[38px] font-[300] tracking-[-0.01em] text-white/55 group-hover:text-[#F2EFE8] transition duration-300"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              hello@carlphillips.com
            </span>
            <span className="text-white/25 group-hover:text-white/60 transition text-[18px]">→</span>
          </a>
        </motion.div>

        <motion.div {...reveal(0.18)} className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
          {links.map(l => (
            <a
              key={l.label}
              href={l.href}
              {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-[12px] uppercase tracking-[0.22em] text-white/40 hover:text-white/70 transition"
            >
              {l.label}
            </a>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
