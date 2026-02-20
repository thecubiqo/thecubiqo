'use client'

/**
 * Job Hunt Mode Dashboard
 * Main page for the job hunting automation feature
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import type { 
  JobHuntProfile, 
  JobApplication, 
  JobHuntActivity,
  JobHuntDashboardStats 
} from '@/types/job-hunt'

export default function JobHuntPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [profile, setProfile] = useState<JobHuntProfile | null>(null)
  const [stats, setStats] = useState<JobHuntDashboardStats | null>(null)
  const [activities, setActivities] = useState<JobHuntActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/job-hunt/dashboard')
      
      if (response.status === 404) {
        setShowSetup(true)
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setProfile(data.profile)
      setStats(data.stats)
      setActivities(data.recent_activities || [])
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (authLoading || isLoading) {
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
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">Q</span>
              </div>
              <span className="font-bold tracking-widest text-sm">CubiQo™</span>
            </Link>
          </div>
        </header>

        <main className="pt-24 pb-8 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Job Hunt Mode</h1>
            <p className="text-white/60 text-lg mb-8">
              Sign in to start your automated job hunting journey
            </p>
            <Link
              href="/auth"
              className="inline-block px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all font-semibold"
            >
              Sign In to Continue
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // Setup required
  if (showSetup) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">Q</span>
              </div>
              <span className="font-bold tracking-widest text-sm">CubiQo™</span>
            </Link>
            <Link href="/dashboard" className="text-sm hover:text-orange-500 transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="pt-24 pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4">Welcome to Job Hunt Mode</h1>
              <p className="text-white/60 text-lg">
                Let's set up your profile to start automating your job search
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">What Job Hunt Mode Can Do</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Resume Management</h3>
                    <p className="text-sm text-white/60">Upload and auto-update your resume for each application</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Auto Job Search</h3>
                    <p className="text-sm text-white/60">Automatically search for jobs across multiple platforms</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Application Tracking</h3>
                    <p className="text-sm text-white/60">Track all applications, interviews, and responses</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Email Reports</h3>
                    <p className="text-sm text-white/60">Get daily summaries and interview alerts via email</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/job-hunt/setup"
                className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all font-semibold text-lg shadow-lg shadow-orange-500/30"
              >
                Get Started
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="font-bold tracking-widest text-sm">CubiQo™</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm hover:text-orange-500 transition-colors">
              Dashboard
            </Link>
            <Link href="/job-hunt/setup" className="text-sm hover:text-orange-500 transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Job Hunt Dashboard</h1>
            <p className="text-white/60">Track your job applications and automation status</p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="text-2xl font-bold text-blue-400">{stats.total_applications}</div>
                <div className="text-xs text-white/60 mt-1">Total</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                <div className="text-xs text-white/60 mt-1">Pending</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="text-2xl font-bold text-green-400">{stats.applied}</div>
                <div className="text-xs text-white/60 mt-1">Applied</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="text-2xl font-bold text-purple-400">{stats.interviews}</div>
                <div className="text-xs text-white/60 mt-1">Interviews</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="text-2xl font-bold text-orange-400">{stats.offers}</div>
                <div className="text-xs text-white/60 mt-1">Offers</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
                <div className="text-xs text-white/60 mt-1">Rejected</div>
              </div>
            </div>
          )}

          {/* Profile Summary */}
          {profile && (
            <div className="mb-8 p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Your Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Target Roles:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {profile.target_roles.map((role, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-white/60">Skills:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {profile.skills.slice(0, 5).map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 5 && (
                      <span className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs">
                        +{profile.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <Link 
                href="/job-hunt/applications"
                className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
              >
                View All Applications →
              </Link>
            </div>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="p-8 rounded-xl bg-zinc-900/50 border border-white/10 text-center text-white/60">
                  No recent activity
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium mb-1">{activity.description}</div>
                        <div className="text-xs text-white/60">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {activity.activity_type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => alert('Feature coming soon!')}
              className="p-6 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-orange-500/50 transition-all group text-left"
            >
              <div className="w-12 h-12 mb-4 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Add Application</h3>
              <p className="text-sm text-white/60">Manually track a new job application</p>
            </button>

            <button
              onClick={() => fetchDashboardData()}
              className="p-6 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-orange-500/50 transition-all group text-left"
            >
              <div className="w-12 h-12 mb-4 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Refresh Data</h3>
              <p className="text-sm text-white/60">Update your dashboard with latest info</p>
            </button>

            <button
              onClick={() => alert('Feature coming soon!')}
              className="p-6 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-orange-500/50 transition-all group text-left"
            >
              <div className="w-12 h-12 mb-4 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">View Reports</h3>
              <p className="text-sm text-white/60">Check your email reports and summaries</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
