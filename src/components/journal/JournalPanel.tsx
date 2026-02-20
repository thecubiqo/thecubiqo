'use client'

/**
 * Journal Panel Component (Rozana)
 * Main interface for daily journaling
 */

import { useState, useEffect } from 'react';
import JournalEntry from './JournalEntry';
import type { JournalEntry as JournalEntryType, JournalStats } from '@/lib/journal/types';

export default function JournalPanel() {
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [todayPrompt, setTodayPrompt] = useState('');
  const [newEntry, setNewEntry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'today' | 'week' | 'all'>('today');

  // Load entries and stats
  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    setIsLoading(true);

    try {
      // Load stats
      const statsRes = await fetch('/api/journal/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setTodayPrompt(statsData.todayPrompt);
      }

      // Load entries based on view
      let url = '/api/journal/entries?limit=50';
      
      if (view === 'today') {
        const today = new Date().toISOString().split('T')[0];
        url += `&dateFrom=${today}&dateTo=${today}`;
      } else if (view === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        url += `&dateFrom=${weekAgo}`;
      }

      const entriesRes = await fetch(url);
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(entriesData.entries || []);
      }
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!newEntry.trim()) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/journal/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newEntry,
          type: 'text',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEntries([data.entry, ...entries]);
        setNewEntry('');
        
        // Reload stats
        loadData();
      }
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEntry = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/journal/entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(entries.map(e => e.id === id ? data.entry : e));
      }
    } catch (error) {
      
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/journal/entries/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEntries(entries.filter(e => e.id !== id));
        loadData(); // Reload stats
      }
    } catch (error) {
      
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rozana 📓</h1>
        <p className="text-white/70">Daily Journal & Reflections</p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <div className="text-xs opacity-70">Total Entries</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs opacity-70">Day Streak 🔥</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.longestStreak}</div>
            <div className="text-xs opacity-70">Longest Streak</div>
          </div>
        </div>
      )}

      {/* Today's Prompt */}
      {todayPrompt && (
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-4 mb-6">
          <div className="text-sm font-semibold mb-2">Today's Prompt</div>
          <div className="text-lg">{todayPrompt}</div>
        </div>
      )}

      {/* New Entry */}
      <div className="bg-white/5 rounded-lg p-4 mb-6">
        <div className="text-sm font-semibold mb-3">{today}</div>
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-black/30 border border-white/20 rounded p-3 mb-3 min-h-[120px] resize-none"
          disabled={isLoading}
        />
        <div className="flex gap-2">
          <button
            onClick={handleCreateEntry}
            disabled={isLoading || !newEntry.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded font-semibold"
          >
            {isLoading ? 'Saving...' : 'Save Entry'}
          </button>
          <button
            className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded"
            disabled
          >
            🎤 Voice (Coming Soon)
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('today')}
          className={`px-4 py-2 rounded ${view === 'today' ? 'bg-blue-500' : 'bg-white/10 hover:bg-white/20'}`}
        >
          Today
        </button>
        <button
          onClick={() => setView('week')}
          className={`px-4 py-2 rounded ${view === 'week' ? 'bg-blue-500' : 'bg-white/10 hover:bg-white/20'}`}
        >
          This Week
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded ${view === 'all' ? 'bg-blue-500' : 'bg-white/10 hover:bg-white/20'}`}
        >
          All Entries
        </button>
      </div>

      {/* Entries List */}
      {isLoading && entries.length === 0 ? (
        <div className="text-center py-12 opacity-50">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 opacity-50">
          No entries yet. Start journaling!
        </div>
      ) : (
        <div>
          {entries.map((entry) => (
            <JournalEntry
              key={entry.id}
              entry={entry}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />
          ))}
        </div>
      )}

      {/* Color Distribution */}
      {stats && stats.totalEntries > 0 && (
        <div className="mt-8 bg-white/5 rounded-lg p-4">
          <div className="text-sm font-semibold mb-3">Color Distribution</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm">Red: {stats.colorDistribution.RED}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" />
              <span className="text-sm">Yellow: {stats.colorDistribution.YELLOW}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm">Green: {stats.colorDistribution.GREEN_BLUE}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
