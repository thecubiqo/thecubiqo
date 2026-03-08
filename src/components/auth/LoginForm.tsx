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

  const { signInWithEmail, signInWithPassword, signInWithProvider, signUp, signInAsDeveloper } = useAuth() as any

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

      {/* SSO Section */}
      <div className="space-y-3">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative px-3 bg-zinc-950 text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">Or continue with</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => signInWithProvider('google')}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <svg className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
            </svg>
            <span className="text-xs font-medium text-white/60 group-hover:text-white/90">Google</span>
          </button>
          <button
            onClick={() => signInWithProvider('github')}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <svg className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <span className="text-xs font-medium text-white/60 group-hover:text-white/90">GitHub</span>
          </button>
        </div>
      </div>

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
