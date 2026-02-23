'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router      = useRouter()
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
        const from = searchParams.get('from') ?? '/admin'
        router.push(from)
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
    <main className="min-h-screen bg-[#0B0B0D] flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-8">Admin</p>
        <h1 className="text-[28px] text-[#F6F3EE] font-[520] mb-10">Carl Phillips</h1>

        {error && (
          <p className="text-[13px] text-[#7C2020] mb-5">{error}</p>
        )}

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          required
          className="w-full bg-transparent border border-[#2A2A2E] text-[#F6F3EE] placeholder-[#4A4A4E] px-4 py-3 text-[15px] mb-6 focus:outline-none focus:border-[#A9A9A9]"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full border border-[#F6F3EE]/20 text-[#F6F3EE] py-3 text-[14px] hover:bg-[#F6F3EE]/5 transition disabled:opacity-40"
        >
          {loading ? 'Entering…' : 'Enter'}
        </button>
      </form>
    </main>
  )
}
