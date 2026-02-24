'use client';

import { motion } from 'framer-motion';
import TileCard from '@/components/cards/TileCard';

const tiles = [
  {
    href: '/life',
    label: 'Life',
    desc: 'Fragments, places, photographs, and the quiet details.',
  },
  {
    href: '/work',
    label: 'Work',
    desc: 'Programs, teams, funding, outcomes — built to hold weight.',
  },
  {
    href: '/lifes-work',
    label: "Life's Work",
    desc: 'Writing, music, and field notes — posted simply, kept intact.',
  },
];

export default function ThreeTiles() {
  return (
    <section className="bg-[#F6F3EE] px-6 md:px-12 pb-24 md:pb-32">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-px bg-[#E2DDD7]">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.href}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.12 }}
          >
            <TileCard {...tile} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
