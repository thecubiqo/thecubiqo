'use client';

import { useState, useRef, useCallback } from 'react';

export default function TerminalPanel() {
  const [history, setHistory] = useState<Array<{ command: string; stdout: string; stderr: string; exitCode: number | null }>>([]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim() || isRunning) return;

    setIsRunning(true);
    setInput('');

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
    } finally {
      setIsRunning(false);
      scrollToBottom();
    }
  }, [isRunning, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand(input);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-2 border-b border-gray-700 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-gray-300">💻 Terminal</h3>
        <div className="flex gap-2">
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
            <span className="text-xs">Running...</span>
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
