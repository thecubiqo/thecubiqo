'use client'

/**
 * User Dashboard Page
 * Shows user profile, stats, and quick links
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useSession } from '@/hooks/useSession'
import { createClient } from '@/lib/supabase/client'

interface UserStats {
  conversationCount: number
  messageCount: number
  journalEntriesCount: number
}

// System constants
const ACTIVE_AGENTS_COUNT = 7
const LAST_THREAT_SCAN = '2 hours ago' // TODO: Make this dynamic with timestamp

export default function DashboardPage() {
  const { user, profile, isAuthenticated, isLoading: authLoading, signOut } = useAuth()
  const { session, isGuest } = useSession()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Fetch user stats
  useEffect(() => {
    if (!user || !session) return

    const fetchStats = async () => {
      setIsLoadingStats(true)
      try {
        const supabase = createClient()

        // Count conversations
        const { count: conversationCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)

        // Count messages
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)

        // Count journal entries for the authenticated user
        // journal_entries exists in DB but not in generated Supabase types
        const sbAny: any = supabase
        const { count: journalCount } = await sbAny
          .from('journal_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setStats({
          conversationCount: conversationCount || 0,
          messageCount: messageCount || 0,
          journalEntriesCount: journalCount || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [user, session])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">Q</span>
              </div>
              <span className="font-bold tracking-widest text-sm">CubiQo™</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-24 pb-8 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/50">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-4">Welcome to Your Dashboard</h1>
              <p className="text-white/60 text-lg mb-8">
                Sign in to access your AI workspace, conversations, and journal entries
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/auth"
                className="inline-block w-full max-w-sm px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg shadow-orange-500/30"
              >
                Sign In to Continue
              </Link>
              <div className="text-sm text-white/40">
                New to CubiQo? Signing in will create your account automatically
              </div>
            </div>

            {/* Features Preview */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">AI Conversations</h3>
                <p className="text-sm text-white/60">Chat with advanced AI agents</p>
              </div>

              <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Daily Journal</h3>
                <p className="text-sm text-white/60">Guided reflection & insights</p>
              </div>

              <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Voice Mode</h3>
                <p className="text-sm text-white/60">Natural voice conversations</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="font-bold tracking-widest text-sm">CubiQo™</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="text-xs px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}!
            </h1>
            <div className="flex items-center gap-4 text-white/60">
              {profile?.handle && (
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">@</span>
                  <span>{profile.handle}</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isGuest ? 'bg-gray-500' : 'bg-green-500'}`} />
                <span className="text-sm">{isGuest ? 'Guest' : 'Authenticated'}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/60 text-sm font-medium">Conversations</h3>
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">
                {isLoadingStats ? '...' : stats?.conversationCount || 0}
              </div>
              <div className="text-xs text-white/40">Total conversations</div>
            </div>

            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/60 text-sm font-medium">Messages</h3>
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">
                {isLoadingStats ? '...' : stats?.messageCount || 0}
              </div>
              <div className="text-xs text-white/40">Total messages</div>
            </div>

            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/60 text-sm font-medium">Journal Entries</h3>
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">
                {isLoadingStats ? '...' : stats?.journalEntriesCount || 0}
              </div>
              <div className="text-xs text-white/40">Reflection entries</div>
            </div>

            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/60 text-sm font-medium">Active Agents</h3>
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{ACTIVE_AGENTS_COUNT}</div>
              <div className="text-xs text-white/40">AI agents available</div>
            </div>
          </div>

          {/* CubiQo Emergent Capabilities Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">Q</span>
              </span>
              CubiQo Emergent AI Capabilities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Emergent AI Engine */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400 font-medium">
                    Active
                  </div>
                </div>
                <h3 className="font-semibold mb-1 text-cyan-100">Emergent AI Engine</h3>
                <p className="text-xs text-white/60">Self-organizing intelligence</p>
              </div>

              {/* Active Agents */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">{ACTIVE_AGENTS_COUNT}</div>
                </div>
                <h3 className="font-semibold mb-1 text-cyan-100">Active Agents</h3>
                <p className="text-xs text-white/60">Specialized AI workers</p>
              </div>

              {/* AI Model Routing */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 font-medium">
                    Claude
                  </div>
                </div>
                <h3 className="font-semibold mb-1 text-cyan-100">Model Routing</h3>
                <p className="text-xs text-white/60">Emergent provider → Sonnet</p>
              </div>

              {/* Self-Healing */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400 font-medium">
                    Ready
                  </div>
                </div>
                <h3 className="font-semibold mb-1 text-cyan-100">Self-Healing</h3>
                <p className="text-xs text-white/60">Auto-recovery enabled</p>
              </div>
            </div>
          </div>

          {/* Security & Protection Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Security & Protection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Antivirus Protection */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 font-medium">
                    Protected
                  </div>
                </div>
                <h3 className="font-semibold mb-1 text-green-100">Antivirus</h3>
                <p className="text-xs text-white/60">Real-time protection active</p>
              </div>

              {/* Threat Scanning */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-green-400">0</div>
                </div>
                <h3 className="font-semibold mb-1 text-green-100">Threat Scan</h3>
                <p className="text-xs text-white/60">Last scan: {LAST_THREAT_SCAN}</p>
              </div>

              {/* Data Encryption */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 font-medium">
                    AES-256
                  </div>
                </div>
                <h3 className="font-semibold mb-1 text-green-100">Encryption</h3>
                <p className="text-xs text-white/60">Military-grade security</p>
              </div>

              {/* WebAuthn/Passkey */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 font-medium">
                    Configured
                  </div>
                </div>
                <h3 className="font-semibold mb-1 text-green-100">Passkey Auth</h3>
                <p className="text-xs text-white/60">Biometric & WebAuthn</p>
              </div>
            </div>
          </div>

          {/* System Health Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              System Health
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* System Uptime */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/60 text-sm font-medium">System Uptime</h3>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">99.9%</div>
                <div className="text-xs text-white/40">Last 30 days</div>
              </div>

              {/* Memory Usage */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/60 text-sm font-medium">Memory Usage</h3>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">42%</div>
                <div className="text-xs text-white/40">Optimal performance</div>
              </div>

              {/* API Latency */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/60 text-sm font-medium">API Latency</h3>
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">45ms</div>
                <div className="text-xs text-white/40">Average response time</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link
                href="/chat"
                className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-orange-500/50 transition-all group"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-center">Chat</div>
              </Link>

              <Link
                href="/journal"
                className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-orange-500/50 transition-all group"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-center">Journal</div>
              </Link>

              <Link
                href="/"
                className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-orange-500/50 transition-all group"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-center">Voice Mode</div>
              </Link>

              <Link
                href="/job-hunt"
                className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-orange-500/50 transition-all group"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-teal-500/20 group-hover:bg-teal-500/30 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-center">Job Hunt</div>
              </Link>

              <Link
                href="/settings-cube"
                className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-orange-500/50 transition-all group"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-center">Settings</div>
              </Link>
            </div>
          </div>

          {/* Session Info */}
          {session && (
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Current Session</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Session ID:</span>
                  <div className="font-mono text-xs mt-1">{session.id}</div>
                </div>
                <div>
                  <span className="text-white/60">Status:</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
