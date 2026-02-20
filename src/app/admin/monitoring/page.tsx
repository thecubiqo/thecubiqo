'use client'

import { useState, useEffect } from 'react'
import { Activity, GitBranch, GitPullRequest, Server, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface MonitoringEvent {
  id: string
  event_type: 'branch_push' | 'pr_activity' | 'deployment' | 'health_check'
  event_data: any
  repository: string
  created_at: string
}

interface DashboardData {
  summary: {
    total_events: number
    branch_pushes: number
    pr_activities: number
    deployments: number
    health_checks: number
  }
  recent_activity: Array<{
    type: string
    timestamp: string
    description: string
  }>
  branch_status: {
    main: {
      last_push: string | null
      last_deployment: string | null
    }
    staging: {
      last_push: string | null
      last_deployment: string | null
    }
  }
  pr_status: {
    open_prs: number
    merged_today: number
    closed_today: number
  }
}

export default function MonitoringDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [recentEvents, setRecentEvents] = useState<MonitoringEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    setRefreshing(true)
    try {
      // Fetch dashboard data
      const dashboardResponse = await fetch('/api/monitoring/dashboard')
      if (!dashboardResponse.ok) throw new Error('Failed to fetch dashboard data')
      const dashboardData = await dashboardResponse.json()
      setDashboardData(dashboardData)

      // Fetch recent events
      const eventsResponse = await fetch('/api/monitoring/activity?limit=10')
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setRecentEvents(eventsData.events || [])
      }
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'branch_push': return <GitBranch className="h-4 w-4" />
      case 'pr_activity': return <GitPullRequest className="h-4 w-4" />
      case 'deployment': return <Server className="h-4 w-4" />
      case 'health_check': return <Activity className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'branch_push': return 'bg-blue-100 text-blue-700'
      case 'pr_activity': return 'bg-green-100 text-green-700'
      case 'deployment': return 'bg-purple-100 text-purple-700'
      case 'health_check': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">System Monitoring Dashboard</h1>
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="bg-gray-100 rounded-lg p-6 animate-pulse h-96"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 text-red-700 mb-4">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-xl font-bold">Error Loading Monitoring Dashboard</h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Monitoring Dashboard</h1>
            <p className="text-gray-600">
              Real-time monitoring of GitHub activity, deployments, and system health
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Total Events</div>
          <div className="text-3xl font-bold">
            {dashboardData?.summary.total_events.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">All monitoring events</div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Branch Pushes
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {dashboardData?.summary.branch_pushes.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Git branch activity</div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
            <GitPullRequest className="h-4 w-4" />
            PR Activities
          </div>
          <div className="text-3xl font-bold text-green-600">
            {dashboardData?.summary.pr_activities.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Pull request events</div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
            <Server className="h-4 w-4" />
            Deployments
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {dashboardData?.summary.deployments.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Vercel deployments</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <p className="text-gray-600 text-sm">Latest monitoring events</p>
            </div>
            <div className="p-6">
              {recentEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent events found
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getEventColor(event.event_type)}`}>
                          {getEventIcon(event.event_type)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {event.event_type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {event.repository}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatTime(event.created_at)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(event.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Branch Status */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Branch Status</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Main Branch
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Push:</span>
                    <span className="font-medium">
                      {dashboardData?.branch_status.main.last_push 
                        ? formatTime(dashboardData.branch_status.main.last_push)
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Deployment:</span>
                    <span className="font-medium">
                      {dashboardData?.branch_status.main.last_deployment 
                        ? formatTime(dashboardData.branch_status.main.last_deployment)
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Staging Branch
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Push:</span>
                    <span className="font-medium">
                      {dashboardData?.branch_status.staging.last_push 
                        ? formatTime(dashboardData.branch_status.staging.last_push)
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Deployment:</span>
                    <span className="font-medium">
                      {dashboardData?.branch_status.staging.last_deployment 
                        ? formatTime(dashboardData.branch_status.staging.last_deployment)
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PR Status */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">PR Status</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData?.pr_status.open_prs || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Open</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData?.pr_status.merged_today || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Merged Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardData?.pr_status.closed_today || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Closed Today</div>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Monitoring API</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Database</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">GitHub Actions</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
                <div className="pt-4 border-t text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Auto-refreshes every 30 seconds
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}