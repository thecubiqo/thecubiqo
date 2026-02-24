'use client'

import React from 'react'
import { motion } from 'framer-motion'

import { TopRightCTA } from '@/components/TopRightCTA.client'

interface LandingOverlayProps {
    showTopRightCTA?: boolean
}

export function LandingOverlay({ showTopRightCTA = false }: LandingOverlayProps) {
    return (
        <div className="pointer-events-none fixed inset-0 flex flex-col items-center justify-center text-center z-10 text-white">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                className="flex flex-col items-center"
            >
                {/* 
                    Note: The main "CubiQo" logo is provided by the FullscreenApp header 
                    which shows through due to z-index layering.
                */}
                <p className="text-2xl md:text-3xl font-light tracking-[0.2em] mb-16 opacity-80 mt-20">
                    One Mind. Many Dimensions.
                </p>

                <motion.p
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-xl tracking-[0.3em] font-light text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.6)] cursor-pointer pointer-events-auto hover:text-white transition-colors uppercase"
                >
                    CLICK TO COMMENCE
                </motion.p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1, duration: 2 }}
                className="absolute bottom-24 w-full text-center"
            >
                <p className="text-[0.7rem] md:text-xs font-light tracking-[0.3em] text-gray-400 uppercase">
                    Unveiling AGI
                </p>
            </motion.div>
        </div>
    )
}

