'use client'

/**
 * Legacy Founders Pass Route — Redirects to secure /founders-pass
 * 
 * SECURITY FIX: Removed hardcoded PIN '2026' that was in client-side code.
 * This page previously used sessionStorage-only auth with zero server validation.
 * Now redirects to /founders-pass which uses real Supabase auth.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FoundersPassRedirect() {
    const router = useRouter()

    useEffect(() => {
        // Clear any legacy sessionStorage auth tokens
        try {
            sessionStorage.removeItem('founders_pass_auth')
        } catch { }

        router.replace('/founders-pass')
    }, [router])

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Redirecting to secure Founders Pass...</p>
            </div>
        </div>
    )
}
