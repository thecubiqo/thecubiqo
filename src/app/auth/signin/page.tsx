'use client'

import { LoginForm } from '@/components/auth'
import Link from 'next/link'

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
            <div
                className="w-full max-w-[340px] rounded-[24px] px-8 py-7"
                style={{
                    background: 'rgba(38,38,40,0.95)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.08)'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-7">
                    <h2 className="text-[19px] font-normal text-white/90 tracking-tight">Sign In</h2>
                </div>

                {/* Login Form */}
                <LoginForm />

                <div className="mt-6 text-center">
                    <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                        ← Back to CubiQo
                    </Link>
                </div>
            </div>
        </div>
    )
}
