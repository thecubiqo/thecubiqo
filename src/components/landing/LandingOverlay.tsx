'use client'

/**
 * LandingOverlay - Premium Interaction Layer
 * 
 * Contains the central speaker orb and the bottom-center footer.
 * Matches Apple-level minimal aesthetic.
 */

import React from 'react'
import { motion } from 'framer-motion'

interface LandingOverlayProps {
    onStart: () => void
    showTopRightCTA?: boolean
}

export function LandingOverlay({ onStart }: LandingOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8">
            {/* Central Area: Premium Pulsing Orb */}
            <div className="flex-1 flex items-center justify-center -mt-20">
                <motion.button
                    onClick={onStart}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="relative group cursor-pointer focus:outline-none"
                    aria-label="Enter Experience"
                >
                    {/* Subtle Outer Halo for that "Premium Glow" */}
                    <div className="absolute inset-[-80px] rounded-full bg-orange-500/5 blur-[100px] group-hover:bg-orange-500/10 transition-colors duration-1000" />

                    <div className="relative">
                        <SpeakerPulse />

                        {/* Soft inner glow hint */}
                        <div className="absolute inset-0 rounded-full shadow-[0_0_120px_rgba(249,115,22,0.1)] group-hover:shadow-[0_0_150px_rgba(249,115,22,0.2)] transition-all duration-1000" />
                    </div>
                </motion.button>
            </div>

            {/* Modern Minimalist Footer */}
            <motion.footer
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.8 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="flex items-center gap-6 sm:gap-12 text-white/20 text-[10px] sm:text-[11px] tracking-[0.25em] font-light uppercase">
                    <a href="/tos" target="_blank" className="hover:text-white/50 transition-colors duration-300">Terms</a>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <a href="/privacy" target="_blank" className="hover:text-white/50 transition-colors duration-300">Privacy Policy</a>
                </div>

                <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <p className="text-white/10 text-[9px] tracking-[0.4em] font-light uppercase">
                    Unveiling AGI
                </p>
            </motion.footer>
        </div>
    )
}

function SpeakerPulse() {
    return (
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
            {/* Cinematic Pulse Rings */}
            <div className="absolute inset-0 rounded-full border border-orange-500/10 animate-[ping_5s_linear_infinite]" />
            <div className="absolute inset-10 rounded-full border border-orange-500/15 animate-[ping_4s_linear_infinite]" />
            <div className="absolute inset-20 rounded-full border border-orange-200/5 animate-pulse" />

            {/* Inner Speaker Sphere */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 shadow-[0_0_60px_rgba(249,115,22,0.5)] flex items-center justify-center overflow-hidden">
                {/* Abstract Micro-mesh texture */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-[0.08]">
                    {[...Array(36)].map((_, i) => (
                        <div key={i} className="border-[0.2px] border-white/40" />
                    ))}
                </div>

                {/* Cinematic Speaker Wave Icon */}
                <svg
                    viewBox="0 0 24 24"
                    className="w-12 h-12 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>

                {/* Dynamic Highlight overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />

                {/* Rim Light */}
                <div className="absolute inset-0 rounded-full border border-white/10" />
            </div>
        </div>
    )
}
