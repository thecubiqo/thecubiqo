'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function DashboardStats() {
    const { user, isAuthenticated, isLoading } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Only allow aditya@cubiqo.ai or dev environment
        if (!isLoading) {
            if (!isAuthenticated || (user?.email !== 'aditya@cubiqo.ai' && process.env.NODE_ENV !== 'development')) {
                // router.push('/') // Uncomment to enforce
            }
        }
    }, [user, isAuthenticated, isLoading, router])

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/ai-stats')
            if (!res.ok) throw new Error('Failed to fetch stats')
            const data = await res.json()
            setStats(data.stats)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const resetStats = async () => {
        if (!confirm('Are you sure you want to reset all stats?')) return
        try {
            await fetch('/api/ai-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' })
            })
            fetchStats()
        } catch (e) {
            alert('Failed to reset')
        }
    }

    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!stats) return <div className="text-white/50">Loading stats...</div>

    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">AI Cost Analytics</h2>
                <button
                    onClick={resetStats}
                    className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30"
                >
                    Reset Stats
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Requests" value={stats.totalRequests} />
                <StatCard label="Ollama Requests" value={stats.ollamaRequests} color="text-green-400" />
                <StatCard label="Cloud Requests" value={stats.cloudRequests} color="text-yellow-400" />
                <StatCard label="Est. Savings" value={`$${stats.savingsFromOllama.toFixed(4)}`} color="text-emerald-400" />
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Ollama Usage</span>
                        <span className="text-green-400">{stats.ollamaPercentage}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: stats.ollamaPercentage }}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Cloud Usage</span>
                        <span className="text-yellow-400">{stats.cloudPercentage}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-yellow-500 transition-all duration-500"
                            style={{ width: stats.cloudPercentage }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, color = 'text-white' }: { label: string, value: string | number, color?: string }) {
    return (
        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="text-xs text-white/40 mb-1">{label}</div>
            <div className={`text-2xl font-mono ${color}`}>{value}</div>
        </div>
    )
}
