'use client'

/**
 * Voice State Indicator
 * Visual feedback for voice states: idle → listening → thinking → speaking
 * 
 * Shows clear state with color-coded animations and labels
 * WCAG 2.1 AA compliant with proper ARIA labels
 * 
 * Author: Bubbles (Frontend Developer)
 * Sprint 1: Voice State Transitions UI
 */

import { Mic, Brain, Volume2, Circle } from 'lucide-react'

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface VoiceStateIndicatorProps {
  state: VoiceState
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function VoiceStateIndicator({
  state,
  className = '',
  showLabel = true,
  size = 'md'
}: VoiceStateIndicatorProps) {
  const getStateConfig = (state: VoiceState) => {
    switch (state) {
      case 'idle':
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-800/50',
          borderColor: 'border-gray-700',
          label: 'Ready',
          Icon: Circle,
          animate: false,
          ariaLabel: 'Voice is ready - click to start'
        }
      case 'listening':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/50',
          label: 'Listening',
          Icon: Mic,
          animate: true,
          ariaLabel: 'Currently listening - speak now'
        }
      case 'thinking':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/50',
          label: 'Thinking',
          Icon: Brain,
          animate: true,
          ariaLabel: 'Processing your request'
        }
      case 'speaking':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/50',
          label: 'Speaking',
          Icon: Volume2,
          animate: true,
          ariaLabel: 'Currently speaking - listening to response'
        }
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-8 h-8',
          icon: 'w-4 h-4',
          label: 'text-xs'
        }
      case 'md':
        return {
          container: 'w-12 h-12',
          icon: 'w-5 h-5',
          label: 'text-sm'
        }
      case 'lg':
        return {
          container: 'w-16 h-16',
          icon: 'w-7 h-7',
          label: 'text-base'
        }
    }
  }

  const config = getStateConfig(state)
  const sizeClasses = getSizeClasses()
  const Icon = config.Icon

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Container */}
      <div
        className={`relative ${sizeClasses.container} ${config.bgColor} ${config.borderColor} 
                   border-2 rounded-full flex items-center justify-center`}
        role="status"
        aria-label={config.ariaLabel}
      >
        <Icon className={`${sizeClasses.icon} ${config.color}`} aria-hidden="true" />
        
        {/* Animated Pulse Rings */}
        {config.animate && (
          <>
            {/* Outer Ring - Slower pulse */}
            <div
              className={`absolute inset-0 ${config.borderColor} border-2 rounded-full 
                         motion-safe:animate-ping opacity-75`}
              style={{ animationDuration: '2s' }}
              aria-hidden="true"
            />
            {/* Inner Ring - Faster pulse */}
            <div
              className={`absolute inset-[-4px] ${config.borderColor} border rounded-full 
                         motion-safe:animate-pulse opacity-50`}
              style={{ animationDuration: '1s' }}
              aria-hidden="true"
            />
          </>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex flex-col">
          <span className={`${sizeClasses.label} font-medium ${config.color}`}>
            {config.label}
          </span>
          {config.animate && (
            <span className="text-xs text-gray-500">
              {state === 'listening' && 'Speak clearly...'}
              {state === 'thinking' && 'Processing...'}
              {state === 'speaking' && 'Listen...'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Voice State Bar - Horizontal bar showing all states
 */
interface VoiceStateBarProps {
  currentState: VoiceState
  className?: string
}

export function VoiceStateBar({ currentState, className = '' }: VoiceStateBarProps) {
  const states: Array<{ state: VoiceState; label: string }> = [
    { state: 'idle', label: 'Ready' },
    { state: 'listening', label: 'Listening' },
    { state: 'thinking', label: 'Thinking' },
    { state: 'speaking', label: 'Speaking' }
  ]

  const getStateIndex = (state: VoiceState) => {
    return states.findIndex(s => s.state === state)
  }

  const currentIndex = getStateIndex(currentState)

  return (
    <div className={`flex items-center gap-2 ${className}`} role="status" aria-label={`Voice state: ${currentState}`}>
      {states.map((item, index) => {
        const isActive = item.state === currentState
        const isPast = index < currentIndex
        const isFuture = index > currentIndex

        return (
          <div key={item.state} className="flex items-center gap-2">
            {/* State Circle */}
            <div
              className={`relative w-3 h-3 rounded-full transition-all duration-300
                         ${isActive ? 'scale-125' : 'scale-100'}
                         ${isPast ? 'bg-gray-600' : ''}
                         ${isActive && currentState === 'listening' ? 'bg-red-400 motion-safe:animate-pulse' : ''}
                         ${isActive && currentState === 'thinking' ? 'bg-yellow-400 motion-safe:animate-pulse' : ''}
                         ${isActive && currentState === 'speaking' ? 'bg-green-400 motion-safe:animate-pulse' : ''}
                         ${isFuture ? 'bg-gray-800 border border-gray-700' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-full motion-safe:animate-ping opacity-75" />
              )}
            </div>

            {/* Connector Line */}
            {index < states.length - 1 && (
              <div className={`w-8 h-0.5 transition-colors duration-300
                              ${index < currentIndex ? 'bg-gray-600' : 'bg-gray-800'}`} 
                   aria-hidden="true" />
            )}
          </div>
        )
      })}
      
      {/* Current State Label */}
      <span className="ml-3 text-sm text-gray-400">
        {states[currentIndex]?.label}
      </span>
    </div>
  )
}
