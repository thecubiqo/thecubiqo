'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export type GalleryLayout = 'masonry' | 'grid' | 'feature';

interface GalleryImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface Props {
  images: GalleryImage[];
  layout?: GalleryLayout;
}

export default function ImageGallery({ images, layout = 'grid' }: Props) {
  if (images.length === 0) {
    return (
      <div className="text-[#A9A9A9] text-[14px] py-12 border border-dashed border-[#E2DDD7] text-center">
        Images will appear here.
      </div>
    );
  }

  const containerClass =
    layout === 'masonry'
      ? 'columns-2 md:columns-3 gap-3 space-y-3'
      : layout === 'feature'
      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
      : 'grid grid-cols-2 md:grid-cols-3 gap-3';

  return (
    <div className={containerClass}>
      {images.map((img, i) => (
        <motion.div
          key={img.src}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.06 }}
          className={layout === 'masonry' ? 'break-inside-avoid' : ''}
        >
          <div className="overflow-hidden group">
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width ?? 800}
              height={img.height ?? 600}
              className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              style={{ filter: 'saturate(0.88) contrast(1.04)' }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
