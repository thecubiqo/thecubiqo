'use client';

import { motion } from 'framer-motion';

const products = [
    { id: 1, name: 'The Aurelius Watch', category: 'Timepieces', price: '$12,500', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800' },
    { id: 2, name: 'Obsidian Fragrance', category: 'Scents', price: '$450', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800' },
    { id: 3, name: 'Vesper Leather Bag', category: 'Accessories', price: '$3,800', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800' },
];

export default function ImmersiveGallery() {
    return (
        <div className="bg-[#0a0a0a] py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-16">
                    <div>
                        <h2 className="text-4xl md:text-5xl text-white font-serif mb-4">Curated Selections</h2>
                        <p className="text-gray-500 max-w-md text-sm leading-relaxed">
                            Every piece in our collection is hand-vetted by our master artisans to ensure uncompromised quality and timeless design.
                        </p>
                    </div>
                    <button className="text-white text-sm uppercase tracking-[0.2em] border-b border-white/20 pb-1 hover:border-white transition-colors">
                        View All
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {products.map((product, idx) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: idx * 0.2 }}
                            className="group cursor-pointer"
                        >
                            <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-gray-900 rounded-sm">
                                <motion.img
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <span className="text-white text-xs uppercase tracking-widest font-bold bg-black/60 px-6 py-3 rounded-full backdrop-blur-md">
                                        Quick View
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg text-white font-serif mb-1 group-hover:text-purple-400 transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest">{product.category}</p>
                                </div>
                                <div className="text-sm text-gray-400 font-sans">{product.price}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
