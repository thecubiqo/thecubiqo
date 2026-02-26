export default function VolbakHero() {
    return (
        <section className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '80px 80px',
                }}
            />

            <div className="relative z-10 text-center px-6 md:px-12 max-w-6xl mx-auto">
                {/* Eyebrow */}
                <p className="font-mono text-cyan-500 text-xs tracking-[0.4em] uppercase mb-6">
                    COLLECTION_002 / GEAR_DEPLOYED
                </p>

                {/* Headline */}
                <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black uppercase leading-none tracking-tighter text-white mb-6">
                    BUILT FOR
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">
                        EXTREMES
                    </span>
                </h1>

                {/* Sub-copy */}
                <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed">
                    Performance gear engineered at the intersection of materials science and design.
                    Zero compromise.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="px-10 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-cyan-400 transition-colors duration-200">
                        SHOP NOW
                    </button>
                    <button className="px-10 py-4 border border-white/30 text-white font-bold uppercase tracking-widest text-sm hover:border-cyan-400 hover:text-cyan-400 transition-colors duration-200">
                        EXPLORE
                    </button>
                </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
        </section>
    );
}
