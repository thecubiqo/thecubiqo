'use client'

import { useState, useCallback } from 'react'

interface PromptHistoryItem {
  id: string
  prompt: string
  response: string
  timestamp: Date
}

const TEMPLATES = [
  { label: 'New Component', prompt: 'Create a React component that...' },
  { label: 'Fix Bug', prompt: 'Fix the following bug in the code:' },
  { label: 'Add Test', prompt: 'Write a test for the following function:' },
  { label: 'Refactor', prompt: 'Refactor this code to improve readability:' },
]

interface PromptPaneProps {
  onCodePatch?: (code: string) => void
}

export default function PromptPane({ onCodePatch }: PromptPaneProps) {
  const [quickPrompt, setQuickPrompt] = useState('')
  const [advancedPrompt, setAdvancedPrompt] = useState('')
  const [isAdvanced, setIsAdvanced] = useState(false)
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<PromptHistoryItem[]>([])

  const handleRun = useCallback(async () => {
    const prompt = isAdvanced ? advancedPrompt : quickPrompt
    if (!prompt.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) {
        setResponse(`Error: ${res.status} ${res.statusText}`)
        return
      }

      const data = await res.json()
      const reply = data?.response || data?.content || JSON.stringify(data)
      setResponse(reply)

      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          prompt,
          response: reply,
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 20))
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }, [quickPrompt, advancedPrompt, isAdvanced])

  const handleApplyAsCode = () => {
    if (response && onCodePatch) {
      // Extract code blocks from response
      const codeMatch = response.match(/```[\s\S]*?\n([\s\S]*?)```/)
      onCodePatch(codeMatch ? codeMatch[1] : response)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-700 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Prompt
          </span>
          <button
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="text-xs text-zinc-500 hover:text-orange-400 transition-colors"
          >
            {isAdvanced ? 'Quick' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* Templates */}
      <div className="px-3 py-2 flex flex-wrap gap-1 border-b border-zinc-800 shrink-0">
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            onClick={() => {
              if (isAdvanced) setAdvancedPrompt(t.prompt)
              else setQuickPrompt(t.prompt)
            }}
            className="px-2 py-0.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2 shrink-0">
        {isAdvanced ? (
          <textarea
            value={advancedPrompt}
            onChange={(e) => setAdvancedPrompt(e.target.value)}
            placeholder="Enter detailed prompt..."
            rows={5}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
          />
        ) : (
          <input
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder="Quick prompt..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleRun()
              }
            }}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        )}
        <button
          onClick={handleRun}
          disabled={isLoading || !(isAdvanced ? advancedPrompt : quickPrompt).trim()}
          className="mt-2 w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? 'Running…' : 'Run'}
        </button>
      </div>

      {/* Response */}
      {response && (
        <div className="flex-1 overflow-auto px-3 py-2 min-h-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500">Response</span>
            {onCodePatch && (
              <button
                onClick={handleApplyAsCode}
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                Apply as Code →
              </button>
            )}
          </div>
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap bg-zinc-800/50 rounded p-2 overflow-auto max-h-full">
            {response}
          </pre>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-zinc-700 px-3 py-2 shrink-0 max-h-[150px] overflow-auto">
          <span className="text-xs text-zinc-500 mb-1 block">History</span>
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                if (isAdvanced) setAdvancedPrompt(h.prompt)
                else setQuickPrompt(h.prompt)
                setResponse(h.response)
              }}
              className="block w-full text-left text-xs text-zinc-400 hover:text-white py-1 truncate transition-colors"
            >
              {h.prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
