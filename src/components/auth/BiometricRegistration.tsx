'use client'

import { useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'

export function BiometricRegistration() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const handleRegister = async () => {
        setStatus('loading')
        setErrorMessage('')

        try {
            // 1. Get options from server
            const resp = await fetch('/api/auth/webauthn/register/options')
            if (!resp.ok) throw new Error('Failed to get registration options')
            const options = await resp.json()

            // 2. Browser ceremony
            const attResp = await startRegistration(options)

            // 3. Verify with server
            const verificationResp = await fetch('/api/auth/webauthn/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attResp),
            })

            const verificationJSON = await verificationResp.json()

            if (verificationJSON && verificationJSON.verified) {
                setStatus('success')
            } else {
                throw new Error(verificationJSON.error || 'Verification failed')
            }
        } catch (error: any) {
            console.error(error)
            setStatus('error')
            setErrorMessage(error.message || 'An error occurred')
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 border border-white/10 rounded-lg bg-white/5">
            <h3 className="text-lg font-medium text-white">Passkeys</h3>
            <p className="text-sm text-gray-400">
                Login faster with FaceID, TouchID, or Windows Hello.
            </p>

            {status === 'success' ? (
                <div className="text-green-400 text-sm">Passkey added successfully!</div>
            ) : (
                <button
                    onClick={handleRegister}
                    disabled={status === 'loading'}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors disabled:opacity-50"
                >
                    {status === 'loading' ? 'Registering...' : 'Add Passkey'}
                </button>
            )}

            {status === 'error' && (
                <div className="text-red-400 text-sm">{errorMessage}</div>
            )}
        </div>
    )
}
