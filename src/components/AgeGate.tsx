'use client'

/**
 * TFR-003: Age Gate Component
 * Shown when user tries to access RED zone content without age verification.
 */

import { useState } from 'react'

interface AgeGateProps {
    onVerified: () => void
    onDenied?: () => void
}

export function AgeGate({ onVerified, onDenied }: AgeGateProps) {
    const [day, setDay] = useState('')
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('')
    const [error, setError] = useState('')

    const handleVerify = () => {
        const d = parseInt(day), m = parseInt(month), y = parseInt(year)
        if (!d || !m || !y || y < 1900 || y > 2025) {
            setError('Please enter a valid date of birth.')
            return
        }

        const dob = new Date(y, m - 1, d)
        const now = new Date()
        const age = now.getFullYear() - dob.getFullYear() -
            (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)

        if (age < 18) {
            setError('You must be 18 or older to access this content.')
            onDenied?.()
            return
        }

        // Mark session as age-verified in localStorage
        // The chat API reads x-age-verified header set by the client
        localStorage.setItem('cubiqo-age-verified', 'true')
        onVerified()
    }

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-zinc-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl shadow-red-500/20">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/40">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-white text-center mb-2">Age Verification Required</h2>
                <p className="text-sm text-zinc-400 text-center mb-6">
                    RED zone content is for adults only. Please verify you are 18 or older.
                </p>

                <div className="flex gap-2 mb-4">
                    <input
                        id="age-gate-day"
                        type="number"
                        placeholder="DD"
                        value={day}
                        onChange={e => setDay(e.target.value)}
                        min={1} max={31}
                        className="w-1/3 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-center text-sm focus:outline-none focus:border-red-500"
                    />
                    <input
                        id="age-gate-month"
                        type="number"
                        placeholder="MM"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        min={1} max={12}
                        className="w-1/3 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-center text-sm focus:outline-none focus:border-red-500"
                    />
                    <input
                        id="age-gate-year"
                        type="number"
                        placeholder="YYYY"
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        min={1900} max={2025}
                        className="w-1/3 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-center text-sm focus:outline-none focus:border-red-500"
                    />
                </div>

                {error && (
                    <p className="text-xs text-red-400 text-center mb-4">{error}</p>
                )}

                <button
                    id="age-gate-confirm"
                    onClick={handleVerify}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all shadow-lg shadow-red-500/30 mb-3"
                >
                    Confirm — I am 18+
                </button>

                <p className="text-xs text-zinc-500 text-center">
                    By confirming, you agree to our{' '}
                    <a href="/terms" className="text-zinc-400 hover:text-white underline">Terms of Service</a>.
                    Misrepresenting your age is prohibited.
                </p>
            </div>
        </div>
    )
}
