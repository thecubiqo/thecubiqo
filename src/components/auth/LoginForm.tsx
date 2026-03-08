'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BiometricLogin } from '@/components/auth/BiometricLogin'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, UserPlus, LogIn, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

type AuthMode = 'signin' | 'signup'
type AuthMethod = 'password' | 'magic-link'

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [method, setMethod] = useState<AuthMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const { signInWithEmail, signInWithPassword, signUp, signInAsDeveloper } = useAuth() as any

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isLoading) return
    if (method === 'password' && !password) return

    setIsLoading(true)
    setMessage(null)

    try {
      if (method === 'magic-link') {
        await signInWithEmail(email)
        setMessage({ type: 'success', text: 'Check your email for the magic link!' })
      } else {
        if (mode === 'signin') {
          await signInWithPassword(email, password)
          // Redirect is handled by AuthContext listener
        } else {
          await signUp(email, password)
          setMessage({ type: 'success', text: 'Account created! Check your email to verify (if required) or sign in.' })
        }
      }
    } catch (error: any) {
      console.error('[AuthForm] Error:', error)
      setMessage({ type: 'error', text: error.message || 'Authentication failed' })
    } finally {
      setIsLoading(false)
    }
  }, [email, password, mode, method, signInWithEmail, signInWithPassword, signUp, isLoading])

  return (
    <div className="w-full max-w-sm mx-auto p-4 space-y-8" data-testid="auth-form-container">
      {/* Mode Switcher */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setMode('signin')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'signin'
              ? 'bg-white text-black shadow-lg shadow-white/10'
              : 'text-white/40 hover:text-white/70'
            }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'signup'
              ? 'bg-white text-black shadow-lg shadow-white/10'
              : 'text-white/40 hover:text-white/70'
            }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {/* Email Field */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white/60 transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
              autoComplete="email"
            />
          </div>

          {/* Password Field (only if password method) */}
          <AnimatePresence mode="wait">
            {method === 'password' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="relative group overflow-hidden"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white/60 transition-colors z-10">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl shadow-white/5 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              {mode === 'signin' ? <LogIn size={18} /> : <UserPlus size={18} />}
              {mode === 'signin'
                ? (method === 'password' ? 'Sign In' : 'Send Magic Link')
                : 'Create CubiQo Account'
              }
            </>
          )}
        </button>

        {/* Method Switcher */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setMethod(method === 'password' ? 'magic-link' : 'password')}
            className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <Sparkles size={12} />
            {method === 'password'
              ? 'Switch to Magic Link'
              : 'Switch to Password Sign In'
            }
          </button>
        </div>
      </form>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`p-4 rounded-2xl text-[13px] border overflow-hidden relative ${message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="shrink-0 mt-0.5" size={16} />
              <p>{message.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Biometric Placeholder */}
      <div className="pt-4 border-t border-white/5 text-center">
        <BiometricLogin />
      </div>

      {/* Dev bypass */}
      {process.env.NODE_ENV === 'development' && (
        <button
          type="button"
          onClick={() => signInAsDeveloper(email || 'aditya@cubiqo.ai')}
          className="w-full py-2.5 rounded-xl bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/20 hover:bg-orange-500/20 transition-all uppercase tracking-widest"
        >
          Bypass Authentication (Dev)
        </button>
      )}
    </div>
  )
}
