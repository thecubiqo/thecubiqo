'use client';

import { motion } from 'framer-motion';
import TileCard from '@/components/cards/TileCard';

const tiles = [
  {
    href: '/#features',
    label: 'Features',
    desc: 'Voice conversations, Rozana Journal, and RGY intelligent matching.',
  },
  {
    href: '/work',
    label: 'Demo',
    desc: 'Explore the core Cubiqo features — voice, journal, and intelligent matching.',
  },
  {
    href: '/lifes-work',
    label: 'Blog',
    desc: 'Updates, feature deep-dives, and community highlights — from the Cubiqo team.',
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
