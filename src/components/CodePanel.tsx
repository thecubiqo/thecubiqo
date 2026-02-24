'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGE_MONACO_MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  bash: 'shell',
};

interface CodeExecution {
  id: string;
  language: 'python' | 'javascript' | 'typescript' | 'bash';
  code: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  timestamp: Date;
}

export default function CodePanel() {
  const [language, setLanguage] = useState<'python' | 'javascript' | 'typescript' | 'bash'>('python');
  const [code, setCode] = useState('');
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState<CodeExecution[]>([]);
  const [currentResult, setCurrentResult] = useState<CodeExecution | null>(null);
  const [execError, setExecError] = useState<string | null>(null);

  const executeCode = async () => {
    if (!code.trim()) return;

    setExecuting(true);
    setExecError(null);
    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code }),
      });

      const result = await response.json();

      if (!response.ok) {
        setExecError(result.error || `Request failed with status ${response.status}`);
        return;
      }

      const execution: CodeExecution = {
        id: Date.now().toString(),
        language,
        code,
        ...result,
        timestamp: new Date(),
      };

      setCurrentResult(execution);
      setHistory(prev => [execution, ...prev].slice(0, 10)); // Keep last 10
    } catch (error) {
      setExecError(error instanceof Error ? error.message : 'Unexpected error during execution');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Code Execution</h2>
        <div className="flex gap-2 mb-2">
          {(['python', 'javascript', 'typescript', 'bash'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 rounded ${
                language === lang
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {/* Monaco Code Editor */}
        <div className="flex-1 min-h-[200px] rounded overflow-hidden border border-gray-700">
          <MonacoEditor
            height="100%"
            language={LANGUAGE_MONACO_MAP[language]}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-gray-800 text-gray-400 text-sm">
                Loading editor…
              </div>
            }
          />
        </div>

        {/* Execute Button */}
        <button
          onClick={executeCode}
          disabled={executing || !code.trim()}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
        >
          {executing ? 'Executing...' : 'Run Code'}
        </button>

        {/* Execution Error */}
        {execError && (
          <div className="bg-red-900/50 border border-red-700 p-3 rounded text-sm text-red-300">
            <span className="font-semibold">Error: </span>{execError}
          </div>
        )}

        {/* Output */}
        {currentResult && (
          <div className="bg-gray-800 p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                Executed in {currentResult.executionTime}ms
              </span>
              <span
                className={`text-sm ${
                  currentResult.exitCode === 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                Exit code: {currentResult.exitCode}
              </span>
            </div>

            {currentResult.stdout && (
              <div className="mb-2">
                <div className="text-xs text-gray-400 mb-1">stdout:</div>
                <pre className="text-sm text-green-300 whitespace-pre-wrap">
                  {currentResult.stdout}
                </pre>
              </div>
            )}

            {currentResult.stderr && (
              <div>
                <div className="text-xs text-gray-400 mb-1">stderr:</div>
                <pre className="text-sm text-red-300 whitespace-pre-wrap">
                  {currentResult.stderr}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm text-gray-400 mb-2">Recent Executions</h3>
            <div className="space-y-2">
              {history.map((exec) => (
                <button
                  key={exec.id}
                  onClick={() => {
                    setCode(exec.code);
                    setLanguage(exec.language);
                    setCurrentResult(exec);
                    setExecError(null);
                  }}
                  className="w-full text-left p-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                >
                  <div className="flex justify-between">
                    <span className="text-gray-400">{exec.language}</span>
                    <span
                      className={
                        exec.exitCode === 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {exec.exitCode === 0 ? '✓' : '✗'}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-500 truncate mt-1">
                    {exec.code.split('\n')[0]}
                  </pre>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
