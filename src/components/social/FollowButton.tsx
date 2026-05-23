'use client';

import { useState } from 'react';
import { UserCheck, UserPlus } from 'lucide-react';
import { authHeaders } from '@/next/lib/supabase-browser';

type Props = {
  targetUserId: string;
  initiallyFollowing?: boolean;
};

export function FollowButton({ targetUserId, initiallyFollowing = false }: Props) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const response = await fetch('/api/social/follow', {
        method: following ? 'DELETE' : 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      if (!response.ok) throw new Error('Follow request failed');
      setFollowing(value => !value);
    } finally {
      setLoading(false);
    }
  }

  const Icon = following ? UserCheck : UserPlus;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-60 ${
        following ? 'border-slate-800 bg-slate-900 text-slate-300 hover:text-rose-100' : 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      {loading ? 'Working' : following ? 'Following' : 'Follow'}
    </button>
  );
}
