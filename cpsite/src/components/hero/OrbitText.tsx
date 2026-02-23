'use client'

import { motion } from 'framer-motion'

/**
 * OrbitText — subliminal silver-mercury word halo around the hero creature.
 * Individual words, not a sentence. Feels like ambient data, not decoration.
 */

const WORDS = [
  'Charity',
  'Wisdom',
  'Service',
  'Fear',
  'Ignorance',
  'Sound',
  'Humanity',
  'Dignity',
  'Refuge',
  'Silence',
  'Field',
  'Memory',
]

const COUNT  = WORDS.length
const RADIUS = 210 // px — scales well on 1024px+ screens

export default function OrbitText() {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      animate={{ rotate: 360 }}
      transition={{ duration: 130, ease: 'linear', repeat: Infinity }}
    >
      {WORDS.map((word, i) => {
        const angleDeg    = (i / COUNT) * 360
        const shimmerDelay = (i / COUNT) * 5.5

        return (
          <motion.span
            key={word}
            className="absolute select-none whitespace-nowrap"
            style={{
              transform: `rotate(${angleDeg}deg) translateX(${RADIUS}px) rotate(-${angleDeg}deg)`,
              fontSize:      '9px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontWeight:    400,
              color:         '#7A9898',
              textShadow:    '0 0 8px rgba(130,190,190,0.22)',
            }}
            animate={{ opacity: [0.12, 0.45, 0.12] }}
            transition={{
              duration:  5.0,
              ease:      'easeInOut',
              repeat:    Infinity,
              delay:     shimmerDelay,
            }}
          >
            {word}
          </motion.span>
        )
      })}
    </motion.div>
  )
}
