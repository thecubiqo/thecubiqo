'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { track } from '@vercel/analytics'

interface TopRightCTAProps {
    href?: string
    label?: string
    openInNewTab?: boolean
    ariaLabel?: string
}

export function TopRightCTA({
    href = '/welcome',
    label = 'Welcome',
    openInNewTab = false,
    ariaLabel
}: TopRightCTAProps) {
    const [isHovered, setIsHovered] = useState(false)

    const handleClick = () => {
        // 3. Click flow: play 150ms cuboid flip micro-animation (managed via motion)
        // 5. Track analytics event
        track('top_right_cta_click', {
            pr: 'top-right',
            label: label,
            timestamp: new Date().toISOString()
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="fixed top-6 right-6 z-50"
        >
            <Link
                href={href}
                target={openInNewTab ? '_blank' : undefined}
                rel={openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative flex items-center gap-3 px-5 py-3 bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:border-orange-500/50 hover:shadow-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-label={ariaLabel || `Open ${label} page`}
            >
                {/* Cuboid Icon with Flip Animation */}
                <motion.div
                    animate={isHovered ? { rotateY: 360 } : { rotateY: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="relative w-6 h-6 text-orange-500"
                >
                    {/* Inline Cuboid SVG */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l10 6-10 6-10-6 10-6z" />
                        <path d="M22 9v6l-10 6-10-6V9" />
                        <path d="M12 21V9" />
                    </svg>
                </motion.div>

                {/* Label */}
                <span className="text-white/80 font-medium tracking-wide text-sm hidden md:inline-block">
                    {label}
                </span>

                {/* Arrow with slide animation */}
                <motion.div
                    animate={{ x: isHovered ? 4 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-white/60 group-hover:text-orange-400 ml-1"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                    </svg>
                </motion.div>

                {/* Hover Underline Sweep */}
                <div className="absolute bottom-2 left-5 right-5 h-[1px] bg-orange-500/0 group-hover:bg-orange-500/50 transition-colors duration-300 transform scale-x-0 group-hover:scale-x-100 origin-left" />
            </Link>
        </motion.div>
    )
}
