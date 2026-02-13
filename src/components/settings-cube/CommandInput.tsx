'use client'

/**
 * Command Input Component
 * Terminal-style input with preset command buttons
 */

import { useState, KeyboardEvent } from 'react'

interface CommandInputProps {
  onExecute: (command: string) => void
}

const PRESET_COMMANDS = [
  { label: 'RED', cmd: "cubiqo.color.lock('RED')" },
  { label: 'YELLOW', cmd: "cubiqo.color.lock('YELLOW')" },
  { label: 'GREEN', cmd: "cubiqo.color.lock('GREEN_BLUE')" },
  { label: 'ORANGE', cmd: "cubiqo.color.lock('ORANGE')" },
  { label: 'listening', cmd: "cubiqo.animation.set('listening')" },
  { label: 'thinking', cmd: "cubiqo.animation.set('thinking')" },
  { label: 'speaking', cmd: "cubiqo.animation.set('speaking')" },
  { label: 'reset', cmd: 'cubiqo.reset()' },
]

export function CommandInput({ onExecute }: CommandInputProps) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      onExecute(input.trim())
      setInput('')
    }
  }

  const handleExecute = () => {
    if (input.trim()) {
      onExecute(input.trim())
      setInput('')
    }
  }

  return (
    <div className="p-4 border-t border-green-900/50 bg-black/80">
      {/* Preset buttons */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {PRESET_COMMANDS.map(({ label, cmd }) => (
          <button
            key={cmd}
            onClick={() => onExecute(cmd)}
            className="px-3 py-1.5 text-xs bg-green-900/30 hover:bg-green-900/60
                       rounded border border-green-800/50 hover:border-green-600
                       transition-colors duration-150"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Input field */}
      <div className="flex gap-3 items-center">
        <span className="text-green-500 text-lg">{'>'}</span>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="cubiqo.color.lock('RED')"
          className="flex-1 bg-transparent outline-none placeholder-green-800/60
                     text-green-400 font-mono text-sm py-2"
          autoFocus
          spellCheck={false}
        />
        <button
          onClick={handleExecute}
          disabled={!input.trim()}
          className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-green-900/30
                     disabled:text-green-800 rounded text-sm font-medium
                     transition-colors duration-150"
        >
          Execute
        </button>
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-green-800/60">
        Commands: cubiqo.color.lock(), cubiqo.animation.set(), cubiqo.voice.set(), cubiqo.reset()
      </div>
    </div>
  )
}
