'use client';

/**
 * DuoMode active-project dashboard — canonical 3-pane layout per
 * CubiQo-UI-Architecture.md SCREEN 5.
 *
 *  ┌──────────┬───────────────────┬────────────────────────┐
 *  │ CHAT     │   TASK BOARD      │   ARTIFACT PANE        │
 *  │ (256px)  │   (340px)         │   (flex-1)             │
 *  └──────────┴───────────────────┴────────────────────────┘
 *
 * Mounted under the (app) shell which hides its right RGY panel
 * on /duo/[id]/* — this page IS the agentic surface.
 */

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock3,
  CircleDashed,
  ExternalLink,
  HelpCircle,
  Loader2,
  Play,
  RefreshCw,
  Send,
  ShieldAlert,
  Square,
  X
} from 'lucide-react';
import { ArtifactPane, type DuoArtifactView } from '@/next/components/duo/ArtifactPane';
import { useDuoStream } from '@/next/hooks/useDuoStream';
import { authHeaders } from '@/next/lib/supabase-browser';
import { apiGet, apiSend, formatDate, statusTone } from '../../_components/client-api';

type DuoTask = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  notes?: string | null;
  question_text?: string | null;
  approval_required?: boolean | null;
  approval_description?: string | null;
  on_reject_note?: string | null;
  expires_at?: string | null;
  selected_route?: string | null;
  assigned_route?: string | null;
  assigned_surface?: string | null;
  risk_level?: string | null;
  result?: string | null;
  last_error?: string | null;
};

type DuoEdge = {
  id?: string;
  from_task_id?: string | null;
  to_task_id?: string | null;
};

type DuoProject = {
  id: string;
  goal?: string | null;
  title?: string | null;
  status?: string | null;
  color?: string | null;
  domain?: string | null;
  api_cost_gbp?: number | null;
  budget_gate_gbp?: number | null;
  verbosity?: string | null;
  updated_at?: string | null;
};

type ProjectPayload = {
  project: DuoProject;
  tasks: DuoTask[];
  edges?: DuoEdge[];
  timeline?: Array<Record<string, any>>;
  outcomes?: Array<Record<string, any>>;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

const STATUS_ORDER: Array<{
  key: string;
  label: string;
  tone: string;
  match: (status?: string | null) => boolean;
}> = [
  {
    key: 'done',
    label: 'DONE',
    tone: 'border-emerald-400/30 text-emerald-300',
    match: s => s === 'done' || s === 'completed' || s === 'succeeded'
  },
  {
    key: 'working',
    label: 'IN PROGRESS',
    tone: 'border-amber-400/30 text-amber-300',
    match: s => s === 'working' || s === 'running' || s === 'leased' || s === 'queued'
  },
  {
    key: 'awaiting_user',
    label: 'NEEDS YOUR INPUT',
    tone: 'border-cyan-300/30 text-cyan-300',
    match: s => s === 'awaiting_user' || s === 'waiting_user'
  },
  {
    key: 'waiting_approval',
    label: 'NEEDS APPROVAL',
    tone: 'border-violet-400/30 text-violet-300',
    match: s => s === 'waiting_approval'
  },
  {
    key: 'pending',
    label: 'PENDING',
    tone: 'border-slate-600/30 text-slate-400',
    match: s => !s || s === 'pending' || s === 'ready' || s === 'blocked' || s === 'waiting_access'
  },
  {
    key: 'failed',
    label: 'FAILED',
    tone: 'border-rose-400/30 text-rose-300',
    match: s => s === 'failed' || s === 'cancelled' || s === 'skipped' || s === 'dead_lettered'
  }
];

function capsuleTone(color?: string | null) {
  const c = String(color || 'yellow').toLowerCase();
  if (c === 'green')
    return { dot: 'bg-emerald-400', label: 'GREEN', border: 'border-emerald-400/40', text: 'text-emerald-200' };
  if (c === 'red')
    return { dot: 'bg-rose-400', label: 'RED', border: 'border-rose-400/40', text: 'text-rose-200' };
  return { dot: 'bg-amber-400', label: 'YELLOW', border: 'border-amber-400/40', text: 'text-amber-200' };
}

function statusIcon(status?: string | null) {
  if (status === 'done' || status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />;
  if (status === 'working' || status === 'running') return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />;
  if (status === 'waiting_approval') return <ShieldAlert className="h-3.5 w-3.5 text-violet-300" />;
  if (status === 'awaiting_user' || status === 'waiting_user') return <HelpCircle className="h-3.5 w-3.5 text-cyan-300" />;
  if (status === 'failed' || status === 'blocked') return <X className="h-3.5 w-3.5 text-rose-300" />;
  if (status === 'ready') return <Clock3 className="h-3.5 w-3.5 text-slate-400" />;
  return <CircleDashed className="h-3.5 w-3.5 text-slate-500" />;
}

function parseSseChunk(chunk: string) {
  const deltas: string[] = [];
  for (const line of chunk.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed.delta === 'string') deltas.push(parsed.delta);
      if (typeof parsed.text === 'string') deltas.push(parsed.text);
    } catch {
      deltas.push(data);
    }
  }
  return deltas.join('');
}

