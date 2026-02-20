'use client';

import { useEffect, useState } from 'react';
import { LineChart, MessageSquare, BookOpen, Brain } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ConversationRow {
    id: string;
    color_state: string;
    created_at: string;
}

interface AnalyticsData {
    totalConversations: number;
    totalJournalEntries: number;
    totalMemories: number;
    recentConversations: ConversationRow[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        Promise.all([
            (supabase as any).from('conversations').select('id, color_state, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(10),
            (supabase as any).from('journal_entries').select('id', { count: 'exact' }).limit(1),
            (supabase as any).from('journey_memory').select('id', { count: 'exact' }).limit(1),
        ]).then(([convRes, journalRes, memRes]: any[]) => {
            setData({
                totalConversations: convRes.count ?? 0,
                totalJournalEntries: journalRes.count ?? 0,
                totalMemories: memRes.count ?? 0,
                recentConversations: (convRes.data as ConversationRow[]) ?? [],
            });
            setLoading(false);
        });
    }, []);

    const statCards = [
        { label: 'Conversations', value: data?.totalConversations ?? 0, icon: MessageSquare, color: 'text-blue-400' },
        { label: 'Journal Entries', value: data?.totalJournalEntries ?? 0, icon: BookOpen, color: 'text-green-400' },
        { label: 'Memories', value: data?.totalMemories ?? 0, icon: Brain, color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <LineChart className="text-blue-500" />
                Analytics
            </h1>

            {loading ? (
                <p className="text-sm text-gray-500">Loading analytics…</p>
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
                        <h2 className="text-lg font-bold mb-4">Recent Conversations</h2>
                        {data?.recentConversations.length === 0 ? (
                            <p className="text-sm text-gray-500">No conversations yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {data?.recentConversations.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                                        <span className="font-mono text-gray-400">{c.id.slice(0, 12)}…</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${c.color_state === 'green' ? 'bg-green-500/10 text-green-400' :
                                                c.color_state === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' :
                                                    c.color_state === 'red' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-gray-500/10 text-gray-400'
                                            }`}>{c.color_state}</span>
                                        <span className="text-gray-500">{new Date(c.created_at).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
