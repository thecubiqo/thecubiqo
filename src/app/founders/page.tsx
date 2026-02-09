'use client'

/**
 * Founders Login Page
 * Dedicated entry point for founder access with email verification
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function FoundersLoginPage() {
    const router = useRouter()
    const { user, isAuthenticated, signInWithEmail } = useAuth()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

    // Check if already logged in as founder
    const isFounder = user?.email?.toLowerCase() === 'aditya@cubiqo.ai'

    // If already authenticated as founder, redirect to dashboard
    if (isAuthenticated && isFounder) {
        router.push('/founders/dashboard')
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) return

        // Only allow founder email
        if (email.toLowerCase() !== 'aditya@cubiqo.ai') {
            setMessage({ type: 'error', text: 'Access denied. Founders Pass is invite-only.' })
            return
        }

        setIsLoading(true)
        setMessage(null)

        try {
            await signInWithEmail(email)
            setMessage({
                type: 'success',
                text: '✅ Magic link sent! Check your email and click the link to access Founders Pass.'
            })
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to send magic link'
            })
        } finally {
            setIsLoading(false)
        }
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
                                Founder Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold hover:from-amber-400 hover:to-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
                        >
                            {isLoading ? 'Sending...' : 'Request Access'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-6 p-4 rounded-xl text-sm ${message.type === 'success'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : message.type === 'error'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
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
