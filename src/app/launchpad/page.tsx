'use client';

import React, { useState } from 'react';
import { Shield, Key, Check, Zap, Server, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type IntegrationStatus = 'idle' | 'loading' | 'connected' | 'error';

interface IntegrationState {
  apiKey: string;
  status: IntegrationStatus;
  message: string;
}

const INTEGRATIONS = [
    { id: 'shopify', name: 'Shopify', icon: Globe, desc: 'Storefront & Inventory' },
    { id: 'printify', name: 'Printify', icon: Server, desc: 'Global Fulfillment' },
    { id: 'klaviyo', name: 'Klaviyo', icon: Zap, desc: 'Email Automation' },
    { id: 'tiktok', name: 'TikTok Shop', icon: Zap, desc: 'Viral Sales Channel' },
    { id: 'meta', name: 'Meta Ads', icon: Zap, desc: 'Traffic Engine' },
];

const DEFAULT_STATE: IntegrationState = { apiKey: '', status: 'idle', message: '' };

export default function LaunchpadPage() {
    const [states, setStates] = useState<Record<string, IntegrationState>>(
        Object.fromEntries(INTEGRATIONS.map(s => [s.id, { ...DEFAULT_STATE }]))
    );

    const updateState = (id: string, patch: Partial<IntegrationState>) =>
        setStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

    const handleConnect = async (serviceId: string) => {
        const apiKey = states[serviceId]?.apiKey ?? '';
        if (!apiKey.trim()) {
            updateState(serviceId, { status: 'error', message: 'Please enter an API key.' });
            return;
        }

        updateState(serviceId, { status: 'loading', message: '' });
        try {
            // Store the key securely via the integrations connect API
            const res = await fetch('/api/integrations/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service: serviceId, apiKey }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || `Failed to connect (${res.status})`);
            }

            updateState(serviceId, { status: 'connected', message: 'Connected successfully.' });
        } catch (err) {
            updateState(serviceId, {
                status: 'error',
                message: err instanceof Error ? err.message : 'Connection failed. Try again.',
            });
        }
    };

    const connectedCount = Object.values(states).filter(s => s.status === 'connected').length;

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
                    {INTEGRATIONS.map((service, index) => {
                        const state = states[service.id];
                        const isConnected = state.status === 'connected';
                        const isLoading = state.status === 'loading';
                        const isError = state.status === 'error';

                        return (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`group relative p-6 border rounded-xl transition-all ${
                                    isConnected
                                        ? 'bg-cyan-950/30 border-cyan-500/40'
                                        : 'bg-white/5 border-white/5 hover:border-cyan-500/30 hover:bg-white/10'
                                }`}
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
                                    <div className={`h-2 w-2 rounded-full transition-colors ${
                                        isConnected ? 'bg-cyan-400' : 'bg-white/10 group-hover:bg-cyan-500'
                                    }`} />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-4 w-4 text-white/20" />
                                    </div>
                                    <input
                                        type="password"
                                        value={state.apiKey}
                                        onChange={(e) => updateState(service.id, { apiKey: e.target.value, status: 'idle', message: '' })}
                                        placeholder={`Enter ${service.name} API Key`}
                                        disabled={isConnected || isLoading}
                                        className="block w-full pl-10 pr-20 py-3 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        onClick={() => handleConnect(service.id)}
                                        disabled={isConnected || isLoading}
                                        className="absolute right-1 top-1 bottom-1 px-4 bg-white/10 hover:bg-cyan-500/20 text-white/60 hover:text-cyan-400 text-xs font-bold rounded-md transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : isConnected ? (
                                            <Check className="w-3 h-3 text-cyan-400" />
                                        ) : (
                                            'Link'
                                        )}
                                    </button>
                                </div>

                                {/* Status message */}
                                {(isConnected || isError) && (
                                    <div className={`mt-2 flex items-center gap-1.5 text-xs ${isConnected ? 'text-cyan-400' : 'text-red-400'}`}>
                                        {isConnected ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                        {state.message}
                                    </div>
                                )}

                                {/* Encryption indicator */}
                                <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/20 group-hover:text-white/40 transition-colors">
                                    <Shield className="w-3 h-3" />
                                    Encryption: AES-256-GCM
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Final Action */}
                <div className="mt-12 text-center">
                    <button
                        disabled={connectedCount === 0}
                        className="px-12 py-5 bg-gradient-to-r from-cyan-600 to-green-600 text-white font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(0,255,170,0.4)] transition-all uppercase tracking-widest flex items-center gap-3 mx-auto disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Zap className="w-5 h-5 fill-white" />
                        Launch Business Suite
                        {connectedCount > 0 && (
                            <span className="text-sm font-normal normal-case tracking-normal text-white/70">
                                ({connectedCount}/{INTEGRATIONS.length} connected)
                            </span>
                        )}
                    </button>
                    <p className="mt-4 text-xs text-white/20 font-mono">
                        By launching, you authorize the Commerce Agent to manage inventory and fulfillment.
                    </p>
                </div>

            </div>
        </div>
    );
}
