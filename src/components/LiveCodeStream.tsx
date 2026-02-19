'use client';

import { useState, useEffect } from 'react';

interface ActivityEvent {
  timestamp: Date;
  agentId: string;
  agentName: string;
  action: string;
  details: string;
  status: 'running' | 'success' | 'error';
}

export default function LiveCodeStream() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Poll for agent activity every 2 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();

        const newEvents: ActivityEvent[] = [];

        for (const agent of data.agents) {
          // Check tasks
          for (const task of agent.currentTasks) {
            const existing = events.find((e) => e.details === task.id);
            if (!existing) {
              newEvents.push({
                timestamp: new Date(task.startedAt || Date.now()),
                agentId: agent.id,
                agentName: agent.name,
                action: task.status === 'running' ? 'Working on' : task.status === 'done' ? 'Completed' : 'Started',
                details: task.description,
                status: task.status === 'done' ? 'success' : task.status === 'failed' ? 'error' : 'running',
              });
            }
          }
        }

        if (newEvents.length > 0) {
          setEvents((prev) => [...newEvents, ...prev].slice(0, 100)); // Keep last 100 events
        }
      } catch (error) {
        
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [events]);

  useEffect(() => {
    if (autoScroll && events.length > 0) {
      const container = document.getElementById('activity-stream');
      if (container) {
        container.scrollTop = 0;
      }
    }
  }, [events, autoScroll]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-bold">🔴 Live Coding Activity</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{events.length} events</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      <div
        id="activity-stream"
        className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm"
      >
        {events.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Waiting for agent activity...
          </div>
        ) : (
          events.map((event, i) => (
            <div
              key={i}
              className={`p-3 rounded border-l-4 ${
                event.status === 'success'
                  ? 'bg-green-900/20 border-green-500'
                  : event.status === 'error'
                  ? 'bg-red-900/20 border-red-500'
                  : 'bg-blue-900/20 border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      event.status === 'running' ? 'bg-blue-400 animate-pulse' : 
                      event.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  <span className="font-semibold text-white">{event.agentName}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300">{event.action}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="text-gray-300 ml-4">
                {event.details}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
