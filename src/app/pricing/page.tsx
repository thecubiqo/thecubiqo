'use client';

import { Check, Shield, Zap, Globe, Cpu, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TIERS = [
    {
        name: 'Free',
        price: '$0',
        description: 'Explore the Cube',
        features: [
            '50 Messages / Day',
            'Standard Response Speed',
            'Basic Voice Mode',
            'Community Support'
        ],
        cta: 'Start Free',
        href: '/login',
        popular: false,
        tierKey: 'free'
    },
    {
        name: 'Pro',
        price: '$29',
        period: '/mo',
        description: 'Unlock Full Power',
        features: [
            'Unlimited GPT-4 / Claude equivalent',
            'Priority Voice Mode (10 hours)',
            '5 Custom Agent Personas',
            'Early Access to Features'
        ],
        cta: 'Upgrade to Pro',
        href: '#',
        popular: true,
        tierKey: 'pro'
    },
    {
        name: 'Commander',
        price: '$499',
        period: '/mo',
        description: 'Social Army Access',
        features: [
            '10 Automated Social Accounts',
            '1,000 Auto-Posts / Month',
            'Dedicated Content Factory',
            'Priority Email Support'
        ],
        cta: 'Deploy Army',
        href: '#',
        popular: false,
        special: true,
        tierKey: 'commander'
    }
];

export default function PricingPage() {
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const router = useRouter();

    const handleCheckout = async (tierKey: string, href: string) => {
        if (tierKey === 'free') {
            router.push(href);
            return;
        }

        setLoadingTier(tierKey);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tierKey })
            });
            const data = await res.json();

            if (res.ok && data.url) {
                window.location.href = data.url;
            } else if (res.status === 401) {
                router.push('/login?next=/pricing');
            } else {
                console.error('Checkout error:', data.error);
                alert('Failed to initiate checkout: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Checkout failed', error);
        } finally {
            setLoadingTier(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-4">
                        Choose Your Intelligence Level
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        From casual exploration to automated social domination. Scale with CubiQo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {TIERS.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative rounded-2xl p-8 transition-all duration-300 ${tier.popular
                                ? 'bg-white/10 border-2 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.15)] scale-105 z-10'
                                : tier.special
                                    ? 'bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-orange-500/50'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/[0.07]'
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    Most Popular
                                </div>
                            )}
                            {tier.special && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                                    <Globe size={12} /> Social Army
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{tier.price}</span>
                                    {tier.period && <span className="text-gray-400 text-sm">{tier.period}</span>}
                                </div>
                                <p className="text-sm text-gray-400 mt-2">{tier.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                                        <Check size={18} className={`shrink-0 ${tier.special ? 'text-orange-500' : 'text-purple-400'}`} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout(tier.tierKey, tier.href)}
                                disabled={loadingTier !== null}
                                className={`block flex items-center justify-center w-full py-3 px-6 rounded-xl text-center font-bold transition-all ${tier.popular
                                        ? 'bg-white text-black hover:bg-gray-200'
                                        : tier.special
                                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-orange-500/25 shadow-lg'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                    } ${(loadingTier !== null && loadingTier !== tier.tierKey) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loadingTier === tier.tierKey ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : tier.cta}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center border-t border-white/10 pt-10">
                    <p className="text-gray-500 text-sm mb-4">TRUSTED BY INNOVATORS AT</p>
                    <div className="flex justify-center gap-8 opacity-40 grayscale">
                        {/* Logos could go here */}
                        <div className="font-bold text-xl">ACME Corp</div>
                        <div className="font-bold text-xl">Globex</div>
                        <div className="font-bold text-xl">Soylent</div>
                        <div className="font-bold text-xl">Umbrella</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
