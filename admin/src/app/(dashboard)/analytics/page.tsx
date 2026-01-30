'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import MetricCard from '@/components/analytics/MetricCard'
import ChartContainer from '@/components/analytics/ChartContainer'
import DateRangePicker from '@/components/analytics/DateRangePicker'

// Mock data generators
const generateMockData = () => {
  const now = new Date()
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (29 - i))
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      activeUsers: Math.floor(Math.random() * 500) + 200,
      newUsers: Math.floor(Math.random() * 100) + 50,
      conversations: Math.floor(Math.random() * 300) + 150,
      messages: Math.floor(Math.random() * 1000) + 500,
      avgResponseTime: Math.random() * 500 + 200,
      textInput: Math.floor(Math.random() * 400) + 200,
      voiceInput: Math.floor(Math.random() * 200) + 100,
      red: Math.floor(Math.random() * 100) + 50,
      yellow: Math.floor(Math.random() * 100) + 50,
      greenBlue: Math.floor(Math.random() * 100) + 50,
      orange: Math.floor(Math.random() * 150) + 100,
    }
  })

  return {
    metrics: {
      totalUsers: 12450,
      totalConversations: 8920,
      totalMessages: 45680,
      avgSessionDuration: '12:34:56',
      userTrend: 12.5,
      conversationTrend: 8.3,
      messageTrend: 15.2,
      durationTrend: -3.1,
    },
    dailyData: days30,
    featureUsage: {
      textVsVoice: [
        { name: 'Text Input', value: 65, count: 12450 },
        { name: 'Voice Input', value: 35, count: 6700 },
      ],
      voiceStats: {
        totalInteractions: 6700,
        successRate: 94.5,
        failedAttempts: 365,
        ttsResponses: 8920,
        avgResponseLength: 45,
      },
      chatStats: {
        avgMessageLength: 142,
        messagesPerConversation: 5.1,
        avgResponseTime: 320,
        p95ResponseTime: 850,
      },
    },
    colors: {
      distribution: [
        { name: 'ORANGE', value: 35, time: '4h 23m' },
        { name: 'RED', value: 28, time: '3h 12m' },
        { name: 'YELLOW', value: 22, time: '2h 45m' },
        { name: 'GREEN_BLUE', value: 15, time: '1h 58m' },
      ],
      transitions: [
        { from: 'ORANGE', to: 'RED', count: 1240 },
        { from: 'RED', to: 'YELLOW', count: 980 },
        { from: 'YELLOW', to: 'GREEN_BLUE', count: 760 },
        { from: 'GREEN_BLUE', to: 'ORANGE', count: 650 },
      ],
    },
    keywords: Array.from({ length: 30 }, (_, i) => ({
      keyword: ['wellness', 'career', 'relationships', 'philosophy', 'health', 'ambition', 'social', 'reflection', 'entertainment', 'hobbies', 'routine', 'mindfulness', 'productivity', 'growth', 'happiness', 'stress', 'goals', 'success', 'balance', 'creativity', 'learning', 'family', 'friends', 'work', 'life', 'future', 'past', 'present', 'dreams', 'reality'][i],
      count: Math.floor(Math.random() * 500) + 100,
      trend: Math.random() > 0.5 ? 'rising' : 'falling',
    })).sort((a, b) => b.count - a.count),
    topics: [
      { name: 'Wellness & Health', percentage: 28, avgLength: 6.2 },
      { name: 'Career & Ambition', percentage: 22, avgLength: 5.8 },
      { name: 'Relationships & Social', percentage: 18, avgLength: 7.1 },
      { name: 'Philosophy & Reflection', percentage: 15, avgLength: 8.5 },
      { name: 'Entertainment & Hobbies', percentage: 12, avgLength: 4.3 },
      { name: 'Daily Life & Routine', percentage: 5, avgLength: 3.9 },
    ],
    worlds: [
      { name: 'CubiQo (main)', sessions: 6540, messages: 32100, users: 4200 },
      { name: 'Headlines', sessions: 1890, messages: 8900, users: 1200 },
      { name: 'Vocspad', sessions: 1240, messages: 5680, users: 890 },
      { name: 'UK Region', sessions: 980, messages: 4200, users: 650 },
    ],
    regions: [
      { country: 'United States', flag: '🇺🇸', users: 3420, sessions: 5120 },
      { country: 'United Kingdom', flag: '🇬🇧', users: 1890, sessions: 2890 },
      { country: 'Canada', flag: '🇨🇦', users: 1240, sessions: 1890 },
      { country: 'Australia', flag: '🇦🇺', users: 980, sessions: 1450 },
      { country: 'Germany', flag: '🇩🇪', users: 760, sessions: 1120 },
    ],
    sessions: {
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 200) + 50,
      })),
      daily: Array.from({ length: 7 }, (_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        count: Math.floor(Math.random() * 500) + 200,
      })),
      dau: 3420,
      wau: 12450,
      mau: 28900,
    },
    auth: {
      guest: 6540,
      authenticated: 5910,
      conversionRate: 47.5,
    },
    ai: {
      models: [
        { name: 'Claude', usage: 65, count: 28900, avgTime: 320, tokens: 12450000 },
        { name: 'OpenAI', usage: 25, count: 11100, avgTime: 280, tokens: 4890000 },
        { name: 'BYO API', usage: 10, count: 4450, avgTime: 380, tokens: 1980000 },
      ],
      totalTokens: 19320000,
      avgTokensPerMessage: 423,
    },
  }
}

