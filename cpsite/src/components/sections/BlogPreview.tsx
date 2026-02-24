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

const posts = [
  {
    href: '/lifes-work/another-year',
    category: 'Field Notes',
    title: "Another year and it's still.",
    excerpt: 'Some years, January feels like a question the year forgot to answer.',
    date: 'Jan 2026',
  },
  {
    href: '/lifes-work/on-displacement',
    category: 'Writing',
    title: 'On displacement and dignity.',
    excerpt: "Three years in, the work still surprises me — not the hardship, but the persistence of grace.",
    date: 'Dec 2025',
  },
  {
    href: '/lifes-work/evangeline',
    category: 'Music',
    title: 'Evangeline — live recording.',
    excerpt: "A piece I've returned to twice. First as a student. Now as something else.",
    date: 'Nov 2025',
  },
];

export default function BlogPreview() {
  return (
    <section className="bg-black px-6 md:px-16 py-[140px] border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto">

        <motion.div {...reveal()}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-5">Life&apos;s Work</p>
          <h2
            className="text-[40px] md:text-[58px] font-[400] tracking-[-0.03em] leading-[1.06] max-w-2xl text-[#F2EFE8]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Writing. Field notes.<br className="hidden md:block" /> Reflection.
          </h2>
        </motion.div>

        <div className="mt-20 grid md:grid-cols-3 gap-px bg-white/[0.08]">
          {posts.map((post, i) => (
            <motion.div key={post.href} {...reveal(i * 0.1)}>
              <Link
                href={post.href}
                className="group bg-black p-10 block hover:bg-white/[0.04] transition-colors duration-500 h-full flex flex-col"
              >
                <div className="flex items-baseline justify-between mb-8">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">{post.category}</p>
                  <p className="text-[11px] text-white/25">{post.date}</p>
                </div>
                <h3
                  className="text-[20px] md:text-[23px] font-[400] text-[#F2EFE8] leading-[1.15] tracking-[-0.02em] group-hover:text-white/70 transition flex-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {post.title}
                </h3>
                <p className="mt-5 text-[14px] text-white/40 leading-[1.75] group-hover:text-white/55 transition">
                  {post.excerpt}
                </p>
                <span className="block mt-10 text-[11px] uppercase tracking-[0.22em] text-white/25 group-hover:text-white/50 transition">
                  Read →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div {...reveal(0.3)} className="mt-12">
          <Link
            href="/lifes-work"
            className="text-[12px] uppercase tracking-[0.22em] text-white/40 hover:text-white/70 transition"
          >
            View all posts →
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
