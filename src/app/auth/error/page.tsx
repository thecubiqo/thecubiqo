'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthErrorPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full glass-card border border-red-500/30 p-8 rounded-2xl text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
                <p className="text-gray-400 mb-6">
                    {errorDescription || error || 'Something went wrong during the sign-in process.'}
                </p>

                <div className="space-y-4">
                    <Link
                        href="/"
                        className="block w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Back to Home
                    </Link>
                    <p className="text-xs text-gray-500">
                        Error Code: {error || 'unknown_error'}
                    </p>
                </div>
            </div>
        </div>
    )
}
