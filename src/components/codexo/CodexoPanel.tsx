'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Activity, Zap, X, Minimize2, Maximize2, TrendingUp, Users, DollarSign, Package, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CodexoPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [activeWorkspaces, setActiveWorkspaces] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'system' | 'business'>('business');
    const [bootSequence, setBootSequence] = useState(0);
    const [vitals, setVitals] = useState<{
      creditBalance: number;
      todaySpend: number;
      todayCreditsUsed: number;
      todayTransactions: number;
      recentTransactions: Array<{ amount: number; type: string; description: string; resourceType: string; createdAt: string }>;
      usageByResource: Array<{ resourceType: string; creditsConsumed: number; count: number }>;
    } | null>(null);
    const supabase = createClient();

    // Boot Sequence Animation
    useEffect(() => {
        if (isOpen) {
            setBootSequence(0);
            const interval = setInterval(() => {
                setBootSequence(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 30);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    // Fetch real business vitals from the API
    useEffect(() => {
      if (!isOpen || bootSequence < 100 || viewMode !== 'business') return;

      const fetchVitals = async () => {
        try {
          const res = await fetch('/api/emergent/analytics/business-vitals');
          if (res.ok) {
            const json = await res.json();
            if (json.success) {
              setVitals(json.data);
            }
          }
        } catch {
          // Silently fail — will show fallback values
        }
      };

      fetchVitals();
      const interval = setInterval(fetchVitals, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }, [isOpen, bootSequence, viewMode]);

    // Simulated live log stream
    useEffect(() => {
        if (!isOpen || bootSequence < 100) return;

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
                '[Through6] Sublimation print complete. Cutting...',
                '[Gorgias] AI responded to "Shipping Inquiry" ticket...',
                '[ReCharge] Subscription renewed: Order #9921...',
                '[Faire] Wholesale inquiry from boutique in Paris...'
            ];

            const newLog = `[${new Date().toLocaleTimeString()}] ${phrases[Math.floor(Math.random() * phrases.length)]}`;
            setLogs(prev => [...prev.slice(-20), newLog]);
        }, 2000);

        return () => clearInterval(interval);
    }, [isOpen, viewMode, bootSequence]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] hover:scale-105 transition-all duration-300 group z-50 overflow-hidden"
            >
                <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
                <div className="relative">
                    <Zap className="w-6 h-6 text-cyan-400 group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_lime]" />
                </div>
            </button>
        );
    }

    return (
        <div
            className={`fixed right-4 transition-all duration-500 ease-out z-50 overflow-hidden
        ${isMaximized ? 'top-4 bottom-4 w-[600px]' : 'bottom-4 top-auto h-[600px] w-96'}
        rounded-2xl border border-white/10 bg-black/90 backdrop-blur-3xl shadow-2xl flex flex-col font-mono text-white selection:bg-cyan-500/30
      `}
            style={{
                boxShadow: '0 0 50px rgba(0, 229, 255, 0.15), inset 0 0 30px rgba(0, 229, 255, 0.05)',
                backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 2px, 3px 100%'
            }}
        >
            {/* Boot Screen Overlay */}
            {bootSequence < 100 && (
                <div className="absolute inset-0 z-[60] bg-black flex items-center justify-center p-8">
                    <div className="w-full max-w-xs space-y-4">
                        <div className="flex justify-between text-xs text-cyan-500 uppercase tracking-widest">
                            <span>Initializing Codexo...</span>
                            <span>{bootSequence}%</span>
                        </div>
                        <div className="h-1 bg-white/10 w-full rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]"
                                style={{ width: `${bootSequence}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-white/30 h-10 overflow-hidden">
                            {bootSequence > 20 && <div>&gt; Loading Kernel... OK</div>}
                            {bootSequence > 40 && <div>&gt; Decrypting Vault... OK</div>}
                            {bootSequence > 60 && <div>&gt; Connecting Hostinger Node... OK</div>}
                            {bootSequence > 80 && <div>&gt; Mounting Business Vitals...</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                    <span className="font-mono text-sm font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                        CODEXO COMMAND
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors"
                    >
                        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-black/20 shrink-0">
                <button
                    onClick={() => setViewMode('business')}
                    className={`flex-1 py-3 text-xs font-mono tracking-wider uppercase transition-colors relative ${viewMode === 'business' ? 'text-cyan-400 bg-white/5' : 'text-white/40 hover:text-white'}`}
                >
                    Business Vitals
                    {viewMode === 'business' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_cyan]" />}
                </button>
                <button
                    onClick={() => setViewMode('system')}
                    className={`flex-1 py-3 text-xs font-mono tracking-wider uppercase transition-colors relative ${viewMode === 'system' ? 'text-purple-400 bg-white/5' : 'text-white/40 hover:text-white'}`}
                >
                    System Logs
                    {viewMode === 'system' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-400 shadow-[0_0_10px_purple]" />}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">

                {viewMode === 'business' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* 1. Main Profit Dashboard */}
                        <div className="bg-gradient-to-br from-green-900/20 to-black rounded-xl p-4 border border-green-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-50"><DollarSign className="w-12 h-12 text-green-500/10" /></div>
                            <div className="text-[10px] uppercase text-green-400 tracking-wider mb-1">Net Profit (Today)</div>
                            <div className="text-3xl font-bold text-white font-mono">${vitals ? vitals.todaySpend.toFixed(2) : '—'}</div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-white/40">Credits used: {vitals ? vitals.todayCreditsUsed : 0}</span>
                                <span className="text-green-400 flex items-center gap-1">{vitals ? vitals.todayTransactions : 0} txns today</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 mt-3 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[65%] animate-pulse" />
                            </div>
                        </div>

                        {/* 2. Marketing Engine (ROAS) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors">
                                <div className="text-[10px] uppercase text-white/40 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Credits</div>
                                <div className="text-xl font-mono text-cyan-400">{vitals ? vitals.creditBalance.toLocaleString() : '—'}</div>
                                <div className="text-[9px] text-white/30 mt-1">Balance</div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-pink-500/30 transition-colors">
                                <div className="text-[10px] uppercase text-white/40 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Ops Today</div>
                                <div className="text-xl font-mono text-pink-400">{vitals ? vitals.todayTransactions : 0}</div>
                                <div className="text-[9px] text-white/30 mt-1">Agent Actions</div>
                            </div>
                        </div>

                        {/* 3. Integration Grid (Categorical) */}
                        <div className="space-y-4">
                            {/* Commercial */}
                            <div className="space-y-2">
                                <div className="text-[9px] uppercase text-green-400/60 tracking-widest font-bold">Commercial</div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { name: 'Shopify', color: 'bg-green-500' },
                                        { name: 'Plus', color: 'bg-green-600' },
                                        { name: 'Faire', color: 'bg-indigo-500' },
                                        { name: 'ReCharge', color: 'bg-blue-400' }
                                    ].map((item) => (
                                        <div key={item.name} className="aspect-square rounded-lg bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-1 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group" title={item.name}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.color} shadow-[0_0_5px_currentColor]`} />
                                            <span className="text-[7px] text-white/40 group-hover:text-white uppercase truncate w-full text-center px-0.5">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Productive */}
                            <div className="space-y-2">
                                <div className="text-[9px] uppercase text-cyan-400/60 tracking-widest font-bold">Productive</div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { name: 'Klaviyo', color: 'bg-cyan-500 shadow-[0_0_5px_cyan]' },
                                        { name: 'Apliiq', color: 'bg-orange-500' },
                                        { name: 'Through6', color: 'bg-orange-600' },
                                        { name: 'Gorgias', color: 'bg-blue-600' }
                                    ].map((item) => (
                                        <div key={item.name} className="aspect-square rounded-lg bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-1 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group" title={item.name}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                                            <span className="text-[7px] text-white/40 group-hover:text-white uppercase truncate w-full text-center px-0.5">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Social */}
                            <div className="space-y-2">
                                <div className="text-[9px] uppercase text-pink-400/60 tracking-widest font-bold">Social</div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { name: 'Meta', color: 'bg-blue-600' },
                                        { name: 'TikTok', color: 'bg-pink-500' },
                                        { name: 'X', color: 'bg-white' },
                                        { name: 'YouTube', color: 'bg-red-600' }
                                    ].map((item) => (
                                        <div key={item.name} className="aspect-square rounded-lg bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-1 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group" title={item.name}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                                            <span className="text-[7px] text-white/40 group-hover:text-white uppercase truncate w-full text-center px-0.5">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 4. Recent Operations */}
                        <div className="rounded-lg bg-white/5 border border-white/5 p-3">
                            <div className="text-[10px] uppercase text-white/40 mb-2 flex items-center gap-1"><Package className="w-3 h-3" /> Live Operations</div>
                            <div className="space-y-2 text-[10px] font-mono">
                                {vitals && vitals.recentTransactions.length > 0 ? (
                                  vitals.recentTransactions.slice(0, 3).map((tx, i) => (
                                    <div key={i} className={`flex justify-between text-white/70 ${i < 2 ? 'border-b border-white/5 pb-1' : ''}`}>
                                      <span>{tx.description || `${tx.type}: ${tx.resourceType}`}</span>
                                      <span className="text-white/30">{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-white/30 text-center py-2">No recent transactions</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* System Logs Mode */
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Status Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] uppercase text-white/40 tracking-wider">CPU Load</span>
                                    <Activity className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div className="text-2xl font-mono text-white">
                                    {vitals ? Math.min(Math.round(vitals.todayCreditsUsed / 10), 99) : 12}%
                                </div>
                                <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400 w-[30%] animate-pulse" />
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] uppercase text-white/40 tracking-wider">Memory</span>
                                    <Cpu className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="text-2xl font-mono text-white">
                                    {vitals ? Math.min(40 + Math.round(vitals.todayTransactions * 2), 95) : 45}%
                                </div>
                                <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-400 w-[60%]" />
                                </div>
                            </div>
                        </div>

                        {/* Active Agents List */}
                        <div className="space-y-2">
                            <div className="text-[10px] uppercase text-white/40 tracking-wider font-semibold">Active Agents</div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                                    <div>
                                        <div className="text-xs font-mono text-white">Commerce Agent</div>
                                        <div className="text-[10px] text-white/40">ID: ca-8821</div>
                                    </div>
                                </div>
                                <Terminal className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
                            </div>
                        </div>

                        {/* Live Terminal */}
                        <div className="rounded-lg bg-black/80 border border-white/10 p-3 font-mono text-[10px] leading-relaxed relative overflow-hidden h-48">
                            <div className="absolute top-0 left-0 right-0 h-6 bg-white/5 border-b border-white/5 flex items-center px-2 gap-1 z-10">
                                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                <span className="ml-2 text-white/30">runner.log</span>
                            </div>
                            <div className="mt-6 space-y-1 h-full overflow-hidden flex flex-col justify-end relative">
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/50 to-transparent h-8 z-10" />
                                {logs.map((log, i) => (
                                    <div key={i} className="text-white/60 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                        <span className="text-cyan-500/50 mr-2">{'>'}</span>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 bg-black/40 text-[10px] text-white/20 text-center font-mono uppercase">
                {viewMode === 'business' ? 'PROFIT_OS v1.0 ONLINE' : 'SYSTEM_SECURE // ENCRYPTED'}
            </div>
        </div>
    );
}
