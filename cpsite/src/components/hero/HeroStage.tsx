'use client';

import { motion } from 'framer-motion';
import TopNav from '@/components/nav/TopNav';
import CreatureScene from './CreatureScene';
import HeroCopy from './HeroCopy';
import OrbitText from './OrbitText';

export default function HeroStage() {
  return (
    <section className="relative min-h-[100svh] w-full bg-[#0B0B0D] overflow-hidden">
      <TopNav theme="dark" />

      {/* Animated background */}
      <div className="absolute inset-0">
        <CreatureScene />
      </div>

      {/* Silver-mercury orbital liner — shimmering words around the creature */}
      <OrbitText />

      {/* Vignette + grain overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.10),rgba(0,0,0,0.0)_55%,rgba(0,0,0,0.55))]" />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27 opacity=%270.22%27/%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* Copy positioned at bottom-left — 1.4 s delay (text enters after creature settles) */}
      <div className="relative z-10 flex min-h-[100svh] items-end">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: 'easeOut', delay: 1.4 }}
          className="w-full px-6 pb-16 md:px-12 md:pb-20"
        >
          <HeroCopy />
        </motion.div>
      </div>
    </section>
  );
}

