'use client';

import { useCallback, useEffect, useState } from 'react';
import { authHeaders } from '@/next/lib/supabase-browser';
import type { ActivityFeedEvent } from '@/next/types/social';

const EVENT_LABELS: Record<string, string> = {
  followed_you: 'started following you',
  shared_memory: 'shared a memory',
  completed_project: 'completed a project',
  reacted_to_your_content: 'reacted to your content',
  proactive_nudge_shared: 'shared an AI insight',
  new_follow: 'started following you',
  project_completed: 'completed a project',
  reaction_given: 'reacted to your content'
};

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityFeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (before?: string) => {
    setError('');
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) throw new Error('Authentication required');
      const response = await fetch(`/api/social/feed?limit=20${before ? `&before=${encodeURIComponent(before)}` : ''}`, { headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load feed');
      setEvents(current => before ? [...current, ...(data.events || [])] : (data.events || []));
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="text-sm text-slate-400">Loading feed...</div>;
  if (error) return <div className="text-sm text-rose-200">{error}</div>;
  if (!events.length) return <div className="text-sm text-slate-400">No activity yet.</div>;

  return (
    <div className="space-y-3">
      {events.map(event => (
        <div key={event.id} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-neutral-950 p-3 text-sm">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-semibold text-slate-300">
            {event.actorId.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-slate-200">
              <span className="font-medium">{event.actorName || event.actorId.slice(0, 8)}</span>{' '}
              {EVENT_LABELS[event.eventType] || event.eventType}
            </div>
            <div className="mt-1 text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</div>
          </div>
        </div>
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={() => load(events[events.length - 1]?.createdAt)}
          className="rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
        >
          Load more
        </button>
      )}
    </div>
  );
}
