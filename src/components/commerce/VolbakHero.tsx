'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Zap, Shield } from 'lucide-react';

export default function VolbakHero() {
    return (
        <div className="relative w-full min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-cyan-500/30">

            {/* Dynamic Background Mesh */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute top-0 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_50%_50%,_rgba(0,255,170,0.1),_transparent_70%)] animate-pulse" />
                <div className="w-full h-full bg-[url('/grid-pattern.svg')] opacity-10" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 container mx-auto px-6 pt-32 flex flex-col items-start justify-center h-full">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
                >
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Prototype // V.01</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-7xl md:text-9xl font-bold tracking-tighter leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40"
                >
                    GRAPHENE<br />
                    ARMOR.
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-xl text-lg text-white/60 font-mono mb-12 border-l-2 border-cyan-500/50 pl-6"
                >
                    Engineered with atomic-scale carbon lattices. Conductive, thermal-regulating, and stronger than steel. The jacket of the future, delivered by autonomous dropshipping agents.
                </motion.p>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 w-full max-w-4xl border-t border-white/10 pt-8"
                >
                    <div>
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Thermal Range</div>
                        <div className="text-2xl font-bold font-mono">-40°C / +40°C</div>
                    </div>
                    <div>
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Material</div>
                        <div className="text-2xl font-bold font-mono text-cyan-400">Graphene</div>
                    </div>
                    <div>
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Weight</div>
                        <div className="text-2xl font-bold font-mono">180g</div>
                    </div>
                    <div>
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Warranty</div>
                        <div className="text-2xl font-bold font-mono">100 Years</div>
                    </div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                >
                    <button className="group relative px-8 py-4 bg-white text-black font-bold uppercase tracking-wider hover:bg-cyan-400 transition-colors duration-300 flex items-center gap-3 overflow-hidden">
                        <span className="relative z-10 w-full flex items-center justify-between gap-4">
                            Pre-Order Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white group-hover:scale-x-0 origin-right transition-transform duration-500 ease-out" />
                    </button>

                    <button className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold uppercase tracking-wider hover:bg-white/5 hover:border-white/40 transition-all flex items-center gap-3">
                        <Shield className="w-5 h-5 text-white/50" />
                        View Technical Specs
                    </button>
                </motion.div>

            </div>

            {/* Futuristic Overlay Elements */}
            <div className="absolute top-0 right-0 p-8 hidden md:block">
                <div className="flex flex-col items-end gap-1 font-mono text-[10px] text-white/30">
                    <span>SYS.READY</span>
                    <span>LAT: 40.7128 N</span>
                    <span>LNG: 74.0060 W</span>
                    <span className="text-cyan-500 animate-pulse">CONNECTION_SECURE</span>
                </div>
            </div>

        </div>
    );
}
