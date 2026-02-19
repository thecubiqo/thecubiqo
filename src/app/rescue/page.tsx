'use client'

import { useState } from 'react'

export default function RescuePage() {
    const [pin, setPin] = useState('')
    const [status, setStatus] = useState('')

    const handleRescue = () => {
        if (pin === '2026') {
            setStatus('Success! Redirecting...')
            // Set the session storage flag directly
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('founders_pass_auth', 'true')
                // Force hard reload to dashboard
                window.location.href = '/founderspass/dashboard'
            }
        } else {
            setStatus('Invalid PIN')
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold mb-8">Emergency Access</h1>
            <p className="text-gray-400 mb-8 text-center max-w-md">
                Standard Route Bypass. Enter PIN to force-enable Founder mode.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs">
                <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN"
                    className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-amber-500"
                    maxLength={4}
                />

                <button
                    onClick={handleRescue}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-lg transition-colors"
                >
                    Force Entry
                </button>
            </div>

            {status && (
                <p className={`mt-6 text-lg ${status.includes('Success') ? 'text-green-500' : 'text-red-500'}`}>
                    {status}
                </p>
            )}
        </div>
    )
}
