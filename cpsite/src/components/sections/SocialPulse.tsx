'use client';

import { motion } from 'framer-motion';
import PulseCard from '@/components/cards/PulseCard';

// Static placeholder data — replace with fetched data via lib/social/
const placeholderCards = [
  {
    platform: 'LinkedIn' as const,
    title: 'On resilience in refugee services',
    excerpt: 'Three years in, the work still surprises me. Not the hardship — that was expected…',
    date: 'Feb 2026',
    href: '#',
  },
  {
    platform: 'Facebook' as const,
    title: 'Playing Chopin again after a long pause.',
    excerpt: "Sometimes you come back to a piece and it's a different piece entirely…",
    date: 'Jan 2026',
    href: '#',
  },
  {
    platform: 'Instagram' as const,
    title: 'Morning light, Lusaka 2013.',
    excerpt: 'Found this on an old drive. A lot was simpler then.',
    date: 'Jan 2026',
    href: '#',
  },
];

export default function SocialPulse() {
  return (
    <section className="bg-[#F0EDE8] px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="text-[13px] uppercase tracking-[0.18em] text-[#A9A9A9] mb-2">Recent</p>
          <p className="text-[18px] text-[#0B0B0D]">
            Selected notes and signals — shared across platforms, archived here.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {placeholderCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.1 }}
            >
              <PulseCard {...card} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
