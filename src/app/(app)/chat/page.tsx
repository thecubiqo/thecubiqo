'use client';

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mic, RotateCcw, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { authHeaders } from '@/next/lib/supabase-browser';
import { apiGet } from '../_components/client-api';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

type Signal = {
  id: string;
  color?: string | null;
  keyword?: string | null;
  confidence?: number | null;
  summary?: string | null;
};

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

function colorTone(color?: string | null) {
  const c = String(color || 'yellow').toLowerCase();
  if (c === 'green') return { dot: 'bg-emerald-400', border: 'border-emerald-400/40', text: 'text-emerald-200', label: 'GREEN' };
  if (c === 'red') return { dot: 'bg-rose-400', border: 'border-rose-400/40', text: 'text-rose-200', label: 'RED' };
  return { dot: 'bg-amber-400', border: 'border-amber-400/40', text: 'text-amber-200', label: 'YELLOW' };
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const prefillMessage = searchParams.get('q') || '';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "I'm here. Give me the goal, blocker, or mess on the table.",
      createdAt: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState(prefillMessage);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [recordingSupported] = useState(() => typeof window !== 'undefined' && 'webkitSpeechRecognition' in window);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoFiredRef = useRef(false);

  const history = useMemo(
    () => messages.filter(m => m.id !== 'welcome').map(({ role, content }) => ({ role, content })),
    [messages]
  );

  async function refreshSignal() {
    try {
      const data = await apiGet<{ signals?: Signal[] }>('/api/signals');
      const latest = (data.signals || [])[0];
      if (latest) setActiveSignal(latest);
    } catch {
      /* signal panel is optional */
    }
  }

  useEffect(() => {
    refreshSignal();
  }, []);

  // Auto-fire the prefill message once on mount (from onboarding ?q= param)
  useEffect(() => {
    if (prefillMessage && !autoFiredRef.current) {
      autoFiredRef.current = true;
      // Small delay so the page and auth are fully settled
      const timer = setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as FormEvent;
        setInput(prefillMessage);
        // Use a synthetic submit after the input state settles
        setTimeout(() => {
          const form = document.querySelector('form');
          form?.requestSubmit();
        }, 100);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [prefillMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isStreaming) return;

    setError('');
    setInput('');
    setIsStreaming(true);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };
    const assistantId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString()
    };
    setMessages(current => [...current, userMessage, assistantMessage]);

    try {
      const headers = await authHeaders();
      const res = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: history.slice(-12) })
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Request failed: ${res.status}`);
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
      setError(err instanceof Error ? err.message : 'Chat failed');
      setMessages(current =>
        current.map(m =>
          m.id === assistantId
            ? { ...m, content: 'I could not complete that response. Try again in a moment.' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      refreshSignal();
    }
  }

  function startVoiceCapture() {
    if (!recordingSupported) return;
    const Recognition = (window as any).webkitSpeechRecognition;
    const recog = new Recognition();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) setInput(current => (current ? `${current} ${transcript}` : transcript));
    };
    recog.start();
  }

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col px-4 py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">Live conversation</p>
          <h2 className="text-xl font-semibold text-slate-50">Chat</h2>
        </div>
        <button
          type="button"
          onClick={() => setMessages([])}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-neutral-950/80 p-4"
      >
        <div className="space-y-3">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[84%] whitespace-pre-wrap rounded-lg border px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-50'
                    : 'border-slate-800 bg-slate-950 text-slate-100'
                }`}
              >
                {message.content || (message.role === 'assistant' && isStreaming ? '…' : '')}
              </div>
            </div>
          ))}
        </div>

        {/* Inline RGY capsule signal card — appears after AI response when a signal exists */}
        {activeSignal && !isStreaming && (
          <div
            className={`mt-4 rounded-lg border ${colorTone(activeSignal.color).border} bg-slate-950/60 p-4`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${colorTone(activeSignal.color).dot}`} />
              <span className={`text-[0.65rem] font-bold tracking-[0.2em] ${colorTone(activeSignal.color).text}`}>
                {colorTone(activeSignal.color).label}
              </span>
              <span className="text-sm font-semibold text-slate-100">{activeSignal.keyword || 'New capsule'}</span>
              {activeSignal.confidence != null && (
                <span className="ml-auto text-[0.65rem] text-slate-500">
                  {Math.round(Number(activeSignal.confidence) * 100)}% confidence
                </span>
              )}
            </div>
            {activeSignal.summary && (
              <p className="mb-3 line-clamp-2 text-sm text-slate-300">{activeSignal.summary}</p>
            )}
            <div className="flex gap-2">
              <Link
                href="/duo"
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-200"
              >
                <Sparkles className="h-3.5 w-3.5" /> Launch in DuoMode
              </Link>
              <button
                type="button"
                onClick={() => setActiveSignal(null)}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-900"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          <ShieldCheck className="h-4 w-4" />
          {error}
        </div>
      )}

      <form onSubmit={send} className="mt-3 flex gap-2">
        {recordingSupported && (
          <button
            type="button"
            onClick={startVoiceCapture}
            className="grid h-11 w-11 place-items-center rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-900"
            title="Voice input"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
        <input
          value={input}
          onChange={event => setInput(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
          placeholder="Type a message…"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading chat…</div>}>
      <ChatPageInner />
    </Suspense>
  );
}
