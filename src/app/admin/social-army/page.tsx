'use client';

import { useState } from 'react';
import {
    Globe,
    Users,
    Tv,
    MessageSquare,
    Code,
    Zap,
    AlertTriangle,
    CheckCircle,
    Play
} from 'lucide-react';

interface PersonaGroup {
    id: string;
    name: string;
    count: number;
    status: 'active' | 'warning' | 'offline';
    icon: any;
    description: string;
}

export default function SocialArmyConsole() {
    const [isDeploying, setIsDeploying] = useState(false);
    const [personas, setPersonas] = useState<PersonaGroup[]>([
        { id: 'builders', name: 'The Builders', count: 20, status: 'active', icon: Code, description: 'Coding tutorials, GitHub commits, architecture diagrams' },
        { id: 'gurus', name: 'Productivity Gurus', count: 30, status: 'active', icon: Zap, description: 'Workflow hacks, time-saving tips, tool comparisons' },
        { id: 'skeptics', name: 'The Philosophers', count: 15, status: 'active', icon: MessageSquare, description: 'AI ethics debates, deep threads, controversy' },
        { id: 'artists', name: 'Visual Artists', count: 20, status: 'warning', icon: Tv, description: '3D renders, abstract UI, calm animations' },
        { id: 'memers', name: 'The Memelords', count: 15, status: 'offline', icon: Users, description: 'High-energy chaos, reaction videos, trends' },
    ]);

    const handleLaunch = () => {
        setIsDeploying(true);
        setTimeout(() => setIsDeploying(false), 3000);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="text-purple-500" />
                        Social Army Command Center
                    </h1>
                    <p className="text-gray-400 mt-1">Manage 100 decentralized accounts across 5 strategic personas.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        System Online
                    </div>
                    <button
                        onClick={handleLaunch}
                        disabled={isDeploying}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${isDeploying
                                ? 'bg-purple-500/50 cursor-wait'
                                : 'bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-white'
                            }`}
                    >
                        {isDeploying ? 'Syncing...' : <><Play size={18} fill="currentColor" /> Deploy Campaign</>}
                    </button>
                </div>
            </div>

            {/* Main Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {personas.map(persona => (
                    <div key={persona.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-20 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-500/10 transition-colors" />

                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 text-purple-400">
                                <persona.icon size={20} />
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${persona.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                    persona.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {persona.status}
                            </div>
                        </div>

                        <h3 className="font-bold text-lg mb-1">{persona.name}</h3>
                        <p className="text-xs text-gray-400 mb-4 h-8">{persona.description}</p>

                        <div className="flex items-end justify-between border-t border-white/5 pt-4">
                            <div>
                                <span className="text-2xl font-mono font-bold">{persona.count}</span>
                                <span className="text-xs text-gray-500 ml-1">accounts</span>
                            </div>
                            <button className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                                Manage →
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Console Output / Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-xs">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                        <span className="text-gray-400">LIVE FEED // CONTENT_GENERATION_QUEUE</span>
                        <span className="text-green-500">running</span>
                    </div>
                    <div className="space-y-2 text-gray-300">
                        <div className="flex gap-3">
                            <span className="text-gray-600">[19:42:01]</span>
                            <span className="text-purple-400">CMD</span>
                            <span>Generating video asset: "Self-Healing Architecture" (Variant B/Guru)</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-gray-600">[19:42:05]</span>
                            <span className="text-blue-400">VEO</span>
                            <span>Rendering 15s clip... [||||||||||] 100%</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-gray-600">[19:42:12]</span>
                            <span className="text-yellow-400">PUPPETEER</span>
                            <span>Simulating user login (usr_test_99) for UI capture...</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-gray-600">[19:42:15]</span>
                            <span className="text-green-400">POST</span>
                            <span>Success: Account @DevDave_99 (Twitter) posted status ID #88219</span>
                        </div>
                        <div className="flex gap-3 text-gray-500">
                            <span>... waiting for next schedule slot (19:50:00)</span>
                        </div>
                    </div>
                </div>

                {/* Quick Config */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-yellow-500" />
                        Configuration
                    </h3>

                    <div className="space-y-4">
                        <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                            <label className="text-xs text-gray-500 block mb-1">Total Daily Posts</label>
                            <div className="text-xl font-mono">6,000</div>
                        </div>

                        <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                            <label className="text-xs text-gray-500 block mb-1">Content Diversity</label>
                            <div className="text-xl font-mono">High (5 Personas)</div>
                        </div>

                        <div className="pt-2">
                            <a
                                href="/admin/settings"
                                className="block w-full text-center py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                            >
                                Launch Puppeteer Config
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
