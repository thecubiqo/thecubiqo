'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EnterButton() {
  return (
    <motion.div whileHover={{ x: 3 }} transition={{ type: 'tween', duration: 0.18 }}>
      <Link
        href="/life"
        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-[14px] text-[#F6F3EE] hover:border-white/50 hover:bg-white/5 transition-colors"
      >
        Enter <span aria-hidden="true">→</span>
      </Link>
    </motion.div>
  );
}
