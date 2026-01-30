'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface AnalyticsData {
  overview: {
    users: number
    sessions: number
    pageViews: number
    bounceRate: number
    avgSessionDuration: number
  }
  dailyData: Array<{
    date: string
    users: number
    sessions: number
    pageViews: number
  }>
  topPages: Array<{
    page: string
    views: number
  }>
  trafficSources: Array<{
    source: string
    sessions: number
  }>
  devices: Array<{
    device: string
    sessions: number
  }>
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

export default function DomainAnalyticsPage() {
  const params = useParams()
  const domainId = params.id as string
  const [domain, setDomain] = useState<{ domainName: string; googleAnalyticsId: string | null } | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    if (domainId) {
      fetchDomain()
      fetchAnalytics()
    }
  }, [domainId, dateRange])

  const fetchDomain = async () => {
    try {
      const res = await fetch(`/api/domains/${domainId}`)
      if (res.ok) {
        const data = await res.json()
        setDomain(data.domain)
      }
    } catch (error) {
      console.error('Error fetching domain:', error)
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/domains/${domainId}/analytics?range=${dateRange}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data.analytics)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError('Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href={`/domains/${domainId}`}
              className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
            >
              ← Back to Domain
            </Link>
          </div>
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Analytics</h2>
            <p className="text-slate-300">{error}</p>
            {!domain?.googleAnalyticsId && (
              <p className="text-slate-400 mt-4">
                Please configure Google Analytics ID for this domain in the domain settings.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Domain not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/domains/${domainId}`}
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Domain
          </Link>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics: {domain.domainName}</h1>
            {domain.googleAnalyticsId && (
              <p className="text-slate-400 text-sm">GA4 Property ID: {domain.googleAnalyticsId}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-4 py-2 rounded-lg ${
                dateRange === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-4 py-2 rounded-lg ${
                dateRange === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-4 py-2 rounded-lg ${
                dateRange === '90d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>

        {!domain.googleAnalyticsId ? (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">Google Analytics Not Configured</h2>
            <p className="text-slate-300 mb-4">
              Please configure your Google Analytics Measurement ID in the domain settings to view analytics.
            </p>
            <Link
              href={`/domains/${domainId}`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Configure Domain
            </Link>
          </div>
        ) : analytics ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <div className="text-slate-400 text-sm mb-1">Users</div>
                <div className="text-3xl font-bold text-white">{analytics.overview.users.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <div className="text-slate-400 text-sm mb-1">Sessions</div>
                <div className="text-3xl font-bold text-white">{analytics.overview.sessions.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <div className="text-slate-400 text-sm mb-1">Page Views</div>
                <div className="text-3xl font-bold text-white">{analytics.overview.pageViews.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <div className="text-slate-400 text-sm mb-1">Bounce Rate</div>
                <div className="text-3xl font-bold text-white">{analytics.overview.bounceRate.toFixed(1)}%</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <div className="text-slate-400 text-sm mb-1">Avg. Session</div>
                <div className="text-3xl font-bold text-white">
                  {Math.floor(analytics.overview.avgSessionDuration / 60)}m{' '}
                  {Math.floor(analytics.overview.avgSessionDuration % 60)}s
                </div>
              </div>
            </div>

            {/* Daily Traffic Chart */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Traffic Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.dailyData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    name="Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorSessions)"
                    name="Sessions"
                  />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorPageViews)"
                    name="Page Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Pages */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Top Pages</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topPages} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis
                      type="category"
                      dataKey="page"
                      stroke="#9ca3af"
                      style={{ fontSize: '12px' }}
                      width={150}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Traffic Sources */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Traffic Sources</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.trafficSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ payload, percent }: any) => `${payload?.source || ''} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sessions"
                      nameKey="source"
                    >
                      {analytics.trafficSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Devices Chart */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Devices</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.devices}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="device" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