export default function DuoProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [payload, setPayload] = useState<ProjectPayload | null>(null);
  const [artifact, setArtifact] = useState<DuoArtifactView | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Chat pane state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const stream = useDuoStream(id);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<ProjectPayload>(`/api/duo/projects/${id}`);
      setPayload(data);
      // Try latest artifact (project-level)
      try {
        const art = await apiGet<{ artifact?: DuoArtifactView }>(`/api/duo/projects/${id}/artifact`);
        if (art?.artifact) setArtifact(art.artifact);
      } catch {
        /* artifact endpoint optional */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load project');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  // Realtime: when the stream emits task_update, refetch the project payload
  useEffect(() => {
    if (!stream.messages.length) return;
    const last = stream.messages[stream.messages.length - 1];
    if (last?.type === 'task_update' || last?.type === 'done' || last?.type === 'artifact_created') {
      load();
    }
  }, [stream.messages.length]);

  // Autoscroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function loadTaskArtifact(taskId: string) {
    setSelectedTaskId(taskId);
    try {
      const data = await apiGet<{ artifact?: DuoArtifactView }>(`/api/duo/artifacts/${taskId}/latest`);
      if (data?.artifact) setArtifact(data.artifact);
    } catch {
      /* not every task produces an artifact */
    }
  }

  async function executeTask(taskId: string) {
    try {
      await apiSend(`/api/duo/tasks/${taskId}/execute`, 'POST', {});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not execute task');
    }
  }

  async function shoot() {
    if (!confirm('Stop this project? Artifacts will be kept.')) return;
    try {
      await apiSend(`/api/duo/projects/${id}/shoot`, 'POST', {});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not stop project');
    }
  }

  async function sendChat(event: FormEvent) {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || chatStreaming) return;
    setChatInput('');
    setChatStreaming(true);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };
    const assistantId = crypto.randomUUID();
    setMessages(current => [
      ...current,
      userMessage,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() }
    ]);

    try {
      const headers = await authHeaders();
      const history = messages.slice(-12).map(({ role, content }) => ({ role, content }));
      const res = await fetch(`/api/agent/stream`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history, project_id: id })
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Chat request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const delta = parseSseChunk(decoder.decode(value, { stream: true }));
        if (!delta) continue;
        setMessages(current =>
          current.map(m => (m.id === assistantId ? { ...m, content: m.content + delta } : m))
        );
      }
    } catch (err) {
      setMessages(current =>
        current.map(m =>
          m.id === assistantId
            ? { ...m, content: err instanceof Error ? err.message : 'Chat failed.' }
            : m
        )
      );
    } finally {
      setChatStreaming(false);
    }
  }

  const project = payload?.project;
  const allTasks = useMemo(() => payload?.tasks || [], [payload?.tasks]);
  const tasksByStatus = useMemo(() => {
    return STATUS_ORDER.map(group => ({
      ...group,
      tasks: allTasks.filter(task => group.match(task.status))
    })).filter(group => group.tasks.length > 0);
  }, [allTasks]);

  const tone = capsuleTone(project?.color);
  const cost = Number(project?.api_cost_gbp || 0);
  const cap = Number(project?.budget_gate_gbp || 2);
  const budgetPct = Math.min(100, Math.round((cost / Math.max(cap, 0.01)) * 100));

  if (loading && !payload) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading project…
      </div>
    );
  }
  if (error && !payload) {
    return (
      <div className="m-6 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Header bar */}
      <header className={`flex shrink-0 items-center gap-3 border-b border-slate-800 px-4 py-2.5 ${tone.border}`}>
        <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
        <div className="min-w-0">
          <div className={`text-[0.6rem] font-bold tracking-[0.2em] ${tone.text}`}>
            {tone.label} · {(project?.domain || 'general').toUpperCase()}
          </div>
          <h1 className="truncate text-sm font-semibold text-slate-100">
            {project?.title || project?.goal || 'Project'}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Budget bar */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="text-[0.65rem] text-slate-500">
              £{cost.toFixed(2)} / £{cap.toFixed(2)}
            </div>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-900">
              <div
                className={`h-full ${budgetPct > 80 ? 'bg-rose-400' : budgetPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>

          {/* Stream status */}
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.65rem] ${
              stream.connected
                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${stream.connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {stream.connected ? 'live' : 'idle'}
          </span>

          {/* Status pill */}
          <span className={`rounded-md border px-2 py-0.5 text-[0.65rem] uppercase tracking-wider ${statusTone(project?.status)}`}>
            {project?.status || 'draft'}
          </span>

          <button
            onClick={load}
            className="rounded-md border border-slate-800 p-1.5 text-slate-300 hover:bg-slate-900"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {project?.status !== 'done' && project?.status !== 'shot' && project?.status !== 'failed' && (
            <button
              onClick={shoot}
              className="inline-flex items-center gap-1 rounded-md border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-100 hover:bg-rose-500/20"
            >
              <Square className="h-3 w-3" /> Stop
            </button>
          )}
        </div>
      </header>

      {/* 3-pane body */}
      <div className="flex min-h-0 flex-1">
        {/* LEFT — Chat panel (256px on desktop, collapses on small) */}
        <section className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-neutral-950/95 md:flex">
          <div className="border-b border-slate-800 px-3 py-2 text-[0.6rem] font-bold tracking-[0.2em] text-slate-500">
            CONVERSATION
          </div>
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <p className="text-xs leading-5 text-slate-500">
                Talk to CubiQo about this capsule. Messages here are scoped to the project — CubiQo will reference the goal,
                tasks, and artifacts.
              </p>
            ) : (
              <div className="space-y-2.5">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`rounded-lg border px-3 py-2 text-xs leading-5 ${
                      m.role === 'user'
                        ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-50'
                        : 'border-slate-800 bg-slate-950 text-slate-200'
                    }`}
                  >
                    {m.content || (m.role === 'assistant' && chatStreaming ? '…' : '')}
                  </div>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={sendChat} className="flex gap-1.5 border-t border-slate-800 p-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask CubiQo about this project…"
              className="min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={chatStreaming || !chatInput.trim()}
              className="grid h-7 w-7 place-items-center rounded-md bg-cyan-300 text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </section>

        {/* MIDDLE — Task board (340px, sectioned by status) */}
        <section className="flex w-full shrink-0 flex-col border-r border-slate-800 bg-neutral-950/95 md:w-[340px]">
          <div className="border-b border-slate-800 px-3 py-2 text-[0.6rem] font-bold tracking-[0.2em] text-slate-500">
            TASKS · {allTasks.length}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {tasksByStatus.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 p-4 text-xs text-slate-500">
                No tasks yet. CubiQo will plan them once the capsule is launched.
              </div>
            ) : (
              <div className="space-y-4">
                {tasksByStatus.map(group => (
                  <section key={group.key}>
                    <div className={`mb-1.5 flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.18em] ${group.tone.split(' ').filter(c => c.startsWith('text')).join(' ')}`}>
                      <span>{group.label}</span>
                      <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[0.55rem] text-slate-400">
                        {group.tasks.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.tasks.map(task => {
                        const selected = selectedTaskId === task.id;
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => loadTaskArtifact(task.id)}
                            className={`w-full rounded-lg border p-2.5 text-left transition ${
                              selected
                                ? 'border-cyan-400/50 bg-cyan-400/5'
                                : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                            } ${(task.status === 'done' || task.status === 'completed') ? 'opacity-70' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">{statusIcon(task.status)}</div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-semibold text-slate-100">
                                  {task.title || task.description?.slice(0, 60) || 'Untitled task'}
                                </div>
                                {task.notes && (
                                  <div className="mt-1 line-clamp-2 text-[0.7rem] text-slate-400">{task.notes}</div>
                                )}
                                {task.question_text && (
                                  <div className="mt-1 text-[0.7rem] text-cyan-200">{task.question_text}</div>
                                )}
                                {task.approval_description && (
                                  <div className="mt-1 line-clamp-2 text-[0.7rem] text-violet-200">
                                    {task.approval_description}
                                  </div>
                                )}
                                <div className="mt-1.5 flex flex-wrap gap-1 text-[0.6rem]">
                                  {(task.selected_route || task.assigned_route) && (
                                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-slate-400">
                                      {task.selected_route || task.assigned_route}
                                    </span>
                                  )}
                                  {task.risk_level && (
                                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-slate-400">
                                      risk · {task.risk_level}
                                    </span>
                                  )}
                                  {task.assigned_surface && (
                                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-slate-400">
                                      ➜ {task.assigned_surface}
                                    </span>
                                  )}
                                </div>
                                {(task.status === 'ready' || task.status === 'pending') && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      executeTask(task.id);
                                    }}
                                    className="mt-2 inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:bg-slate-800"
                                  >
                                    <Play className="h-2.5 w-2.5" /> Run
                                  </button>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT — Artifact pane (flex-1, fills) */}
        <section className="flex min-w-0 flex-1 flex-col bg-slate-950">
          <div className="border-b border-slate-800 px-4 py-2 text-[0.6rem] font-bold tracking-[0.2em] text-slate-500">
            ARTIFACT {artifact ? `· ${artifact.title || 'Latest'}` : ''}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {artifact ? (
              <ArtifactPane artifact={artifact} />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-800 p-6 text-sm text-slate-500">
                Select a task on the left to see its artifact. CubiQo writes drafts, files, code, and reports here as it
                works.
              </div>
            )}

            {/* Recent timeline events fallback below artifact */}
            {(payload?.timeline?.length ?? 0) > 0 && (
              <div className="mt-6 rounded-lg border border-slate-800 bg-neutral-950">
                <div className="border-b border-slate-800 px-3 py-2 text-[0.6rem] font-bold tracking-[0.2em] text-slate-500">
                  TIMELINE
                </div>
                <div className="divide-y divide-slate-800">
                  {(payload?.timeline || []).slice(0, 8).map(event => (
                    <div key={event.id} className="px-3 py-2 text-xs">
                      <div className="text-slate-200">
                        {event.summary || event.message || event.event_type || 'Event'}
                      </div>
                      <div className="mt-0.5 text-[0.65rem] text-slate-500">{formatDate(event.created_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outcomes section if any */}
            {(payload?.outcomes?.length ?? 0) > 0 && (
              <div className="mt-4 rounded-lg border border-slate-800 bg-neutral-950">
                <div className="border-b border-slate-800 px-3 py-2 text-[0.6rem] font-bold tracking-[0.2em] text-slate-500">
                  OUTCOMES
                </div>
                <div className="divide-y divide-slate-800">
                  {(payload?.outcomes || []).map((o: any) => (
                    <div key={o.id} className="px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[0.6rem] ${
                            o.outcome === 'success'
                              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                              : o.outcome === 'shot'
                                ? 'border-rose-400/40 bg-rose-400/10 text-rose-200'
                                : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                          }`}
                        >
                          {o.outcome || 'outcome'}
                        </span>
                        <span className="text-[0.65rem] text-slate-500">{formatDate(o.created_at)}</span>
                      </div>
                      {o.summary && <p className="mt-1 text-slate-300">{o.summary}</p>}
                      {o.url && (
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[0.7rem] text-cyan-300 hover:text-cyan-200"
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
