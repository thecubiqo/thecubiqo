'use client';

<<<<<<< HEAD
import { useEffect, useState } from 'react';
=======
import { useState, useEffect } from 'react';
  const [loading, setLoading] = useState(false);
>>>>>>> b476b3480b62c47d994c1c684d0813767c9b6f29
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Account {
    id: string;
    username: string;
    platform: string;
    persona_type: string;
    status: string;
}

interface Content {
    id: string;
    content_type: string;
    generation_status: 'pending' | 'processing' | 'ready' | 'posted' | 'failed';
    caption: string | null;
    asset_url: string | null;
    posted_at: string | null;
    accounts: Account | null; // Joined
}

export default function SocialArmyDashboard() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [contentQueue, setContentQueue] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

<<<<<<< HEAD
    // Polling for updates every 5 seconds
    const fetchData = async () => {
        // 1. Fetch Army
        const { data: accData } = await supabase
            .from('social_accounts')
            .select('*')
            .order('platform');
=======
    useEffect(() => {
    setLoading(true);
        const fetchData = async () => {
            // Fetch active campaigns
            const { data: campaignsData } = await supabase
                .from('social_campaigns')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
>>>>>>> b476b3480b62c47d994c1c684d0813767c9b6f29

        if (accData) setAccounts(accData);

        // 2. Fetch Content Queue
        const { data: queueData } = await supabase
            .from('content_queue')
            .select('*, accounts:social_accounts(*)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (queueData) setContentQueue(queueData as any);

<<<<<<< HEAD
        setLoading(false);
=======
        fetchData();

        // Realtime subscription
        const channel = supabase
            .channel('social-army')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'content_queue' }, (payload) => {
                
                fetchData(); // Refresh on change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleLaunch = async () => {
        setIsDeploying(true);
        // Create a new campaign
        const { error } = await supabase.from('social_campaigns').insert({
            name: `Auto-Campaign ${new Date().toLocaleTimeString()}`,
            seed_topic: 'AI Revolution',
            status: 'running',
            total_posts_target: 100
        });

        if (error) {
            
        } else {
            // Refresh
            const { data } = await supabase.from('social_campaigns').select('*').order('created_at', { ascending: false }).limit(5);
            if (data) setCampaigns(data.map(c => ({ id: c.id, name: c.name, status: c.status || 'draft', progress: 0 })));
        }

        setTimeout(() => setIsDeploying(false), 1000);
>>>>>>> b476b3480b62c47d994c1c684d0813767c9b6f29
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Live updates
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-8 text-center text-white">Loading Army Intel...</div>;

    return (
        <div className="p-8 space-y-8 bg-black min-h-screen text-white">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                        ⚔️ Social Army Command
                    </h1>
                    <p className="text-gray-400">Manage your autonomous agents and content machine.</p>
                </div>
                <div className="flex gap-4">
                    <Badge variant="outline" className="text-green-400 border-green-400 px-4 py-2">
                        worker: ACTIVE
                    </Badge>
                </div>
            </header>

            {/* 1. Soldier Roster */}
            <section>
                <h2 className="text-xl font-semibold mb-4 text-purple-300">💂 Soldier Roster ({accounts.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {accounts.map((acc) => (
                        <Card key={acc.id} className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-colors">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300 flex justify-between">
                                    {acc.platform.toUpperCase()}
                                    <span className={`w-2 h-2 rounded-full ${acc.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-lg font-bold text-white">@{acc.username}</div>
                                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{acc.persona_type}</div>
                            </CardContent>
                        </Card>
                    ))}
                    {accounts.length === 0 && (
                        <div className="col-span-full text-gray-500 italic">No soldiers recruited yet. Run the SQL script!</div>
                    )}
                </div>
            </section>

            {/* 2. Content Factory (Live Feed) */}
            <section>
                <h2 className="text-xl font-semibold mb-4 text-pink-300">🏭 Content Factory (Live Feed)</h2>
                <div className="space-y-4">
                    {contentQueue.map((item) => (
                        <Card key={item.id} className="bg-gray-900 border-gray-800">
                            <CardContent className="p-4 flex flex-col md:flex-row gap-6">

                                {/* Status Indicator */}
                                <div className="w-full md:w-48 flex-shrink-0 flex flex-col gap-2">
                                    <Badge className={`w-fit ${item.generation_status === 'posted' ? 'bg-green-600' :
                                            item.generation_status === 'ready' ? 'bg-blue-600' :
                                                item.generation_status === 'processing' ? 'bg-yellow-600 animate-pulse' :
                                                    item.generation_status === 'failed' ? 'bg-red-600' :
                                                        'bg-gray-600'
                                        }`}>
                                        {item.generation_status.toUpperCase()}
                                    </Badge>
                                    <div className="text-xs text-gray-400">
                                        {item.accounts?.platform} &bull; @{item.accounts?.username}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Type: {item.content_type}
                                    </div>
                                </div>

                                {/* Content Display */}
                                <div className="flex-grow space-y-3">
                                    {/* Caption */}
                                    {item.caption ? (
                                        <p className="text-gray-200 text-sm whitespace-pre-wrap font-mono bg-black/30 p-3 rounded border border-gray-800">
                                            {item.caption}
                                        </p>
                                    ) : (
                                        <div className="h-12 bg-gray-800/50 rounded animate-pulse" />
                                    )}

                                    {/* Media Asset */}
                                    {item.asset_url && (
                                        <div className="mt-2">
                                            {item.content_type === 'image' ? (
                                                <img src={item.asset_url} alt="Generated Asset" className="max-h-64 rounded-lg border border-gray-700" />
                                            ) : item.content_type === 'video' ? (
                                                <video controls src={item.asset_url} className="max-h-64 rounded-lg border border-gray-700" />
                                            ) : (
                                                <a href={item.asset_url} target="_blank" className="text-blue-400 hover:underline text-sm flex items-center gap-2">
                                                    🔗 View Asset: {item.asset_url}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </CardContent>
                        </Card>
                    ))}
                    {contentQueue.length === 0 && (
                        <div className="text-gray-500 italic p-8 border border-dashed border-gray-800 rounded">
                            No tasks in queue. Insert tasks via SQL to test!
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
