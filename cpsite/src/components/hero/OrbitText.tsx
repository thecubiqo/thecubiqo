'use client'

import { motion } from 'framer-motion'

/**
 * OrbitText
 * Shimmering silver-mercury words orbiting slowly around the hero creature.
 * The full quote is split into individual words; each is placed on a circle
 * via CSS rotate + translateX + counter-rotate so the text stays upright.
 * The whole ring rotates at museum pace (120 s / revolution).
 */

const QUOTE =
  'Where · there · is · charity · and · wisdom · there · is · neither · fear · nor · ignorance'

const WORDS = QUOTE.split(' · ')
const COUNT = WORDS.length

// Responsive radius: clamp between 140 px (mobile) and 240 px (desktop)
// We expose it as a CSS custom-property set by the parent wrapper.
const RADIUS = 210 // px — works well for 1024 px+ screens

export default function OrbitText() {
  return (
    // Slow full-ring rotation — 120 s per revolution (museum stillness)
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      animate={{ rotate: 360 }}
      transition={{ duration: 120, ease: 'linear', repeat: Infinity }}
    >
      {WORDS.map((word, i) => {
        const angleDeg = (i / COUNT) * 360
        // Stagger shimmer so words pulse in a wave, not all at once
        const shimmerDelay = (i / COUNT) * 4.5

        return (
          <motion.span
            key={word + i}
            className="absolute select-none whitespace-nowrap"
            style={{
              // Place each word on the orbit ring, then counter-rotate so
              // text reads left-to-right regardless of ring position
              transform: `rotate(${angleDeg}deg) translateX(${RADIUS}px) rotate(-${angleDeg}deg)`,
              fontSize: '9px',
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              fontWeight: 400,
              color: '#9DB4B4',           // cool silver-mercury
              textShadow:
                '0 0 6px rgba(160,210,210,0.35), 0 0 14px rgba(160,210,210,0.12)',
            }}
            // Per-word opacity shimmer — slight mercury liquid feel
            animate={{ opacity: [0.18, 0.55, 0.18] }}
            transition={{
              duration: 4.2,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: shimmerDelay,
            }}
          >
            {word}
          </motion.span>
        )
      })}
    </motion.div>
  )
}
