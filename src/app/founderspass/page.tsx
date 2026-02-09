'use client'

/**
 * Founders Login Page
 * Dedicated entry point for founder access with PIN verification
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Simple PIN for founder access (in production, store this securely)
const FOUNDER_PIN = '2026'

export default function FoundersLoginPage() {
    const router = useRouter()
    const [pin, setPin] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const supabase = createClient()

    // Check if already authenticated via session storage
    useEffect(() => {
        const checkAuth = () => {
            const founderAuth = sessionStorage.getItem('founders_pass_auth')
            if (founderAuth === 'true') {
                setIsAuthenticated(true)
                router.push('/founderspass/dashboard')
            }
            setIsLoading(false)
        }
        checkAuth()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!pin.trim()) return

        setIsLoading(true)
        setMessage(null)

        // Simple PIN verification
        if (pin === FOUNDER_PIN) {
            // Store auth in session
            sessionStorage.setItem('founders_pass_auth', 'true')
            setMessage({ type: 'success', text: '✅ Access granted! Redirecting...' })

            // Redirect to dashboard
            setTimeout(() => {
                router.push('/founderspass/dashboard')
            }, 500)
        } else {
            setMessage({ type: 'error', text: 'Invalid PIN. Access denied.' })
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-black to-purple-900/20" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <span className="text-3xl font-bold text-black">F</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Founders Pass</h1>
                    <p className="text-gray-400">Exclusive access for CubiQo founders</p>
                </div>

                {/* Login Card */}
                <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Founder PIN
                            </label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="Enter 4-digit PIN"
                                required
                                disabled={isLoading}
                                maxLength={4}
                                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || pin.length !== 4}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold hover:from-amber-400 hover:to-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
                        >
                            {isLoading ? 'Verifying...' : 'Access Dashboard'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-6 p-4 rounded-xl text-sm ${message.type === 'success'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <p className="text-center text-xs text-gray-500">
                            Founders Pass gives you access to staging features, tool configuration, and the ability to control what generic users see on cubiqo.ai
                        </p>
                    </div>
                </div>

                {/* Back link */}
                <div className="text-center mt-6">
                    <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                        ← Back to CubiQo
                    </a>
                </div>
            </div>
        </div>
    )
}
