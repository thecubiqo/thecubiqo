'use client';

import { Settings, Server, Key, Zap } from 'lucide-react';

interface EnvInfo {
    key: string;
    label: string;
    present: boolean;
}

const ENV_CHECKS: EnvInfo[] = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', present: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL1) },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key', present: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1) },
    { key: 'NEXT_PUBLIC_RP_ID', label: 'WebAuthn RP ID', present: !!process.env.NEXT_PUBLIC_RP_ID },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="text-gray-400" />
                Settings
            </h1>

            {/* Environment Config */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Server size={18} className="text-gray-400" />
                    Environment Configuration
                </h2>
                <ul className="space-y-3">
                    {ENV_CHECKS.map((item) => (
                        <li key={item.key} className="flex items-center justify-between py-2 border-b border-white/5">
                            <div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs font-mono text-gray-500">{item.key}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                item.present
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                                {item.present ? '✓ Set' : '✗ Missing'}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Quick Links */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-gray-400" />
                    Quick Links
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <a href="/admin/feature-flags" className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                        <Key size={16} className="text-orange-400" /> Feature Flags
                    </a>
                    <a href="/admin/designs" className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                        <Settings size={16} className="text-blue-400" /> Design Toggles
                    </a>
                    <a href="/admin/security" className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                        <Server size={16} className="text-green-400" /> Security
                    </a>
                    <a href="/admin/self-heal" className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                        <Zap size={16} className="text-purple-400" /> Self-Heal Reports
                    </a>
                </div>
            </div>
        </div>
    );
}
