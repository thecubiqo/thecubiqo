'use client';

import { useState, useRef, useCallback } from 'react';

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
  const [streamMode, setStreamMode] = useState(false);
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
    // Push a live entry we'll update as chunks arrive
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

      // If we never got an exit event, mark as completed
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
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-2 border-b border-gray-700 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-gray-300">💻 Terminal</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStreamMode(m => !m)}
            disabled={isRunning}
            className={`text-xs px-1.5 py-0.5 rounded transition-colors disabled:opacity-50 ${
              streamMode
                ? 'bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title={streamMode ? 'Streaming mode (SSE)' : 'Batch mode (POST)'}
          >
            {streamMode ? '⚡ Stream' : '📦 Batch'}
          </button>
          <button
            onClick={() => setHistory([])}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto p-3 font-mono text-sm space-y-2 min-h-0">
        {history.length === 0 && (
          <div className="text-gray-500 text-xs">
            Welcome to CubiQo Studio Terminal. Type a command below.
          </div>
        )}
        {history.map((entry, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              <span className="text-green-400 shrink-0">$</span>
              <span className="text-gray-200">{entry.command}</span>
            </div>
            {entry.stdout && (
              <pre className="text-gray-300 whitespace-pre-wrap text-xs mt-1 ml-4">{entry.stdout}</pre>
            )}
            {entry.stderr && (
              <pre className="text-red-400 whitespace-pre-wrap text-xs mt-1 ml-4">{entry.stderr}</pre>
            )}
            {entry.exitCode !== null && entry.exitCode !== 0 && (
              <div className="text-red-500 text-xs mt-0.5 ml-4">exit code: {entry.exitCode}</div>
            )}
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">{streamMode ? 'Streaming...' : 'Running...'}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-gray-700 shrink-0">
        <div className="flex items-center gap-2 bg-gray-900 rounded px-3 py-2">
          <span className="text-green-400 text-sm font-mono shrink-0">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRunning ? 'Running...' : 'Enter command...'}
            disabled={isRunning}
            className="flex-1 bg-transparent text-sm text-gray-200 font-mono outline-none placeholder-gray-600 disabled:opacity-50"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
