'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Shield, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
    id: string;
    email: string | null;
    is_admin: boolean | null;
    created_at: string;
    cq_number: number | null;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        (supabase as any)
            .from('profiles')
            .select('id, email, is_admin, created_at, cq_number')
            .order('created_at', { ascending: false })
            .limit(50)
            .then(({ data, error: err }: { data: UserProfile[] | null; error: { message: string } | null }) => {
                if (err) setError(err.message);
                else setUsers(data ?? []);
                setLoading(false);
            });
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="text-purple-500" />
                Users
            </h1>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading users…</p>
                ) : error ? (
                    <p className="text-sm text-red-400">Error: {error}</p>
                ) : users.length === 0 ? (
                    <p className="text-sm text-gray-500">No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-400">
                                    <th className="py-3 px-4"><Mail size={14} className="inline mr-1" />Email</th>
                                    <th className="py-3 px-4">CQ#</th>
                                    <th className="py-3 px-4"><Shield size={14} className="inline mr-1" />Role</th>
                                    <th className="py-3 px-4"><Clock size={14} className="inline mr-1" />Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 font-mono text-gray-300">{u.email ?? '—'}</td>
                                        <td className="py-3 px-4 text-gray-400">{u.cq_number ? `CQ#${u.cq_number}` : '—'}</td>
                                        <td className="py-3 px-4">
                                            {u.is_admin ? (
                                                <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs">Admin</span>
                                            ) : (
                                                <span className="text-gray-600 text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
