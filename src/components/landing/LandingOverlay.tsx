'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function LandingOverlay() {
    return (
        <div className="pointer-events-none fixed inset-0 flex flex-col items-center justify-center text-center z-10 text-white">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                className="flex flex-col items-center"
            >
                <h1 className="text-8xl md:text-[10rem] font-thin tracking-[0.4em] mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    CUBIQO
                </h1>

                <p className="text-2xl md:text-3xl font-light tracking-[0.2em] mb-16 opacity-80">
                    One Mind. Many Dimensions.
                </p>

                <motion.p
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-xl tracking-[0.1em] font-light text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                >
                    YOU MAY TAP NOW
                </motion.p>
            </motion.div>
        </div>
    )
}
