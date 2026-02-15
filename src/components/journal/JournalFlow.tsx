'use client'

/**
 * JournalFlow Component
 * 15-20 minute guided journaling flow
 * BigBoss confessional style with Cubiqo voice
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface JournalFlowProps {
  sessionId: string | null
  userId: string | null
  onComplete: () => void
}

// Journal prompts - BigBoss confessional style
const JOURNAL_PROMPTS = [
  {
    id: 1,
    text: "Listen up. Before we dive deep, tell me... how are you feeling right now? And I mean really feeling, not what you think you should say.",
    placeholder: "I'm feeling..."
  },
  {
    id: 2,
    text: "Good. Now, what happened today that actually mattered? Not the boring stuff - what stood out, what hit different?",
    placeholder: "Today..."
  },
  {
    id: 3,
    text: "Interesting. So how did that make you feel? Did it surprise you, challenge you, lift you up? Let's get real here.",
    placeholder: "It made me feel..."
  },
  {
    id: 4,
    text: "Alright, here's the real question: What color is today for you? Green for growth, Yellow for energy and joy, Red for passion and intensity, or just staying Orange, balanced in the middle?",
    placeholder: "Today feels like..."
  },
  {
    id: 5,
    text: "Now, what did you learn from all this? Even if it's small, what insight are you taking away?",
    placeholder: "I learned that..."
  },
  {
    id: 6,
    text: "Looking ahead - what's one thing you want to accomplish tomorrow? Keep it real, keep it achievable.",
    placeholder: "Tomorrow I will..."
  },
  {
    id: 7,
    text: "And the big picture - where are you heading in the next month? What's the vision?",
    placeholder: "In a month, I want to..."
  },
  {
    id: 8,
    text: "Final question. Anything else you need to get off your chest? This is your space, your confession booth. Let it out.",
    placeholder: "One more thing..."
  }
]

export function JournalFlow({ sessionId, userId, onComplete }: JournalFlowProps) {
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [responses, setResponses] = useState<string[]>(Array(JOURNAL_PROMPTS.length).fill(''))
  const [currentResponse, setCurrentResponse] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [startTime] = useState(Date.now())
  const [mood, setMood] = useState<'neutral' | 'positive' | 'reflective' | 'challenged'>('neutral')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus textarea when prompt changes
  useEffect(() => {
    textareaRef.current?.focus()
  }, [currentPrompt])

  // Load current response
  useEffect(() => {
    setCurrentResponse(responses[currentPrompt] || '')
  }, [currentPrompt, responses])

  const handleNext = useCallback(() => {
    const newResponses = [...responses]
    newResponses[currentPrompt] = currentResponse
    setResponses(newResponses)

    if (currentPrompt < JOURNAL_PROMPTS.length - 1) {
      setCurrentPrompt(currentPrompt + 1)
    } else {
      // All prompts completed, save journal
      handleSaveJournal(newResponses)
    }
  }, [currentPrompt, currentResponse, responses])

  const handlePrevious = useCallback(() => {
    if (currentPrompt > 0) {
      const newResponses = [...responses]
      newResponses[currentPrompt] = currentResponse
      setResponses(newResponses)
      setCurrentPrompt(currentPrompt - 1)
    }
  }, [currentPrompt, currentResponse, responses])

  const handleSaveJournal = async (finalResponses: string[]) => {
    setIsSaving(true)

    try {
      // Combine all responses into journal content
      const content = JOURNAL_PROMPTS.map((prompt, idx) => {
        return `**${prompt.text}**\n\n${finalResponses[idx] || '(No response)'}\n\n---\n`
      }).join('\n')

      const durationSeconds = Math.floor((Date.now() - startTime) / 1000)

      // Detect mood from responses
      const allText = finalResponses.join(' ').toLowerCase()
      let detectedMood: 'neutral' | 'positive' | 'reflective' | 'challenged' = 'neutral'
      
      if (allText.includes('happy') || allText.includes('great') || allText.includes('excited')) {
        detectedMood = 'positive'
      } else if (allText.includes('challenge') || allText.includes('difficult') || allText.includes('struggle')) {
        detectedMood = 'challenged'
      } else if (allText.includes('learn') || allText.includes('realize') || allText.includes('understand')) {
        detectedMood = 'reflective'
      }

      // Save journal entry
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          content,
          mood: detectedMood,
          colorState: 'ORANGE',
          durationSeconds
        })
      })

      const data = await response.json()

      if (response.ok && data.entry) {
        // Queue email summary
        const emailResponse = await fetch('/api/journal/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entryId: data.entry.id,
            recipientEmail: userId ? 'user@example.com' : null, // TODO: Get real email
            userId
          })
        })

        if (!emailResponse.ok) {
          console.warn('Failed to queue email, but journal saved')
        }

        // Complete!
        onComplete()
      } else {
        alert(data.error || 'Failed to save journal')
        setIsSaving(false)
      }
    } catch (error) {
      console.error('Error saving journal:', error)
      alert('Failed to save journal. Please try again.')
      setIsSaving(false)
    }
  }

  const progress = ((currentPrompt + 1) / JOURNAL_PROMPTS.length) * 100
  const prompt = JOURNAL_PROMPTS[currentPrompt]
  const canProceed = currentResponse.trim().length > 0

  return (
    <div className="relative min-h-[70vh]">
      {/* Orange glow effects */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/60">
              Prompt {currentPrompt + 1} of {JOURNAL_PROMPTS.length}
            </span>
            <span className="text-sm text-orange-400 font-medium">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-orange-500/30 shadow-2xl shadow-orange-500/10 overflow-hidden">
          {/* Prompt */}
          <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <div className="flex-1 pt-2">
                <p className="text-lg text-white/90 leading-relaxed">
                  {prompt.text}
                </p>
              </div>
            </div>
          </div>

          {/* Response Area */}
          <div className="p-8">
            <textarea
              ref={textareaRef}
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder={prompt.placeholder}
              className="w-full h-64 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 resize-none"
              disabled={isSaving}
            />
            
            <div className="mt-4 text-sm text-white/40">
              {currentResponse.length} characters
            </div>
          </div>

          {/* Navigation */}
          <div className="px-8 pb-8 flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentPrompt === 0 || isSaving}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed || isSaving}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : currentPrompt === JOURNAL_PROMPTS.length - 1 ? (
                'Complete Journal →'
              ) : (
                'Next →'
              )}
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mt-6">
          <p className="text-sm text-white/40">
            Take your time. There's no rush here.
          </p>
        </div>
      </div>
    </div>
  )
}
