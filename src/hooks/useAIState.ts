import { useState, useCallback, useEffect } from 'react'

/**
 * AI State Machine
 * States: Listening → Thinking → Speaking → Idle
 */
export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking'

export function useAIState() {
    const [state, setState] = useState<AIState>('idle')
    const [lastState, setLastState] = useState<AIState>('idle')

    const setAIState = useCallback((newState: AIState) => {
        setLastState(state)
        setState(newState)

        // Log state transition for event-only logs
        console.log(`[AI STATE] ${state} -> ${newState}`)
    }, [state])

    return {
        state,
        lastState,
        setAIState,
        isIdle: state === 'idle',
        isListening: state === 'listening',
        isThinking: state === 'thinking',
        isSpeaking: state === 'speaking'
    }
}
