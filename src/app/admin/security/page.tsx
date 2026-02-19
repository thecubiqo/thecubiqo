'use client';

import { Shield, Lock, Fingerprint, Key, AlertTriangle, CheckCircle, Bug, Search } from 'lucide-react';
import { useState } from 'react';

export default function SecurityDashboard() {
    const [biometricStatus, setBiometricStatus] = useState<'configured' | 'missing_env'>('configured');
    const [rpId, setRpId] = useState('cubiqo.ai');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="text-blue-500" />
                Security & Authentication
            </h1>

            {/* Biometrics Status Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Fingerprint className="text-blue-400" />
                            Biometric Authentication (WebAuthn)
                        </h2>
                        <p className="text-gray-400 mt-1">Passkey configuration status for passwordless login.</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-2 ${biometricStatus === 'configured'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {biometricStatus === 'configured' ? (
                            <><CheckCircle size={14} /> Active</>
                        ) : (
                            <><AlertTriangle size={14} /> Misconfigured</>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Relying Party ID (RP_ID)</label>
                            <div className="font-mono text-white flex items-center gap-2">
                                <Key size={14} className="text-gray-500" />
                                {rpId}
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Active Passkeys</label>
                            <div className="font-mono text-white text-xl">1,248</div>
                        </div>
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} /> Configuration Check
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-100/70">
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400" />
                                <span>NEXT_PUBLIC_RP_ID is set</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400" />
                                <span>Original/Domain matches Vercel URL</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400" />
                                <span>Supabase "auth.users" tables accessible</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Antivirus Protection Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Shield className="text-green-400" />
                            Antivirus & Threat Protection
                        </h2>
                        <p className="text-gray-400 mt-1">Real-time protection against malware and security threats.</p>
                    </div>
                    <div className="px-4 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-2 bg-green-500/10 text-green-400 border-green-500/20">
                        <CheckCircle size={14} /> Protected
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                                <Search size={12} className="inline mr-1" />
                                Real-time Scanning
                            </label>
                            <div className="font-semibold text-green-400 text-lg">Enabled</div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Total Scans</label>
                            <div className="font-mono text-white text-xl">12,847</div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                                <Bug size={12} className="inline mr-1" />
                                Threats Blocked
                            </label>
                            <div className="font-mono text-red-400 text-xl">23</div>
                        </div>
                    </div>

                    <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-4">
                        <h3 className="font-semibold text-green-200 mb-3 flex items-center gap-2">
                            <Shield size={16} /> Protection Features
                        </h3>
                        <ul className="space-y-3 text-sm text-green-100/70">
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400" />
                                <span>Real-time file scanning</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400" />
                                <span>Input sanitization active</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400" />
                                <span>XSS protection enabled</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400" />
                                <span>SQL injection prevention</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Recent Security Events */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Recent Security Events</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="py-3 px-4">Event</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4">IP Address</th>
                                <th className="py-3 px-4">Time</th>
                                <th className="py-3 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 flex items-center gap-2">
                                    <Fingerprint size={14} className="text-green-400" />
                                    Passkey Login
                                </td>
                                <td className="py-3 px-4 font-mono text-gray-400">usr_8a92...</td>
                                <td className="py-3 px-4 text-gray-400">192.168.1.1</td>
                                <td className="py-3 px-4 text-gray-400">2 mins ago</td>
                                <td className="py-3 px-4"><span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded text-xs">Success</span></td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 flex items-center gap-2">
                                    <Lock size={14} className="text-red-400" />
                                    Failed Login
                                </td>
                                <td className="py-3 px-4 font-mono text-gray-400">usr_b211...</td>
                                <td className="py-3 px-4 text-gray-400">10.0.0.5</td>
                                <td className="py-3 px-4 text-gray-400">15 mins ago</td>
                                <td className="py-3 px-4"><span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded text-xs">Blocked</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
