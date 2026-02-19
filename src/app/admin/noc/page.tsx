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

interface AdminStatsAgent {
    id: string;
    name: string;
    status: string;
    model: string;
    activeTasks: number;
    totalTasks: number;
    createdAt: string;
    updatedAt: string;
}

interface SystemEvent {
    sessionId: string;
    agentId: string;
    channel: string;
    status: string;
    messageCount: number;
    updatedAt: string;
}

function formatUptime(createdAt: string): string {
    const ms = Date.now() - new Date(createdAt).getTime();
    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((totalSecs % 3600) / 60);
    return `${hours}h ${mins}m`;
}

function mapStatus(status: string): Agent['status'] {
    if (status === 'running') return 'active';
    if (status === 'idle') return 'idle';
    if (status === 'error') return 'error';
    return 'offline';
}

export default function NOCDashboard() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (!res.ok) return;
            const data = await res.json();

            const mapped: Agent[] = (data.agents as AdminStatsAgent[]).map(a => ({
                id: a.id,
                name: a.name,
                status: mapStatus(a.status),
                model: a.model,
                uptime: formatUptime(a.createdAt),
                cpu: a.activeTasks,
                memory: a.totalTasks,
            }));
            setAgents(mapped);

            // Build log lines from recent activity
            const activityLogs: string[] = (data.recentActivity as SystemEvent[]).map(
                (ev) =>
                    `[${new Date(ev.updatedAt).toISOString()}] INFO: ${ev.agentId} — ${ev.channel} session ${ev.sessionId.slice(0, 8)} (${ev.status}, ${ev.messageCount} msgs)`
            );
            setLogs(activityLogs.slice(0, 20));
        } catch {
            // silently handle
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
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
                    {loading ? (
                        <p className="text-sm text-gray-500">Loading agents…</p>
                    ) : agents.length === 0 ? (
                        <p className="text-sm text-gray-500">No agents running.</p>
                    ) : (
                        agents.map(agent => (
                            <div key={agent.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-500 animate-pulse' : agent.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                    <div>
                                        <h3 className="font-bold text-lg">{agent.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono">{agent.id.slice(0, 8)}… • {agent.model}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-sm text-gray-400">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs uppercase tracking-wider">Uptime</span>
                                        <span className="font-mono text-white">{agent.uptime}</span>
                                    </div>
                                    <div className="flex flex-col items-end w-20">
                                        <span className="text-xs uppercase tracking-wider flex items-center gap-1"><Cpu size={10} /> Tasks</span>
                                        <span className="font-mono text-white text-xs">{agent.cpu}/{agent.memory}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Live Activity Console */}
                <div className="bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-xs text-green-400 h-[600px] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                        <span className="flex items-center gap-2"><Terminal size={14} /> ACTIVITY.LOG</span>
                        <span className="text-gray-500">Live Stream</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                        {logs.length === 0 ? (
                            <div className="text-gray-600">No recent activity…</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="opacity-80 hover:opacity-100 transition-opacity">
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
