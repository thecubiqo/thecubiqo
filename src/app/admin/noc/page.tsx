'use client';

import { useState, useEffect } from 'react';
import { Terminal, Shield, Cpu, Activity } from 'lucide-react';

interface Agent {
    id: string;
    name: string;
    status: 'active' | 'idle' | 'offline' | 'error';
    model: string;
    uptime: string;
    cpu: number;
    memory: number;
}

export default function NOCDashboard() {
    const [agents, setAgents] = useState<Agent[]>([
        { id: 'agt-01', name: 'Orchestrator', status: 'active', model: 'Gemini 1.5 Pro', uptime: '4d 12h', cpu: 45, memory: 128 },
        { id: 'agt-02', name: 'Coding Agent', status: 'idle', model: 'Claude 3.5 Sonnet', uptime: '1d 4h', cpu: 12, memory: 512 },
        { id: 'agt-03', name: 'Memory Agent', status: 'active', model: 'Gemini 1.5 Flash', uptime: '4d 12h', cpu: 28, memory: 256 },
        { id: 'agt-04', name: 'Marketing Agent', status: 'offline', model: 'GPT-4o', uptime: '0h', cpu: 0, memory: 0 },
    ]);

    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        // Simulate log stream
        const interval = setInterval(() => {
            const newLog = `[${new Date().toISOString()}] INFO: Heartbeat received from agt-01`;
            setLogs(prev => [newLog, ...prev.slice(0, 19)]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="text-orange-500" />
                    Network Operations Center
                </h1>
                <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/20 flex items-center gap-2">
                    <Shield size={16} />
                    Emergency Shutdown
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Grid */}
                <div className="space-y-4">
                    {agents.map(agent => (
                        <div key={agent.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-500 animate-pulse' : agent.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                <div>
                                    <h3 className="font-bold text-lg">{agent.name}</h3>
                                    <p className="text-xs text-gray-400 font-mono">{agent.id} • {agent.model}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-400">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs uppercase tracking-wider">Uptime</span>
                                    <span className="font-mono text-white">{agent.uptime}</span>
                                </div>
                                <div className="flex flex-col items-end w-20">
                                    <span className="text-xs uppercase tracking-wider flex items-center gap-1"><Cpu size={10} /> Load</span>
                                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-1">
                                        <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${agent.cpu}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" title="Restart">
                                    <Activity size={16} />
                                </button>
                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" title="Logs">
                                    <Terminal size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live Logs Console */}
                <div className="bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-xs text-green-400 h-[600px] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                        <span className="flex items-center gap-2"><Terminal size={14} /> SYSTEM.LOG</span>
                        <span className="text-gray-500">Live Stream</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                        {logs.map((log, i) => (
                            <div key={i} className="opacity-80 hover:opacity-100 transition-opacity">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
