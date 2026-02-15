'use client'

import { useState } from 'react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmPhrase: string
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmPhrase,
}: ConfirmationModalProps) {
  const [input, setInput] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (input === confirmPhrase) {
      onConfirm()
      setInput('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 mb-4">{description}</p>
        <p className="text-xs text-zinc-500 mb-2">
          Type <span className="text-orange-400 font-mono">{confirmPhrase}</span> to confirm:
        </p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-orange-500 mb-4"
          placeholder={confirmPhrase}
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={input !== confirmPhrase}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
