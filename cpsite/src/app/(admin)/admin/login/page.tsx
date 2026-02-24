'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push(searchParams.get('from') ?? '/admin')
      } else {
        setError('Incorrect password.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-8">Admin</p>
        <h1 className="text-[28px] text-[#F2EFE8] font-[400] mb-10 tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)' }}>
          Carl Phillips
        </h1>
        {error && <p className="text-[13px] text-red-900 mb-5">{error}</p>}
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          required
          className="w-full bg-transparent border border-white/[0.08] text-[#F2EFE8] placeholder-white/20 px-4 py-3 text-[15px] mb-6 focus:outline-none focus:border-white/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-white/[0.08] text-[#F2EFE8] py-3 text-[13px] uppercase tracking-[0.18em] hover:border-white/[0.14] hover:bg-white/[0.04] transition disabled:opacity-40"
        >
          {loading ? 'Entering…' : 'Enter'}
        </button>
      </form>
    </main>
  )
}

export default function AdminLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

