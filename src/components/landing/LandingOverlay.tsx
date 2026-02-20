'use client'

import React from 'react'
import { motion } from 'framer-motion'

import { TopRightCTA } from '@/components/TopRightCTA.client'

interface LandingOverlayProps {
    showTopRightCTA?: boolean
}

export function LandingOverlay({ showTopRightCTA = false }: LandingOverlayProps) {
    const integrations = [
        "Stripe", "HubSpot", "Salesforce", "Brave", "Runway",
        "Luma", "Minimax", "Github", "Railway", "Vercel", "Resend"
    ]

    return (
        <div className="pointer-events-none fixed inset-0 flex flex-col items-center justify-center text-center z-10 text-white">
            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 30s linear infinite;
                }
            `}</style>
            {showTopRightCTA && (
                <div className="pointer-events-auto">
                    <TopRightCTA />
                </div>
            )}
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
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-xl tracking-[0.3em] font-light text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.6)] cursor-pointer pointer-events-auto hover:text-white transition-colors uppercase"
                >
                    CLICK TO COMMENCE
                </motion.p>
            </motion.div>

            {/* Rolling Integrations Bar */}
            <div className="absolute top-1/4 w-full overflow-hidden opacity-30 pointer-events-none">
                <div className="animate-marquee whitespace-nowrap py-4">
                    {[...integrations, ...integrations].map((item, i) => (
                        <span key={i} className="mx-8 text-2xl font-thin tracking-[0.4em] uppercase">
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1, duration: 2 }}
                className="absolute bottom-12 w-full text-center"
            >
                <p className="text-[0.6rem] tracking-[0.5em] text-gray-500 mb-6 uppercase">AI Infrastructure</p>
                <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 px-4 text-[0.7rem] md:text-xs font-light tracking-[0.3em] text-gray-400 uppercase">
                    <span className="text-white brightness-125">GPT-4o</span>
                    <span>Claude 3.5 Sonnet</span>
                    <span className="text-white brightness-110">Gemini 1.5 Pro</span>
                    <span>DeepSeek R1</span>
                    <span>DeepSeek V3</span>
                    <span>Llama 3.3 70B</span>
                    <span>Qwen Turbo</span>
                    <span>Mistral Large</span>
                </div>
            </motion.div>
        </div>
    )
}
