'use client';

import { motion } from 'framer-motion';

export default function PremiumHero() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white font-serif">
            {/* Background Animated Elements */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-pink-900/20 blur-[100px] rounded-full"
                />
            </div>

            <div className="relative z-10 text-center px-6 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="text-[10px] uppercase tracking-[0.4em] text-purple-400 mb-6 font-sans font-bold"
                >
                    Signature Collection · 2026
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-6xl md:text-8xl font-light leading-[1.1] mb-8 tracking-tight"
                >
                    Elegance <br />
                    <span className="italic font-normal">Reimagined.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="text-lg md:text-xl font-sans max-w-2xl mx-auto mb-12 leading-relaxed font-light"
                >
                    Experience the pinnacle of luxury craftsmanship. Our new digital atelier is designed for those who demand nothing less than perfection.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="flex flex-col md:flex-row items-center justify-center gap-6"
                >
                    <button className="px-10 py-4 bg-white text-black hover:bg-gray-200 transition-all rounded-full font-sans text-sm font-bold uppercase tracking-widest shadow-2xl">
                        Explore Collection
                    </button>
                    <button className="px-10 py-4 border border-white/30 hover:bg-white/10 transition-all rounded-full font-sans text-sm font-bold uppercase tracking-widest backdrop-blur-sm">
                        Watch Film
                    </button>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30"
            >
                <span className="text-[10px] uppercase tracking-widest font-sans">Scroll</span>
                <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
            </motion.div>
        </div>
    );
}
