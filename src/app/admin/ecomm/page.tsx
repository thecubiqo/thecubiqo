'use client';

import { useState } from 'react';
import { ShoppingBag, CreditCard, Truck, Settings, PackageOpen, Zap, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function EcommAdminPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'fulfillment' | 'integrations'>('overview');

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                            <ShoppingBag className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight">Merchandise Operations</h1>
                            <p className="text-white/40 text-sm">Store orchestration, fulfillment, and brand management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" /> Live Store
                        </button>
                        <button className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] px-6 py-2 rounded-lg text-sm font-bold tracking-wide uppercase transition-all">
                            Launch Campaign
                        </button>
                    </div>
                </div>

                {/* Global Navigation */}
                <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl w-max">
                    {(['overview', 'products', 'fulfillment', 'integrations'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Dynamic Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-white/50 font-bold uppercase tracking-widest text-xs">Gross Revenue</h3>
                                    <div className="text-3xl font-black mt-1">$4,291.50</div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                    <Zap className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-xs text-green-400 flex items-center gap-1">
                                ↑ 14% vs last week
                            </p>
                        </div>

                        <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-white/50 font-bold uppercase tracking-widest text-xs">Active Orders</h3>
                                    <div className="text-3xl font-black mt-1">28</div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <PackageOpen className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-xs text-white/40 flex items-center gap-1">
                                12 unfulfilled
                            </p>
                        </div>

                        <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-white/50 font-bold uppercase tracking-widest text-xs">Fulfillment Health</h3>
                                    <div className="text-3xl font-black mt-1">98.2%</div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                                    <Truck className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-xs text-white/40 flex items-center gap-1">
                                Avg time: 1.2 days
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'integrations' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                                        <span className="text-[#635BFF] font-black text-xl">S</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Stripe Payments</h3>
                                        <p className="text-sm text-green-400 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Connected
                                        </p>
                                    </div>
                                </div>
                                <button className="text-white/50 hover:text-white"><Settings className="w-5 h-5" /></button>
                            </div>
                            <p className="text-sm text-white/50 mb-6">Handles all credit card transactions, fraud prevention, and global payouts for your merchandise.</p>
                            <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold transition-all">
                                Manage Keys
                            </button>
                        </div>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                                        <span className="text-white font-black text-xl">P</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Printful Print-on-Demand</h3>
                                        <p className="text-sm text-yellow-400 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Requires Setup
                                        </p>
                                    </div>
                                </div>
                                <button className="text-white/50 hover:text-white"><Settings className="w-5 h-5" /></button>
                            </div>
                            <p className="text-sm text-white/50 mb-6">Automated drop-shipping for premium clothing items. Fulfills orders globally directly to the customer.</p>
                            <button className="w-full py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 rounded-lg text-sm font-bold transition-all">
                                Connect API Key
                            </button>
                        </div>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                                        <span className="text-white font-black text-xl">S</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Shopify Storefront (Optional)</h3>
                                        <p className="text-sm text-white/30 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-white/20"></span> Unlinked
                                        </p>
                                    </div>
                                </div>
                                <button className="text-white/50 hover:text-white"><Settings className="w-5 h-5" /></button>
                            </div>
                            <p className="text-sm text-white/50 mb-6">Use Shopify as a headless backend instead of native Stripe integrations for advanced inventory management.</p>
                            <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold transition-all">
                                Link Store
                            </button>
                        </div>
                    </div>
                )}

                {/* Coming soon states for other tabs */}
                {(activeTab === 'products' || activeTab === 'fulfillment') && (
                    <div className="py-24 text-center border border-white/10 border-dashed rounded-3xl bg-white/[0.02]">
                        <PackageOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Connect a Fulfillment Provider</h2>
                        <p className="text-white/40 max-w-md mx-auto mb-6">To manage products and fulfillment directly from this dashboard, link your Printful or Shopify account first.</p>
                        <button onClick={() => setActiveTab('integrations')} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg text-sm font-bold transition-all">
                            Go to Integrations
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
