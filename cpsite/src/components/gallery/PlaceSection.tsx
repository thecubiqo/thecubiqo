'use client';

import { motion } from 'framer-motion';
import ImageGallery from './ImageGallery';

interface Place {
  id: string;
  name: string;
  years: string;
  note: string;
  images: string[];
}

interface Props {
  place: Place;
}

export default function PlaceSection({ place }: Props) {
  const images = place.images.map((src) => ({ src, alt: `${place.name} — photo` }));
  return (
    <motion.section
      id={place.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.85, ease: 'easeOut' }}
    >
      <div className="flex items-baseline justify-between mb-6 border-b border-[#E2DDD7] pb-4">
        <h2 className="text-[26px] font-[520] tracking-[-0.01em]">{place.name}</h2>
        <span className="text-[13px] text-[#A9A9A9]">{place.years}</span>
      </div>
      <p className="text-[16px] text-[#5A5752] leading-[1.7] max-w-xl mb-10">{place.note}</p>
      <ImageGallery images={images} layout="grid" />
    </motion.section>
  );
}
