'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Box, Activity, Zap, X, Minimize2, Maximize2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CodexoPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [activeWorkspaces, setActiveWorkspaces] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const supabase = createClient();

    // Simulated live log stream
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            const phrases = [
                'Running heuristics scan...',
                'Optimizing neural weights...',
                'Allocating memory block 0x4F...',
                'Requesting GPU compute...',
                'Context window refresh...',
                'Analyzing user intent...',
                'Deploying to edge node...'
            ];
            const newLog = `[${new Date().toLocaleTimeString()}] ${phrases[Math.floor(Math.random() * phrases.length)]}`;
            setLogs(prev => [...prev.slice(-20), newLog]);
        }, 2000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Fetch real workspaces
    useEffect(() => {
        if (!isOpen) return;

        // In a real app, use Supabase Realtime subscription
        const fetchWorkspaces = async () => {
            const { data } = await supabase
                .from('emergent_workspaces')
                .select('*')
                .eq('status', 'running')
                .limit(5);

            if (data) setActiveWorkspaces(data);
        };

        fetchWorkspaces();
        const interval = setInterval(fetchWorkspaces, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all duration-300 group z-50"
            >
                <div className="relative">
                    <Box className="w-6 h-6 text-cyan-400 group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
            </button>
        );
    }

    return (
        <div
            className={`fixed right-4 transition-all duration-500 ease-out z-50 overflow-hidden
        ${isMaximized ? 'top-4 bottom-4 w-[600px]' : 'bottom-4 top-auto h-[500px] w-80'}
        rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl
      `}
            style={{
                boxShadow: '0 0 40px rgba(0, 229, 255, 0.1), inset 0 0 20px rgba(0, 229, 255, 0.05)'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                    <span className="font-mono text-sm font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                        CODEXO LIVE
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

            {/* Content */}
            <div className="p-4 space-y-4 h-[calc(100%-60px)] overflow-y-auto custom-scrollbar">

                {/* Status Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] uppercase text-white/40 tracking-wider">CPU Load</span>
                            <Activity className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-2xl font-mono text-white">
                            {Math.floor(Math.random() * 30 + 10)}%
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
                            {Math.floor(Math.random() * 20 + 40)}%
                        </div>
                        <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-400 w-[60%]" />
                        </div>
                    </div>
                </div>

                {/* Active Agents List */}
                <div className="space-y-2">
                    <div className="text-[10px] uppercase text-white/40 tracking-wider font-semibold">
                        Active Agents ({activeWorkspaces.length})
                    </div>

                    {activeWorkspaces.length === 0 ? (
                        <div className="p-4 rounded-lg border border-dashed border-white/10 text-center text-xs text-white/30 italic">
                            No active agents detected
                        </div>
                    ) : (
                        activeWorkspaces.map((ws) => (
                            <div key={ws.id} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    <div>
                                        <div className="text-xs font-mono text-white group-hover:text-cyan-400 transition-colors">
                                            {ws.subdomain || ws.workspace_id}
                                        </div>
                                        <div className="text-[10px] text-white/40">
                                            ID: {ws.id.substring(0, 8)}
                                        </div>
                                    </div>
                                </div>
                                <Terminal className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
                            </div>
                        ))
                    )}
                </div>

                {/* Live Terminal */}
                <div className="rounded-lg bg-black/80 border border-white/10 p-3 font-mono text-[10px] leading-relaxed relative overflow-hidden h-48">
                    <div className="absolute top-0 left-0 right-0 h-6 bg-white/5 border-b border-white/5 flex items-center px-2 gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                        <div className="w-2 h-2 rounded-full bg-green-500/50" />
                        <span className="ml-2 text-white/30">runner.log</span>
                    </div>
                    <div className="mt-6 space-y-1 h-full overflow-hidden flex flex-col justify-end">
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/50 to-transparent h-8 z-10" />
                        {logs.map((log, i) => (
                            <div key={i} className="text-white/60 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <span className="text-cyan-500/50 mr-2">{'>'}</span>
                                {log}
                            </div>
                        ))}
                        <div className="w-2 h-4 bg-cyan-500/50 animate-pulse inline-block" />
                    </div>
                </div>

            </div>
        </div>
    );
}
