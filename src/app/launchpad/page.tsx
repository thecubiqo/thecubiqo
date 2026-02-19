'use client';

import React, { useState } from 'react';
import { Shield, Key, Check, Zap, Server, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export default function LaunchpadPage() {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [projectId, setProjectId] = useState<string>(''); // Would come from context/auth
    const supabase = createClient();

    const integrations = [
        { id: 'shopify', name: 'Shopify', icon: Globe, desc: 'Storefront & Inventory' },
        { id: 'printify', name: 'Printify', icon: Server, desc: 'Global Fulfillment' },
        { id: 'klaviyo', name: 'Klaviyo', icon: Zap, desc: 'Email Automation' },
        { id: 'tiktok', name: 'TikTok Shop', icon: Zap, desc: 'Viral Sales Channel' },
        { id: 'meta', name: 'Meta Ads', icon: Zap, desc: 'Traffic Engine' },
    ];

    const handleConnect = async (serviceId: string, apiKey: string) => {
        setLoading(true);
        // Simulate connection delay
        await new Promise(r => setTimeout(r, 1500));

        // In real app: call /api/emergent/secrets to store key
        console.log(`Securing key for ${serviceId}...`);

        setLoading(false);
        return true;
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 flex items-center justify-center p-6">

            {/* Background Mesh */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,_rgba(0,255,170,0.05),_transparent_70%)] animate-pulse" />
                <div className="w-full h-full bg-[url('/grid-pattern.svg')] opacity-5" />
            </div>

            <div className="relative z-10 w-full max-w-4xl">

                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Launch Configuration</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
                        Initialize <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">Profit_OS</span>
                    </h1>
                    <p className="text-white/40 max-w-xl mx-auto font-mono text-sm">
                        Securely connect your high-value infrastructure. Keys are encrypted and stored in the Emergent Vault.
                    </p>
                </div>

                {/* Integration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {integrations.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative p-6 bg-white/5 border border-white/5 rounded-xl hover:border-cyan-500/30 hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-black/50 border border-white/10">
                                        <service.icon className="w-5 h-5 text-white/70" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{service.name}</h3>
                                        <p className="text-xs text-white/40 font-mono">{service.desc}</p>
                                    </div>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-white/10 group-hover:bg-cyan-500 transition-colors" />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key className="h-4 w-4 text-white/20" />
                                </div>
                                <input
                                    type="password"
                                    placeholder={`Enter ${service.name} API Key`}
                                    className="block w-full pl-10 pr-20 py-3 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono"
                                />
                                <button
                                    className="absolute right-1 top-1 bottom-1 px-4 bg-white/10 hover:bg-cyan-500/20 text-white/60 hover:text-cyan-400 text-xs font-bold rounded-md transition-all uppercase tracking-wider"
                                >
                                    Link
                                </button>
                            </div>

                            {/* Status Indicator (Simulated) */}
                            <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/20 group-hover:text-white/40 transition-colors">
                                <Shield className="w-3 h-3" />
                                Encryption: AES-256-GCM
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Final Action */}
                <div className="mt-12 text-center">
                    <button className="px-12 py-5 bg-gradient-to-r from-cyan-600 to-green-600 text-white font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(0,255,170,0.4)] transition-all uppercase tracking-widest flex items-center gap-3 mx-auto">
                        <Zap className="w-5 h-5 fill-white" />
                        Launch Business Suite
                    </button>
                    <p className="mt-4 text-xs text-white/20 font-mono">
                        By launching, you authorize the Commerce Agent to manage inventory and fulfillment.
                    </p>
                </div>

            </div>
        </div>
    );
}
