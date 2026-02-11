'use client'

import { useState, useEffect } from 'react'

interface HandshakeWizardProps {
    isOpen: boolean
    onComplete: () => void
}

type Step = 'welcome' | 'identity' | 'pro' | 'social' | 'utility' | 'success'

export function HandshakeWizard({ isOpen, onComplete }: HandshakeWizardProps) {
    const [step, setStep] = useState<Step>('welcome')
    const [isAnimating, setIsAnimating] = useState(false)
    const [connecting, setConnecting] = useState<string | null>(null)
    const [connected, setConnected] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setIsAnimating(true), 10)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleHandshake = async (service: string) => {
        setConnecting(service)
        // Simulate a "UI-level auth" (SSO/OTP focus)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setConnected(prev => ({ ...prev, [service]: true }))
        setConnecting(null)
    }

    const steps: Record<Step, { title: string; desc: string; icon: string }> = {
        welcome: {
            title: 'The Handshake',
            desc: 'CubiQo needs to know you to help you. Let\'s establish your digital footprint.',
            icon: '🤝'
        },
        identity: {
            title: 'Digital Identity',
            desc: 'Connect your primary work and personal emails.',
            icon: '👤'
        },
        pro: {
            title: 'Professional Life',
            desc: 'Sync your workspace communication.',
            icon: '💼'
        },
        social: {
            title: 'Social Circle',
            desc: 'Link your personal chat and social updates.',
            icon: '💬'
        },
        utility: {
            title: 'Daily Utility',
            desc: 'Connect maps, transport, and delivery apps.',
            icon: '🚗'
        },
        success: {
            title: 'Handshake Complete',
            desc: 'Your digital life is now harmonized with CubiQo.',
            icon: '✨'
        }
    }

    const renderContent = () => {
        switch (step) {
            case 'welcome':
                return (
                    <div className="text-center space-y-6 py-8">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-5xl mx-auto border border-white/10 shadow-2xl">
                            🤝
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-light tracking-tight text-white">Let's shake hands.</h2>
                            <p className="text-white/40 max-w-xs mx-auto text-sm leading-relaxed">
                                Connect your services to turn CubiQo from an AI into your personal shadow.
                            </p>
                        </div>
                        <button
                            onClick={() => setStep('identity')}
                            className="px-8 py-3 bg-white text-black rounded-full font-medium hover:opacity-90 transition-all"
                        >
                            Start Onboarding
                        </button>
                    </div>
                )

            case 'identity':
                return (
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'gmail', name: 'Google Workspace', icon: '📧' },
                                { id: 'outlook', name: 'Microsoft Outlook', icon: '✉️' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleHandshake(item.id)}
                                    disabled={connected[item.id] || connecting === item.id}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${connected[item.id]
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    {connecting === item.id ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : connected[item.id] ? (
                                        <span className="text-xs font-bold uppercase tracking-wider">Linked</span>
                                    ) : (
                                        <span className="text-xs text-white/40 uppercase tracking-wider">Handshake</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button onClick={() => setStep('pro')} className="text-sm text-white/60 hover:text-white underline underline-offset-4">
                                Next: Professional →
                            </button>
                        </div>
                    </div>
                )

            case 'pro':
                return (
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'slack', name: 'Slack Workspace', icon: '💼' },
                                { id: 'teams', name: 'Microsoft Teams', icon: '👥' },
                                { id: 'linkedin', name: 'LinkedIn Professional', icon: '🔗' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleHandshake(item.id)}
                                    disabled={connected[item.id] || connecting === item.id}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${connected[item.id]
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    {connecting === item.id ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : connected[item.id] ? (
                                        <span className="text-xs font-bold uppercase tracking-wider">Linked</span>
                                    ) : (
                                        <span className="text-xs text-white/40 uppercase tracking-wider">Handshake</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-between">
                            <button onClick={() => setStep('identity')} className="text-sm text-white/40">← Back</button>
                            <button onClick={() => setStep('social')} className="text-sm text-white/60 hover:text-white underline underline-offset-4">
                                Next: Social →
                            </button>
                        </div>
                    </div>
                )

            case 'social':
                return (
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
                                { id: 'telegram', name: 'Telegram', icon: '✈️' },
                                { id: 'discord', name: 'Discord', icon: '🎮' },
                                { id: 'x', name: 'X / Twitter', icon: '🐦' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleHandshake(item.id)}
                                    disabled={connected[item.id] || connecting === item.id}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${connected[item.id]
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    {connecting === item.id ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : connected[item.id] ? (
                                        <span className="text-xs font-bold uppercase tracking-wider">Linked</span>
                                    ) : (
                                        <span className="text-xs text-white/40 uppercase tracking-wider">Handshake</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-between">
                            <button onClick={() => setStep('pro')} className="text-sm text-white/40">← Back</button>
                            <button onClick={() => setStep('utility')} className="text-sm text-white/60 hover:text-white underline underline-offset-4">
                                Next: Utility →
                            </button>
                        </div>
                    </div>
                )

            case 'utility':
                return (
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'uber', name: 'Uber Mobility', icon: '🚗' },
                                { id: 'uber_eats', name: 'Uber Eats', icon: '🍱' },
                                { id: 'google_maps', name: 'Google Maps', icon: '🗺️' },
                                { id: 'spotify', name: 'Spotify Music', icon: '🎵' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleHandshake(item.id)}
                                    disabled={connected[item.id] || connecting === item.id}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${connected[item.id]
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    {connecting === item.id ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : connected[item.id] ? (
                                        <span className="text-xs font-bold uppercase tracking-wider">Linked</span>
                                    ) : (
                                        <span className="text-xs text-white/40 uppercase tracking-wider">Handshake</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-between">
                            <button onClick={() => setStep('social')} className="text-sm text-white/40">← Back</button>
                            <button onClick={() => setStep('success')} className="text-sm text-white/90 font-bold hover:scale-105 transition-all">
                                FINISH HANDSHAKE →
                            </button>
                        </div>
                    </div>
                )

            case 'success':
                return (
                    <div className="text-center space-y-6 py-12">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-5xl mx-auto border border-green-500/30 animate-bounce">
                            ✨
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-light text-white">We're Linked.</h2>
                            <p className="text-white/40 max-w-xs mx-auto text-sm">
                                CubiQo is now fully equipped to anticipate your needs across all platforms.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                // 1. Map connected services to BYO toggles
                                const toggleMap: Record<string, string[]> = {
                                    gmail: ['email_read', 'email_send'],
                                    outlook: ['email_read', 'email_send'],
                                    slack: ['slack_read', 'slack_send'],
                                    whatsapp: ['whatsapp_read', 'whatsapp_send'],
                                    telegram: ['telegram_read', 'telegram_send'],
                                    discord: ['discord_read', 'discord_send'],
                                    uber: ['uber_read', 'uber_write'],
                                    google_maps: ['maps_read', 'maps_write'],
                                    spotify: ['spotify']
                                }

                                // 2. Read existing toggles
                                const stored = localStorage.getItem('cubiqo_user_toggles')
                                const currentToggles = stored ? JSON.parse(stored) : {}

                                // 3. Merge new connections
                                Object.keys(connected).forEach(serviceId => {
                                    if (connected[serviceId] && toggleMap[serviceId]) {
                                        toggleMap[serviceId].forEach(key => {
                                            currentToggles[key] = true
                                        })
                                    }
                                })

                                // 4. Save back
                                localStorage.setItem('cubiqo_user_toggles', JSON.stringify(currentToggles))
                                localStorage.setItem('cubiqo_handshake_complete', 'true')

                                // 5. Dispatch storage event to update Settings immediately
                                window.dispatchEvent(new Event('storage'))

                                onComplete()
                            }}
                            className="px-12 py-3 bg-green-600 text-white rounded-full font-medium hover:opacity-90 transition-all shadow-lg shadow-green-500/20"
                        >
                            Enter CubiQo
                        </button>
                    </div>
                )
        }
    }

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 transition-all duration-700 ${isAnimating ? 'opacity-100 backdrop-blur-3xl' : 'opacity-0 backdrop-blur-0'
            }`}>
            <div className="absolute inset-0 bg-black/60" />

            <div className={`relative w-full max-w-md bg-zinc-900/80 border border-white/10 rounded-[32px] overflow-hidden transition-all duration-500 shadow-2xl ${isAnimating ? 'translate-y-0 scale-100' : 'translate-y-20 scale-95'
                }`}>
                {/* Progress Bar */}
                {(step !== 'welcome' && step !== 'success') && (
                    <div className="h-1 w-full bg-white/5">
                        <div
                            className="h-full bg-white transition-all duration-500"
                            style={{
                                width: step === 'identity' ? '25%' : step === 'pro' ? '50%' : step === 'social' ? '75%' : '90%'
                            }}
                        />
                    </div>
                )}

                <div className="p-8">
                    {/* Header (except welcome/success) */}
                    {(step !== 'welcome' && step !== 'success') && (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{steps[step].icon}</span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">{step} handshake</span>
                            </div>
                            <h3 className="text-2xl font-light text-white">{steps[step].title}</h3>
                            <p className="text-sm text-white/40 mt-1">{steps[step].desc}</p>
                        </div>
                    )}

                    {renderContent()}
                </div>
            </div>
        </div>
    )
}
