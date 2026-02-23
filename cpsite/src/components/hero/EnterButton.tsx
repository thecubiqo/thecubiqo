'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EnterButton() {
  return (
    <motion.div whileHover={{ x: 5 }} transition={{ type: 'tween', duration: 0.2 }}>
      <Link
        href="/life"
        className="inline-flex items-center gap-3 border border-white/[0.10] px-7 py-3.5 text-[11px] uppercase tracking-[0.26em] text-white/40 hover:border-white/[0.20] hover:text-white/70 hover:bg-white/[0.04] transition duration-400"
      >
        Enter <span aria-hidden="true">→</span>
      </Link>
    </motion.div>
  );
}

