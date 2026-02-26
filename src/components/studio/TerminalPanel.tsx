'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Terminal as TerminalIcon, Zap, Play, Trash2, Box, Cpu } from 'lucide-react';

type HistoryEntry = { command: string; stdout: string; stderr: string; exitCode: number | null };

const WORKSPACE_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : 'studio-default';

export default function TerminalPanel() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const historyIndex = useRef(-1);
  const [streamMode, setStreamMode] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // Batch mode: POST and wait for full response
  const executeBatch = useCallback(async (command: string) => {
    try {
      const response = await fetch('/api/code/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.trim(), timeout: 30 }),
      });

      const result = await response.json();

      if (!response.ok) {
        setHistory(prev => [...prev, {
          command,
          stdout: '',
          stderr: result.error || `Error: ${response.status}`,
          exitCode: 1,
        }]);
      } else {
        setHistory(prev => [...prev, {
          command,
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          exitCode: result.exitCode ?? 0,
        }]);
      }
    } catch (error) {
      setHistory(prev => [...prev, {
        command,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Network error',
        exitCode: 1,
      }]);
    }
  }, []);

  // Stream mode: POST then read SSE events in real-time
  const executeStream = useCallback(async (command: string) => {
    const entryIndex = history.length;
    setHistory(prev => [...prev, { command, stdout: '', stderr: '', exitCode: null }]);

    const controller = new AbortController();
    abortRef.current = controller;

    const updateEntry = (updater: (entry: HistoryEntry) => HistoryEntry) => {
      setHistory(prev => prev.map((e, i) => (i === entryIndex ? updater(e) : e)));
      scrollToBottom();
    };

    try {
      const response = await fetch('/api/emergent/terminal/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: WORKSPACE_ID, command: command.trim(), timeout: 60 }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => `Error: ${response.status}`);
        updateEntry(e => ({ ...e, stderr: text, exitCode: 1 }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6);
            switch (currentEvent) {
              case 'stdout':
                updateEntry(e => ({ ...e, stdout: e.stdout + data + '\n' }));
                break;
              case 'stderr':
                updateEntry(e => ({ ...e, stderr: e.stderr + data + '\n' }));
                break;
              case 'exit': {
                try {
                  const parsed = JSON.parse(data);
                  updateEntry(e => ({ ...e, exitCode: parsed.exitCode ?? 0 }));
                } catch {
                  updateEntry(e => ({ ...e, exitCode: 0 }));
                }
                break;
              }
              case 'error':
                updateEntry(e => ({ ...e, stderr: e.stderr + data + '\n', exitCode: 1 }));
                break;
            }
            currentEvent = '';
          }
        }
      }

      setHistory(prev => prev.map((e, i) =>
        i === entryIndex && e.exitCode === null ? { ...e, exitCode: 0 } : e
      ));
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        updateEntry(e => ({
          ...e,
          stderr: e.stderr + (error instanceof Error ? error.message : 'Stream error') + '\n',
          exitCode: 1,
        }));
      }
    } finally {
      abortRef.current = null;
    }
  }, [history.length, scrollToBottom]);

  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim() || isRunning) return;

    setIsRunning(true);
    setInput('');
    setCommandHistory(prev => [command.trim(), ...prev]);
    historyIndex.current = -1;

    try {
      if (streamMode) {
        await executeStream(command);
      } else {
        await executeBatch(command);
      }
    } finally {
      setIsRunning(false);
      scrollToBottom();
    }
  }, [isRunning, streamMode, executeBatch, executeStream, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex.current + 1, commandHistory.length - 1);
        historyIndex.current = newIndex;
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex.current > 0) {
        const newIndex = historyIndex.current - 1;
        historyIndex.current = newIndex;
        setInput(commandHistory[newIndex]);
      } else {
        historyIndex.current = -1;
        setInput('');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-2xl font-mono relative overflow-hidden">
      {/* HUD Status Bar */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Bash Uplink</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-bold text-white/20 uppercase">Core: Stable</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setStreamMode(m => !m)}
            disabled={isRunning}
            className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all flex items-center gap-1.5 ${streamMode
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,255,255,0.1)]'
              : 'bg-white/5 text-white/30 hover:text-white border border-transparent'
              }`}
          >
            {streamMode ? <Zap className="w-2.5 h-2.5" /> : <Box className="w-2.5 h-2.5" />}
            {streamMode ? 'Stream' : 'Batch'}
          </button>
          <button
            onClick={() => setHistory([])}
            className="p-1 text-white/20 hover:text-red-400 transition-colors"
            title="Purge History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output HUD */}
      <div className="flex-1 overflow-auto p-5 space-y-3 min-h-0 custom-scrollbar selection:bg-cyan-500/30">
        {history.length === 0 && (
          <div className="space-y-2 opacity-30">
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{'>>'} CubiQo Studio Terminal OS [v1.0.4]</div>
            <div className="text-[10px] font-bold uppercase text-white/60 font-sans">Awaiting command input for kernel execution...</div>
          </div>
        )}
        {history.map((entry, i) => (
          <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-cyan-500 font-black tracking-tighter shrink-0 cursor-default">{'λ'}</span>
              <span className="text-white font-bold tracking-tight">{entry.command}</span>
            </div>
            {entry.stdout && (
              <pre className="text-cyan-200/60 whitespace-pre-wrap text-[11px] mt-1.5 pl-4 border-l border-white/5 font-mono leading-relaxed">{entry.stdout}</pre>
            )}
            {entry.stderr && (
              <pre className="text-red-400/80 whitespace-pre-wrap text-[11px] mt-1.5 pl-4 border-l border-red-500/20 font-mono leading-relaxed">{entry.stderr}</pre>
            )}
            {entry.exitCode !== null && entry.exitCode !== 0 && (
              <div className="text-[9px] font-black uppercase text-red-500/60 mt-1 pl-4 tracking-widest italic">Return Code: {entry.exitCode}</div>
            )}
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-3 pl-4">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60 italic">Processing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Module */}
      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="relative group overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-cyan-500/5 group-focus-within:bg-cyan-500/10 transition-colors" />
          <div className="relative flex items-center gap-3 px-4 py-3">
            <span className="text-cyan-500 text-xs font-black select-none shrink-0 italic">{isRunning ? '??' : '>_'}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRunning ? 'SYSTEM_LOCKED_PENDING_RESPONSE...' : 'EXECUTE_CMD...'}
              disabled={isRunning}
              className="flex-1 bg-transparent text-xs text-white font-bold tracking-widest outline-none placeholder-white/10 disabled:opacity-50 uppercase"
              autoFocus
            />
            {!isRunning && input.trim() && (
              <button
                onClick={() => executeCommand(input)}
                className="text-cyan-400 hover:text-white transition-colors animate-in zoom-in-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
