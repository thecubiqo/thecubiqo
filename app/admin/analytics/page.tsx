'use client';

import { useEffect, useState } from 'react';
import { LineChart, MessageSquare, BookOpen, Brain, Users, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AnalyticsData {
    totalUsers: number;
    activeUsers7d: number;
    activeUsers30d: number;
    totalSessions: number;
    activeSessions: number;
    avgSessionDurationMinutes: number;
    totalConversations: number;
    totalMessages: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    return headers;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const headers = await getAuthHeaders();
                const res = await fetch('/api/admin/analytics/overview', { headers });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || `HTTP ${res.status}`);
                }
                const json = await res.json();
                const d = json.data ?? {};
                setData({
                    totalUsers: d.users?.total ?? 0,
                    activeUsers7d: d.users?.active7d ?? 0,
                    activeUsers30d: d.users?.active30d ?? 0,
                    totalSessions: d.sessions?.total ?? 0,
                    activeSessions: d.sessions?.activeNow ?? 0,
                    avgSessionDurationMinutes: d.sessions?.avgDurationMinutes ?? 0,
                    totalConversations: d.content?.totalConversations ?? 0,
                    totalMessages: d.content?.totalMessages ?? 0,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    const statCards = [
        { label: 'Total Users', value: data?.totalUsers ?? 0, icon: Users, color: 'text-blue-400' },
        { label: 'Active (7d)', value: data?.activeUsers7d ?? 0, icon: Activity, color: 'text-green-400' },
        { label: 'Active (30d)', value: data?.activeUsers30d ?? 0, icon: Activity, color: 'text-teal-400' },
        { label: 'Total Sessions', value: data?.totalSessions ?? 0, icon: LineChart, color: 'text-purple-400' },
        { label: 'Conversations', value: data?.totalConversations ?? 0, icon: MessageSquare, color: 'text-yellow-400' },
        { label: 'Total Messages', value: data?.totalMessages ?? 0, icon: Brain, color: 'text-pink-400' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <LineChart className="text-blue-500" />
                Analytics
            </h1>

            {loading ? (
                <p className="text-sm text-gray-500">Loading analytics…</p>
            ) : error ? (
                <p className="text-sm text-red-400">Error: {error}</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {statCards.map((card) => (
                            <div key={card.label} className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center gap-4">
                                <card.icon size={32} className={card.color} />
                                <div>
                                    <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
                                    <p className="text-sm text-gray-400">{card.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-bold mb-4">Session Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-gray-400">Active Now</p>
                                <p className="text-2xl font-bold text-green-400">{data?.activeSessions ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Avg Session Duration</p>
                                <p className="text-2xl font-bold">{(data?.avgSessionDurationMinutes ?? 0).toFixed(1)} min</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Avg Messages / Conversation</p>
                                <p className="text-2xl font-bold">
                                    {data && data.totalConversations > 0
                                        ? (data.totalMessages / data.totalConversations).toFixed(1)
                                        : '0.0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
