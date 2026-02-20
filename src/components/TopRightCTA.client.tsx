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
    href = '/auth',
    ariaLabel
}: TopRightCTAProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="relative"
        >
            <Link
                href={href}
                className="group flex flex-col items-center cursor-pointer no-underline"
                aria-label={ariaLabel || "Enter Signal"}
            >
                {/* SIGNAL Text Branding */}
                <div className="text-4xl md:text-5xl font-black tracking-[-0.05em] flex select-none">
                    <span className="text-[#E84343]">S</span>
                    <span className="text-[#2D994E] ml-[2px]">I</span>
                    <span className="text-[#F2C94C] ml-[2px]">G</span>
                    <span className="text-white ml-[2px]">NAL</span>
                </div>

                {/* Directional Arrow Icon */}
                <motion.div
                    className="w-full flex justify-center mt-2 opacity-80"
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                    <svg width="60" height="12" viewBox="0 0 60 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6H50M50 6L44 2M50 6L44 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>

                {/* Subtle Hover Glow */}
                <div className="absolute -inset-4 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
        </motion.div>
    )
}
