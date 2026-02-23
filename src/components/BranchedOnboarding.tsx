'use client'

/**
 * TFR-014: 5-Branch Onboarding Flow
 * 
 * Users self-select their intent on step 1, which personalises the entire
 * onboarding experience and sets their default RGY zone + voice persona.
 *
 * Branches:
 *   1. Solopreneur — TEAL zone, productivity tools
 *   2. Developer    — TEAL zone, code/emergent focus
 *   3. Hustler      — RED/ORANGE, social army + commerce
 *   4. Companion    — YELLOW zone, personal/emotional
 *   5. Privacy-First — TEAL, BYO models, zero cloud
 */

import { useState } from 'react'
import type { RGYZone } from '@/config/voices'

// ─── Branch Definitions ───────────────────────────────────────────────────────

export type OnboardingIntent =
    | 'solopreneur'
    | 'developer'
    | 'hustler'
    | 'companion'
    | 'privacy'

export interface OnboardingPath {
    id: OnboardingIntent
    emoji: string
    label: string
    tagline: string
    defaultZone: RGYZone
    features: string[]
    firstPrompt: string
}

export const ONBOARDING_PATHS: OnboardingPath[] = [
    {
        id: 'solopreneur',
        emoji: '⚡',
        label: 'Solopreneur',
        tagline: 'Run your business like a 10-person team',
        defaultZone: 'TEAL',
        features: ['Job Hunt AI', 'Social Army', 'Emergent Studio', 'Journal'],
        firstPrompt: 'Tell me about your business and the #1 thing slowing you down.'
    },
    {
        id: 'developer',
        emoji: '🧠',
        label: 'Developer',
        tagline: 'Ship faster with an AI coding co-pilot',
        defaultZone: 'TEAL',
        features: ['Emergent Studio', 'Code Execution', 'Git Integration', 'Debugging'],
        firstPrompt: 'What stack are you building on? Let\'s get your first project set up.'
    },
    {
        id: 'hustler',
        emoji: '🔥',
        label: 'Hustler',
        tagline: 'Automate outreach, content, and growth',
        defaultZone: 'ORANGE',
        features: ['Social Army (10-10-10)', 'Commerce', 'Affiliate Tools', 'Analytics'],
        firstPrompt: 'What are you selling and where is your audience right now?'
    },
    {
        id: 'companion',
        emoji: '💛',
        label: 'Companion',
        tagline: 'A friend who actually listens',
        defaultZone: 'YELLOW',
        features: ['Empathy Chat', 'Journal', 'Daily Check-ins', 'Memory'],
        firstPrompt: 'How are you doing today — really?'
    },
    {
        id: 'privacy',
        emoji: '🔒',
        label: 'Privacy-First',
        tagline: 'Your data never leaves your device',
        defaultZone: 'TEAL',
        features: ['BYO API Keys', 'Local Models', 'Zero Cloud Mode', 'Encrypted Memory'],
        firstPrompt: 'Let\'s set up your local model. Do you have Ollama or an API key ready?'
    }
]

// ─── Component ────────────────────────────────────────────────────────────────

export interface OnboardingData {
    intent: OnboardingIntent
    defaultZone: RGYZone
    firstPrompt: string
    name?: string
    features: string[]
}

interface BranchedOnboardingProps {
    onComplete: (data: OnboardingData) => void
    onSkip?: () => void
}

export default function BranchedOnboarding({ onComplete, onSkip }: BranchedOnboardingProps) {
    const [step, setStep] = useState<'intent' | 'name' | 'features'>('intent')
    const [selectedPath, setSelectedPath] = useState<OnboardingPath | null>(null)
    const [name, setName] = useState('')

    const handleSelectPath = (path: OnboardingPath) => {
        setSelectedPath(path)
        setStep('name')
    }

    const handleComplete = () => {
        if (!selectedPath) return
        onComplete({
            intent: selectedPath.id,
            defaultZone: selectedPath.defaultZone,
            firstPrompt: selectedPath.firstPrompt,
            name: name.trim() || undefined,
            features: selectedPath.features
        })
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">

                {step === 'intent' && (
                    <div>
                        <div className="text-center mb-10">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">
                                ✦
                            </div>
                            <h1 className="text-3xl font-black text-white mb-2">Welcome to CubiQo</h1>
                            <p className="text-zinc-400">What brings you here? We'll set up your experience around your goals.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ONBOARDING_PATHS.map(path => (
                                <button
                                    key={path.id}
                                    id={`onboarding-path-${path.id}`}
                                    onClick={() => handleSelectPath(path)}
                                    className="group text-left p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800/80 transition-all duration-200 shadow-sm hover:shadow-indigo-500/10 hover:shadow-lg"
                                >
                                    <div className="text-2xl mb-2">{path.emoji}</div>
                                    <div className="font-bold text-white mb-1">{path.label}</div>
                                    <div className="text-xs text-zinc-400">{path.tagline}</div>
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {path.features.slice(0, 2).map(f => (
                                            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{f}</span>
                                        ))}
                                        {path.features.length > 2 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">+{path.features.length - 2} more</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {onSkip && (
                            <div className="text-center mt-6">
                                <button onClick={onSkip} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                                    Skip for now
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {step === 'name' && selectedPath && (
                    <div className="text-center">
                        <div className="text-4xl mb-4">{selectedPath.emoji}</div>
                        <h2 className="text-2xl font-black text-white mb-2">
                            {selectedPath.label} mode activated
                        </h2>
                        <p className="text-zinc-400 mb-8 text-sm">{selectedPath.tagline}</p>

                        <div className="mb-6">
                            <label className="block text-sm text-zinc-500 mb-2 text-left">What should CubiQo call you? <span className="text-zinc-600">(optional)</span></label>
                            <input
                                id="onboarding-name-input"
                                type="text"
                                placeholder="Your name or nickname"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleComplete()}
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-sm"
                                autoFocus
                            />
                        </div>

                        <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left">
                            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Your first message will be:</div>
                            <div className="text-sm text-zinc-300 italic">"{selectedPath.firstPrompt}"</div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('intent')}
                                className="flex-1 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-sm"
                            >
                                ← Back
                            </button>
                            <button
                                id="onboarding-complete-btn"
                                onClick={handleComplete}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition-all shadow-lg shadow-indigo-500/30 text-sm"
                            >
                                Let's go →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
