'use client';

import { useState, useEffect } from 'react';
import { Terminal, Cpu, Activity, Zap, TrendingUp, Users, DollarSign, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function GrowthPanel() {
    const [viewMode, setViewMode] = useState<'business' | 'system'>('business');
    const [logs, setLogs] = useState<string[]>([]);
    const [vitals, setVitals] = useState<{
        creditBalance: number;
        todaySpend: number;
        todayCreditsUsed: number;
        todayTransactions: number;
    }>({
        creditBalance: 12450,
        todaySpend: 450.25,
        todayCreditsUsed: 120,
        todayTransactions: 8
    });

    const supabase = createClient();

    // Simulated live log stream
    useEffect(() => {
        const interval = setInterval(() => {
            const phrases = viewMode === 'system' ? [
                'Running heuristics scan...',
                'Optimizing neural weights...',
                'Allocating memory block 0x4F...',
                'Requesting GPU compute...',
                'Context window refresh...',
                'Analyzing user intent...',
                'Deploying to edge node...'
            ] : [
                '[Klaviyo] Segmenting VIP customers (LTV > $500)...',
                '[Apliiq] Woven label applied to Hoodie_V3...',
                '[TikTok] Virality Score: 8.4/10 (Trending)...',
                '[Meta Ads] ROAS optimized: 4.2x (Scaling)...',
                '[Gorgias] AI responded to "Shipping Inquiry" ticket...',
                '[ReCharge] Subscription renewed: Order #9921...'
            ];

            const newLog = `[${new Date().toLocaleTimeString()}] ${phrases[Math.floor(Math.random() * phrases.length)]}`;
            setLogs(prev => [...prev.slice(-15), newLog]);
        }, 2500);

        return () => clearInterval(interval);
    }, [viewMode]);

    return (
        <div className="h-full flex flex-col bg-black/40 backdrop-blur-3xl font-mono text-white">
            {/* Header Area */}
            <div className="p-6 border-b border-white/10 bg-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity className="w-16 h-16 text-cyan-400" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.3)] border border-cyan-400/30">
                        <Zap className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            CODEXO COMMAND
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest italic flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                Synchronized
                            </span>
                        </div>
                    </div>
                </div>

                {/* HUD Tabs */}
                <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setViewMode('business')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'business' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[inset_0_0_10px_rgba(0,255,255,0.1)]' : 'text-white/30 hover:text-white'}`}
                    >
                        Business Vitals
                    </button>
                    <button
                        onClick={() => setViewMode('system')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'system' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]' : 'text-white/30 hover:text-white'}`}
                    >
                        System Logs
                    </button>
                </div>
            </div>

            {/* Scrollable HUD Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {viewMode === 'business' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* 1. Main Profit HUD */}
                        <div className="bg-gradient-to-br from-green-900/20 to-black rounded-2xl p-5 border border-green-500/20 relative overflow-hidden group">
                            <div className="absolute -top-2 -right-2 opacity-5"><DollarSign className="w-24 h-24 text-green-500" /></div>
                            <div className="text-[10px] uppercase text-green-400 tracking-widest font-black mb-1.5 opacity-60">Net Profit // Today</div>
                            <div className="text-4xl font-black text-white tracking-tighter shadow-green-500/20 drop-shadow-lg">
                                ${vitals.todaySpend.toFixed(2)}
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                                <span>Agent Actions</span>
                                <span className="text-green-400">{vitals.todayTransactions} Active</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 mt-3 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-green-500 w-[65%] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            </div>
                        </div>

                        {/* 2. HUD Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all group">
                                <div className="text-[9px] uppercase text-white/40 mb-2 flex items-center gap-2 font-black tracking-widest italic group-hover:text-cyan-400">
                                    <TrendingUp className="w-3 h-3" /> Credits
                                </div>
                                <div className="text-xl font-black text-cyan-400 tracking-tight">{vitals.creditBalance.toLocaleString()}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all group">
                                <div className="text-[9px] uppercase text-white/40 mb-2 flex items-center gap-2 font-black tracking-widest italic group-hover:text-pink-400">
                                    <Users className="w-3 h-3" /> Reach
                                </div>
                                <div className="text-xl font-black text-pink-400 tracking-tight">12.8K</div>
                            </div>
                        </div>

                        {/* 3. Integration Matrix */}
                        <div className="space-y-4">
                            <div className="text-[10px] uppercase text-white/30 tracking-[0.3em] font-black border-l-2 border-cyan-500 pl-3">Commercial Matrix</div>
                            <div className="grid grid-cols-4 gap-3">
                                {['Shopify', 'Stripe', 'Faire', 'ReCharge'].map((item) => (
                                    <div key={item} className="aspect-square rounded-xl bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-1.5 hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-lg">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)] animate-pulse" />
                                        <span className="text-[7px] text-white/40 group-hover:text-white uppercase font-black tracking-tighter truncate w-full text-center px-1">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Social Pulse */}
                        <div className="space-y-4 pt-4">
                            <div className="text-[10px] uppercase text-white/30 tracking-[0.3em] font-black border-l-2 border-pink-500 pl-3">Social Pulse</div>
                            <div className="grid grid-cols-4 gap-3">
                                {['TikTok', 'Meta', 'X', 'YT'].map((item) => (
                                    <div key={item} className="aspect-square rounded-xl bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-1.5 hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-lg">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)]" />
                                        <span className="text-[7px] text-white/40 group-hover:text-white uppercase font-black tracking-tighter truncate w-full text-center px-1">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* SYSTEM LOGS HUD */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Resource Meters */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">CPU LOAD</span>
                                    <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                                </div>
                                <div className="text-3xl font-black text-white italic tracking-tighter">38%</div>
                                <div className="w-full h-1 bg-white/5 mt-3 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400 w-[38%] shadow-[0_0_15px_cyan]" />
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">MEMORY</span>
                                    <Cpu className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="text-3xl font-black text-white italic tracking-tighter">54%</div>
                                <div className="w-full h-1 bg-white/5 mt-3 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-400 w-[54%] shadow-[0_0_15px_purple]" />
                                </div>
                            </div>
                        </div>

                        {/* ACTIVE AGENTS */}
                        <div className="space-y-4">
                            <div className="text-[10px] uppercase text-white/30 tracking-[0.3em] font-black border-l-2 border-cyan-500 pl-3">Neural Cluster</div>
                            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between group hover:border-cyan-500/30 transition-all shadow-xl backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
                                    <div>
                                        <div className="text-sm font-black text-white uppercase tracking-tight italic">Commerce Agent</div>
                                        <div className="text-[10px] text-white/20 font-black tracking-widest uppercase mt-0.5">ID: ca-8821 // Active</div>
                                    </div>
                                </div>
                                <Terminal className="w-5 h-5 text-white/10 group-hover:text-cyan-400 transition-colors" />
                            </div>
                        </div>

                        {/* LIVE RUNNER LOGS (THE BOX FROM THE SCREENSHOT) */}
                        <div className="rounded-3xl bg-black/60 border border-white/10 p-5 font-mono text-[10px] leading-relaxed relative overflow-hidden h-64 shadow-2xl">
                            <div className="absolute top-0 left-0 right-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2 z-20 backdrop-blur-md">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">emergence_runner.log</span>
                            </div>
                            <div className="mt-8 space-y-2.5 h-full overflow-hidden flex flex-col justify-end relative pb-4">
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/80 to-transparent h-12 z-10" />
                                {logs.map((log, i) => (
                                    <div key={i} className="text-cyan-200/50 flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-500 border-l border-white/10 pl-2">
                                        <span className="text-cyan-500/80 font-black shrink-0">{'>'}</span>
                                        <span className="tracking-tighter font-bold uppercase">{log}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* HUD Footer Branding */}
            <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-center gap-3">
                <div className="h-0.5 w-8 bg-gradient-to-r from-transparent to-white/10" />
                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] italic">
                    {viewMode === 'business' ? 'COMMERCE_OS v1.0 ONLINE' : 'SYSTEM_SECURE // ENCRYPTED'}
                </p>
                <div className="h-0.5 w-8 bg-gradient-to-l from-transparent to-white/10" />
            </div>
        </div>
    );
}
