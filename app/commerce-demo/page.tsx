import VolbakHero from '@/components/commerce/VolbakHero';

export default function CommerceDemoPage() {
    return (
        <main className="min-h-screen bg-black">
            <VolbakHero />

            {/* Product Grid Section (Skeleton) */}
            <section className="py-24 px-6 md:px-12 bg-black border-t border-white/10">
                <div className="container mx-auto">
                    <div className="flex justify-between items-end mb-16">
                        <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
                            DEPLOYED_GEAR
                        </h2>
                        <span className="font-mono text-cyan-500 text-sm tracking-widest hidden md:block">
                            SERIES: GEN.002
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="group relative aspect-[3/4] bg-[#0A0A0A] border border-white/5 overflow-hidden">
                                {/* Image Placeholder */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 group-hover:scale-105 transition-transform duration-700" />

                                {/* Overlay Info */}
                                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="text-xs font-mono text-cyan-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        READY_TO_SHIP
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">Carbon Shirt V2</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/60">$145.00</span>
                                        <button className="text-sm font-bold uppercase tracking-wider text-white border-b border-transparent group-hover:border-white transition-colors">
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
