'use client';

import { motion } from 'framer-motion';

export default function Statement() {
  return (
    <section className="bg-[#F6F3EE] px-6 md:px-12 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="max-w-2xl mx-auto text-center"
      >
        <p className="text-[24px] md:text-[32px] font-[440] tracking-[-0.01em] leading-[1.35] text-[#0B0B0D]">
          A life shaped by service and sound.
        </p>
        <p className="mt-5 text-[16px] md:text-[18px] text-[#5A5752] leading-[1.65]">
          Work that meets people where they are, and art that stays.
        </p>
      </motion.div>
    </section>
  );
}
