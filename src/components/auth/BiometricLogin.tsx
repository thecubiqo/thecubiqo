'use client'

import { useState, useEffect } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import { useRouter } from 'next/navigation'

export function BiometricLogin() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    const router = useRouter()

    useEffect(() => {
        // Check if browser supports WebAuthn
        if (typeof window !== 'undefined' &&
            (!window.PublicKeyCredential ||
                !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)) {
            // Ideally we check availability async
        }
    }, [])

    const handleLogin = async () => {
        setStatus('loading')
        setErrorMessage('')

        try {
            // 1. Get options from server
            const resp = await fetch('/api/auth/webauthn/login/options')
            if (!resp.ok) throw new Error('Failed to get login options')
            const options = await resp.json()

            // 2. Browser ceremony
            let asseResp;
            try {
                asseResp = await startAuthentication(options)
            } catch (e: any) {
                // Handle cancellation or "no credentials found"
                if (e.name === 'NotAllowedError') {
                    throw new Error('Login cancelled or no passkey found.')
                }
                throw e
            }

            // 3. Verify with server
            const verificationResp = await fetch('/api/auth/webauthn/login/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(asseResp),
            })

            const verificationJSON = await verificationResp.json()

            if (verificationJSON && verificationJSON.verified) {
                setStatus('success')
                // Redirect to Magic Link (which logs in and then goes to dashboard)
                window.location.href = verificationJSON.redirectUrl
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
        <div className="w-full">
            <button
                onClick={handleLogin}
                disabled={status === 'loading' || status === 'success'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
                {status === 'loading' ? (
                    <span>Verifying...</span>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        Sign in with Passkey
                    </>
                )}
            </button>

            {status === 'error' && (
                <div className="mt-2 text-center text-red-500 text-sm">{errorMessage}</div>
            )}
        </div>
    )
}
