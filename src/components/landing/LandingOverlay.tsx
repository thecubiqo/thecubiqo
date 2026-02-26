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
                    className="text-xl tracking-[0.3em] font-light text-cyan-400 cursor-pointer pointer-events-auto hover:text-white transition-colors uppercase"
                >
                    CLICK TO COMMENCE
                </motion.p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1, duration: 2 }}
                className="absolute bottom-12 w-full flex flex-col items-center gap-4 pointer-events-auto"
            >
                <div className="flex gap-6 text-[0.7rem] md:text-xs text-gray-400 font-light tracking-wider uppercase z-20">
                    <a href="/terms" className="hover:text-white transition-colors cursor-pointer focus:outline-none">TERMS</a>
                    <a href="/privacy" className="hover:text-white transition-colors cursor-pointer focus:outline-none">PRIVACY POLICY</a>
                </div>
                <p className="text-[0.7rem] md:text-xs font-light tracking-[0.3em] text-gray-400 uppercase pointer-events-none">
                    Unveiling AGI
                </p>
            </motion.div>
        </div>
    )
}