const COLORS = {
  ORANGE: '#f97316',
  RED: '#ef4444',
  YELLOW: '#eab308',
  GREEN_BLUE: '#06b6d4',
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  })

  const mockData = useMemo(() => generateMockData(), [])

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      // Convert all data to CSV format
      const csvRows: string[] = []
      
      // Overview metrics
      csvRows.push('Section,Metric,Value')
      csvRows.push(`User Engagement,Total Active Users,${mockData.metrics.totalUsers}`)
      csvRows.push(`User Engagement,Total Conversations,${mockData.metrics.totalConversations}`)
      csvRows.push(`User Engagement,Total Messages,${mockData.metrics.totalMessages}`)
      csvRows.push(`User Engagement,Avg Session Duration,${mockData.metrics.avgSessionDuration}`)
      
      // Daily data
      csvRows.push('')
      csvRows.push('Daily Data')
      csvRows.push('Date,Active Users,New Users,Conversations,Messages,Text Input,Voice Input')
      mockData.dailyData.forEach(row => {
        csvRows.push(`${row.date},${row.activeUsers},${row.newUsers},${row.conversations},${row.messages},${row.textInput},${row.voiceInput}`)
      })
      
      // Feature usage
      csvRows.push('')
      csvRows.push('Feature Usage')
      csvRows.push('Type,Percentage,Count')
      mockData.featureUsage.textVsVoice.forEach(item => {
        csvRows.push(`${item.name},${item.value},${item.count}`)
      })
      
      // Colors
      csvRows.push('')
      csvRows.push('Color Distribution')
      csvRows.push('Color,Percentage,Time')
      mockData.colors.distribution.forEach(item => {
        csvRows.push(`${item.name},${item.value},${item.time}`)
      })
      
      // Keywords
      csvRows.push('')
      csvRows.push('Keywords')
      csvRows.push('Keyword,Count,Trend')
      mockData.keywords.forEach(item => {
        csvRows.push(`${item.keyword},${item.count},${item.trend}`)
      })
      
      // Topics
      csvRows.push('')
      csvRows.push('Topics')
      csvRows.push('Topic,Percentage,Avg Length')
      mockData.topics.forEach(item => {
        csvRows.push(`${item.name},${item.percentage},${item.avgLength}`)
      })
      
      // Worlds
      csvRows.push('')
      csvRows.push('Worlds')
      csvRows.push('World,Sessions,Messages,Users')
      mockData.worlds.forEach(item => {
        csvRows.push(`${item.name},${item.sessions},${item.messages},${item.users}`)
      })
      
      // Regions
      csvRows.push('')
      csvRows.push('Regions')
      csvRows.push('Country,Users,Sessions')
      mockData.regions.forEach(item => {
        csvRows.push(`${item.country},${item.users},${item.sessions}`)
      })
      
      // AI Models
      csvRows.push('')
      csvRows.push('AI Models')
      csvRows.push('Model,Usage %,Count,Avg Time,Tokens')
      mockData.ai.models.forEach(item => {
        csvRows.push(`${item.name},${item.usage},${item.count},${item.avgTime},${item.tokens}`)
      })
      
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `cubiqo-analytics-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (format === 'json') {
      const jsonData = {
        exportDate: new Date().toISOString(),
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
        data: mockData,
      }
      
      const jsonContent = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `cubiqo-analytics-${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 break-words">CubiQo Analytics Dashboard</h1>
            <p className="text-slate-400 text-sm lg:text-base break-words">User interactions, feature usage, and behavioral patterns</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 flex-shrink-0">
            <DateRangePicker onChange={setDateRange} defaultRange="30d" />
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm whitespace-nowrap"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm whitespace-nowrap"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: User Engagement Overview */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">User Engagement Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              value={mockData.metrics.totalUsers.toLocaleString()}
              label="Total Active Users"
              trend={{ value: mockData.metrics.userTrend, isPositive: mockData.metrics.userTrend > 0 }}
              color="orange"
            />
            <MetricCard
              value={mockData.metrics.totalConversations.toLocaleString()}
              label="Total Conversations"
              trend={{ value: mockData.metrics.conversationTrend, isPositive: mockData.metrics.conversationTrend > 0 }}
              color="red"
            />
            <MetricCard
              value={mockData.metrics.totalMessages.toLocaleString()}
              label="Total Messages Exchanged"
              trend={{ value: mockData.metrics.messageTrend, isPositive: mockData.metrics.messageTrend > 0 }}
              color="yellow"
            />
            <MetricCard
              value={mockData.metrics.avgSessionDuration}
              label="Average Session Duration"
              trend={{ value: Math.abs(mockData.metrics.durationTrend), isPositive: mockData.metrics.durationTrend > 0 }}
              color="green-blue"
            />
          </div>
          <ChartContainer title="User Growth">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>} />
                <Line type="monotone" dataKey="activeUsers" stroke={COLORS.ORANGE} strokeWidth={2} name="Daily Active Users" dot={{ fill: COLORS.ORANGE, r: 3 }} />
                <Line type="monotone" dataKey="newUsers" stroke={COLORS.GREEN_BLUE} strokeWidth={2} name="New Users" dot={{ fill: COLORS.GREEN_BLUE, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Section 2: Feature Usage Analytics */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Feature Usage Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer title="Chat vs Voice Usage">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockData.featureUsage.textVsVoice}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }: any) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockData.featureUsage.textVsVoice.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.ORANGE : COLORS.RED} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Voice Success Rate</p>
                  <p className="text-2xl font-bold text-white">{mockData.featureUsage.voiceStats.successRate}%</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">TTS Responses</p>
                  <p className="text-2xl font-bold text-white">{mockData.featureUsage.voiceStats.ttsResponses.toLocaleString()}</p>
                </div>
              </div>
            </ChartContainer>
            <ChartContainer title="Daily Input Methods">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockData.dailyData.slice(-7)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="textInput" stackId="a" fill={COLORS.ORANGE} name="Text Input" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="voiceInput" stackId="a" fill={COLORS.RED} name="Voice Input" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartContainer title="Average Message Length Over Time">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockData.dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>} />
                  <Line type="monotone" dataKey="avgResponseTime" stroke={COLORS.YELLOW} strokeWidth={2} name="Avg Length (chars)" dot={{ fill: COLORS.YELLOW, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ChartContainer title="Response Time Over Time">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockData.dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="avgResponseTime" stroke={COLORS.GREEN_BLUE} strokeWidth={2} name="Avg Response (ms)" dot={{ fill: COLORS.GREEN_BLUE, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Section 3: Cube Color Analytics */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Cube Color Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer title="Color Preference Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockData.colors.distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }: any) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockData.colors.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ChartContainer title="Time Spent Per Color">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockData.colors.distribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {mockData.colors.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer title="Time Spent Per Color Over Time">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockData.dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="red" stackId="1" stroke={COLORS.RED} fill={COLORS.RED} fillOpacity={0.6} name="RED" />
                  <Area type="monotone" dataKey="yellow" stackId="1" stroke={COLORS.YELLOW} fill={COLORS.YELLOW} fillOpacity={0.6} name="YELLOW" />
                  <Area type="monotone" dataKey="greenBlue" stackId="1" stroke={COLORS.GREEN_BLUE} fill={COLORS.GREEN_BLUE} fillOpacity={0.6} name="GREEN_BLUE" />
                  <Area type="monotone" dataKey="orange" stackId="1" stroke={COLORS.ORANGE} fill={COLORS.ORANGE} fillOpacity={0.6} name="ORANGE" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ChartContainer title="Top 5 Color Transitions">
              <div className="space-y-3">
                {mockData.colors.transitions.map((transition, index) => {
                  const colorMap: { [key: string]: string } = {
                    'ORANGE': COLORS.ORANGE,
                    'RED': COLORS.RED,
                    'YELLOW': COLORS.YELLOW,
                    'GREEN_BLUE': COLORS.GREEN_BLUE,
                  }
                  const fromColor = colorMap[transition.from] || COLORS.ORANGE
                  const toColor = colorMap[transition.to] || COLORS.RED
                  return (
                    <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: fromColor }}></div>
                            <span className="text-sm font-medium text-white whitespace-nowrap">{transition.from}</span>
                          </div>
                          <span className="text-slate-400">→</span>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: toColor }}></div>
                            <span className="text-sm font-medium text-white whitespace-nowrap">{transition.to}</span>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-white whitespace-nowrap">{transition.count.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(transition.count / mockData.colors.transitions[0].count) * 100}%`,
                            background: `linear-gradient(90deg, ${fromColor} 0%, ${toColor} 100%)`
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ChartContainer>
          </div>
        </div>

        {/* Section 4: Keywords & Topics */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Keywords & Topics Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer title="Top 20 Keywords">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockData.keywords.slice(0, 20)} layout="vertical" margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis 
                    dataKey="keyword" 
                    type="category" 
                    stroke="#9ca3af" 
                    width={120}
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill={COLORS.ORANGE} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ChartContainer title="Topic Distribution">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={mockData.topics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="percentage"
                  >
                    {mockData.topics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                    formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Section 5: World & Region Analytics */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">World & Region Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer title="World Usage Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockData.worlds}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, sessions }: any) => `${name}: ${sessions}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sessions"
                  >
                    {mockData.worlds.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ChartContainer title="Top 10 Countries by User Count">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={mockData.regions.slice(0, 10)} 
                  layout="vertical"
                  margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    type="number"
                    stroke="#9ca3af" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="country"
                    stroke="#9ca3af" 
                    tick={{ fontSize: 14 }}
                    width={120}
                    tickFormatter={(value) => {
                      const country = mockData.regions.find(r => r.country === value)
                      return country ? `${value}` : value
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number | undefined) => value ? [value.toLocaleString(), 'Users'] : ['', '']}
                    labelFormatter={(label) => {
                      const country = mockData.regions.find(r => r.country === label)
                      return country ? `${label}` : label
                    }}
                  />
                  <Bar 
                    dataKey="users" 
                    fill={COLORS.ORANGE}
                    radius={[0, 8, 8, 0]}
                    name="Users"
                  >
                    {mockData.regions.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Section 6: User Behavior & Patterns */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">User Behavior & Patterns</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer title="Peak Usage Hours">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockData.sessions.hourly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill={COLORS.YELLOW} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ChartContainer title="Daily Active Users Trend">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockData.sessions.daily} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill={COLORS.GREEN_BLUE} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard value={mockData.sessions.dau.toLocaleString()} label="Daily Active Users" color="orange" />
            <MetricCard value={mockData.sessions.wau.toLocaleString()} label="Weekly Active Users" color="red" />
            <MetricCard value={mockData.sessions.mau.toLocaleString()} label="Monthly Active Users" color="yellow" />
          </div>
          <ChartContainer title="Authentication Analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Guest', value: mockData.auth.guest },
                      { name: 'Authenticated', value: mockData.auth.authenticated },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }: any) => `${name}: ${value}`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS.ORANGE} />
                    <Cell fill={COLORS.RED} />
                  </Pie>
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center">
                <div className="bg-slate-900/50 p-6 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Guest-to-Authenticated Conversion Rate</p>
                  <p className="text-4xl font-bold text-white">{mockData.auth.conversionRate}%</p>
                </div>
              </div>
            </div>
          </ChartContainer>
        </div>

        {/* Section 7: AI & Performance Metrics */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">AI & Performance Metrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer title="AI Model Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockData.ai.models}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, usage }: any) => `${name}: ${usage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="usage"
                  >
                    {mockData.ai.models.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ChartContainer title="Average Response Time by Model">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockData.ai.models} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="avgTime" radius={[8, 8, 0, 0]}>
                    {mockData.ai.models.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <ChartContainer title="Token Usage Trends">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData.ai.models} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="tokens" radius={[8, 8, 0, 0]}>
                  {mockData.ai.models.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <MetricCard value={mockData.ai.totalTokens.toLocaleString()} label="Total Tokens Used" color="orange" />
            <MetricCard value={mockData.ai.avgTokensPerMessage} label="Avg Tokens Per Message" color="red" />
            <MetricCard value={mockData.ai.models.reduce((sum, m) => sum + m.count, 0).toLocaleString()} label="Total API Requests" color="yellow" />
          </div>
        </div>
      </div>
    </div>
  )
}

