'use client'

/**
 * Authentication Page
 * Magic link sign-in with CubiQo branding
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/hooks/useAuth'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (mounted && isAuthenticated && !isLoading) {
      console.log('[Auth Page] User already authenticated, redirecting to chat')
      router.push('/chat')
    }
  }, [isAuthenticated, isLoading, mounted, router])

  // Show loading while checking auth state
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Don't render the form if already authenticated (prevents flash before redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/50 group-hover:shadow-orange-500/70 transition-shadow">
              <span className="text-white text-xl font-bold">Q</span>
            </div>
            <div>
              <h1 className="font-bold tracking-widest text-2xl">CubiQo™</h1>
              <p className="text-xs text-white/50 tracking-wider">AUTONOMOUS AI PLATFORM</p>
            </div>
          </Link>

          {/* Welcome Message */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-white/60 text-sm">
              Sign in to access your AI workspace
            </p>
          </div>
        </div>

        {/* Sign-in Form Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <LoginForm />
        </div>

        {/* Social Proof */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-xs text-white/40">
            ✓ Secure magic link authentication
          </p>
          <p className="text-xs text-white/40">
            ✓ No passwords • No tracking • Privacy-first
          </p>
          <p className="text-xs text-white/40">
            ✓ AI agents • Voice mode • Real-time collaboration
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="text-sm text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
