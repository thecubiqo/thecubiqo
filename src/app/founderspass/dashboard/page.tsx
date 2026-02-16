'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FeatureFlag {
    id: string
    name: string
    description: string
    enabled_for_production: boolean // Mapped from 'enabled'
    risk_level: 'safe' | 'warning' | 'dangerous' // Mapped from config or hardcoded
    category: string // Mapped from scope or hardcoded
    feature_id: string // Mapped from name
}

interface Activity {
    id: string
    agent_name: string
    action: string
    status: 'running' | 'success' | 'error'
    timestamp: string
    details?: string
}

export default function Dashboard() {
    const [features, setFeatures] = useState<FeatureFlag[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalAgents: 12,
        activeSessions: 3,
        totalCost: '$4.20',
        errorRate: '0.1%'
    })
    const [saving, setSaving] = useState<string | null>(null)
    const [activities, setActivities] = useState<Activity[]>([])

    // Chat state
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchFeatures()
        // Simulate real-time activity stream
        const interval = setInterval(() => {
            addRandomActivity()
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const fetchFeatures = async () => {
        try {
            // Updated to use the new API if possible, or we restore the old one.
            // Let's assume we restored /api/admin/features
            const res = await fetch('/api/admin/features')
            if (res.ok) {
                const data = await res.json()
                setFeatures(data.features || [])
            }
        } catch (error) {
            console.error('Failed to fetch features', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleFeature = async (feature: FeatureFlag) => {
        setSaving(feature.feature_id)
        try {
            const newState = !feature.enabled_for_production

            // Optimistic update
            setFeatures(prev => prev.map(f =>
                f.feature_id === feature.feature_id
                    ? { ...f, enabled_for_production: newState }
                    : f
            ))

            const res = await fetch('/api/admin/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feature_id: feature.feature_id,
                    enabled: newState
                })
            })

            if (!res.ok) throw new Error('Failed to update')

        } catch (error) {
            console.error('Update failed', error)
            // Revert
            setFeatures(prev => prev.map(f =>
                f.feature_id === feature.feature_id
                    ? { ...f, enabled_for_production: !f.enabled_for_production }
                    : f
            ))
        } finally {
            setSaving(null)
        }
    }

    const addRandomActivity = () => {
        const agents = ['Henry', 'Dev', 'Writer', 'Tester']
        const actions = ['Analyzing code...', 'Running tests...', 'Writing documentation...', 'Fixing bugs...']
        const statuses: ('running' | 'success' | 'error')[] = ['running', 'success', 'success', 'success', 'error']

        const newActivity: Activity = {
            id: Math.random().toString(),
            agent_name: agents[Math.floor(Math.random() * agents.length)],
            action: actions[Math.floor(Math.random() * actions.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            timestamp: new Date().toLocaleTimeString()
        }

        setActivities(prev => [newActivity, ...prev].slice(0, 10))
    }

    const sendChat = async () => {
        if (!chatInput.trim()) return

        const userMsg = chatInput
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setChatInput('')
        setChatLoading(true)

        // Simulate AI response for now (or connect to real chat API)
        setTimeout(() => {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `I've analyzed the risk. Enabling "${userMsg.includes('browser') ? 'Browser Automation' : 'Email Integration'}" typically requires user consent. I recommend keeping it disabled for the general public until we add the consent flow.`
            }])
            setChatLoading(false)
        }, 1500)
    }

    if (loading) return <div className="p-8 text-white">Loading dashboard...</div>

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Founders Dashboard
                        </h1>
                        <p className="text-gray-400">Control center for CubiQo Global</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={fetchFeatures} className="px-4 py-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Agents', value: stats.totalAgents, color: 'text-purple-400' },
                        { label: 'Active Sessions', value: stats.activeSessions, color: 'text-blue-400' },
                        { label: 'Total Cost', value: stats.totalCost, color: 'text-green-400' },
                        { label: 'Error Rate', value: stats.errorRate, color: 'text-red-400' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Feature Gates */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Feature Gates
                        </h2>

                        {['tools', 'integrations', 'admin', 'general'].map(category => (
                            <div key={category} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                                <div className="px-6 py-3 bg-gray-800/50 border-b border-gray-800 font-medium uppercase text-xs tracking-wider text-gray-400">
                                    {category}
                                </div>
                                <div className="divide-y divide-gray-800">
                                    {features.filter(f => f.category === category || (category === 'general' && !['tools', 'integrations', 'admin'].includes(f.category))).map(feature => (
                                        <div key={feature.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div>
                                                <div className="font-medium text-gray-200">{feature.name}</div>
                                                <div className="text-sm text-gray-500">{feature.description}</div>
                                                {feature.risk_level === 'dangerous' && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/50 text-red-400 border border-red-900">
                                                        DANGEROUS
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => toggleFeature(feature)}
                                                disabled={saving === feature.feature_id}
                                                className={`
                                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black
                                                    ${feature.enabled_for_production ? 'bg-green-500' : 'bg-gray-600'}
                                                    ${saving === feature.feature_id ? 'opacity-50' : ''}
                                                `}
                                            >
                                                <div className={`
                                                    absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all
                                                    ${feature.enabled_for_production ? 'left-6' : 'left-0.5'}
                                                `} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: AI Assistant */}
                    <div className="lg:sticky lg:top-8 h-fit space-y-8">
                        {/* Chat */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    💬 Ask CubiQo
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    Get recommendations on feature rollouts
                                </p>
                            </div>

                            <div className="h-64 overflow-y-auto p-4 space-y-4">
                                {chatMessages.length === 0 ? (
                                    <div className="text-center text-gray-500 text-sm py-4">
                                        Ask me about feature safety or user adoption predictions.
                                    </div>
                                ) : (
                                    chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${msg.role === 'user'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-800 text-gray-200'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 border-t border-gray-800 flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                                    placeholder="Ask about features..."
                                    className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                                <button
                                    onClick={sendChat}
                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 text-sm"
                                >
                                    Send
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Stream */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800">
                                <h2 className="text-lg font-semibold text-white">🔴 Live Activity</h2>
                            </div>
                            <div className="max-h-64 overflow-y-auto divide-y divide-gray-800 font-mono text-xs">
                                {activities.map(activity => (
                                    <div key={activity.id} className="p-3 hover:bg-white/5">
                                        <div className="flex justify-between text-gray-500 mb-1">
                                            <span>{activity.timestamp}</span>
                                            <span className={
                                                activity.status === 'success' ? 'text-green-400' :
                                                    activity.status === 'error' ? 'text-red-400' : 'text-blue-400'
                                            }>{activity.status.toUpperCase()}</span>
                                        </div>
                                        <div className="text-gray-300">
                                            <span className="text-purple-400">{activity.agent_name}</span>: {activity.action}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
