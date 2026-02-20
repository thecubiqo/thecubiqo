'use client';

import { Shield, Lock, Fingerprint, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EnvCheck {
    label: string;
    passed: boolean;
}

interface SecurityEvent {
    id: string;
    user_email: string | null;
    action_type: string;
    ip_address: string | null;
    created_at: string;
}

interface SecurityData {
    passkeyCount: number;
    rpId: string;
    biometricStatus: 'configured' | 'missing_env';
    envChecks: EnvCheck[];
    recentEvents: SecurityEvent[];
}

function maskEmail(email: string): string {
    const atIdx = email.indexOf('@');
    if (atIdx <= 0) return '***';
    const local = email.slice(0, atIdx);
    const domain = email.slice(atIdx);
    if (local.length <= 3) return local[0] + '**' + domain;
    return local.slice(0, 3) + '*'.repeat(local.length - 3) + domain;
}

(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function SecurityDashboard() {
    const [data, setData] = useState<SecurityData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/security')
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const biometricStatus = data?.biometricStatus ?? 'missing_env';
    const rpId = data?.rpId ?? '—';
    const passkeyCount = data?.passkeyCount ?? 0;
    const envChecks = data?.envChecks ?? [];
    const recentEvents = data?.recentEvents ?? [];

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
                                {loading ? '…' : rpId}
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Active Passkeys</label>
                            <div className="font-mono text-white text-xl">
                                {loading ? '…' : passkeyCount.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} /> Configuration Check
                        </h3>
                        {loading ? (
                            <p className="text-sm text-gray-500">Loading…</p>
                        ) : (
                            <ul className="space-y-2 text-sm text-blue-100/70">
                                {envChecks.map((check, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        {check.passed ? (
                                            <CheckCircle size={14} className="text-green-400 shrink-0" />
                                        ) : (
                                            <AlertTriangle size={14} className="text-red-400 shrink-0" />
                                        )}
                                        <span>{check.label}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Security Events */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Recent Security Events</h2>
                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="text-sm text-gray-500 py-4">Loading events…</p>
                    ) : recentEvents.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4">No security events recorded yet.</p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-400 text-sm">
                                    <th className="py-3 px-4">Event</th>
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">IP Address</th>
                                    <th className="py-3 px-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {recentEvents.map((event) => (
                                    <tr key={event.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 flex items-center gap-2">
                                            {event.action_type.includes('login') || event.action_type.includes('webauthn') ? (
                                                <Fingerprint size={14} className="text-blue-400 shrink-0" />
                                            ) : (
                                                <Lock size={14} className="text-gray-400 shrink-0" />
                                            )}
                                            <span className="font-mono text-xs">{event.action_type}</span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-gray-400 text-xs">
                                            {event.user_email ? maskEmail(event.user_email) : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-400">{event.ip_address ?? '—'}</td>
                                        <td className="py-3 px-4 text-gray-400">{formatRelativeTime(event.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
