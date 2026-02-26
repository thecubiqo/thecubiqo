'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Shield, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
    id: string;
    email: string | null;
    display_name: string | null;
    is_admin: boolean;
    created_at: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    return headers;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const headers = await getAuthHeaders();
                const res = await fetch('/api/admin/users', { headers });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || `HTTP ${res.status}`);
                }
                const json = await res.json();
                setUsers(json.users ?? []);
                setTotal(json.total ?? 0);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load users');
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="text-purple-500" />
                Users {!loading && !error && <span className="text-base font-normal text-gray-400">({total.toLocaleString()})</span>}
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
                                    <th className="py-3 px-4">Display Name</th>
                                    <th className="py-3 px-4"><Shield size={14} className="inline mr-1" />Role</th>
                                    <th className="py-3 px-4"><Clock size={14} className="inline mr-1" />Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 font-mono text-gray-300">{u.email ?? '—'}</td>
                                        <td className="py-3 px-4 text-gray-400">{u.display_name ?? '—'}</td>
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
