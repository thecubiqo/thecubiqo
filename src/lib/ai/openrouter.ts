
import { createClient } from '@supabase/supabase-js'

/**
 * OpenRouter Client
 * Unified access to LLMs via standard OpenAI-compatible API
 */

export const OPENROUTER_CONFIG = {
    baseUrl: 'https://openrouter.ai/api/v1',
    headers: {
        'HTTP-Referer': 'https://cubiqo.ai', // Required by OpenRouter
        'X-Title': 'CubiQo'
    }
}

export interface OpenRouterMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface OpenRouterResponse {
    content: string
    model: string
    usage?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
    error?: string
}

export async function callOpenRouter(
    model: string,
    messages: OpenRouterMessage[],
    temperature: number = 0.7,
    maxTokens: number = 4000
): Promise<OpenRouterResponse> {
    const apiKey = process.env.CUBIQO_UNIVERSAL_KEY || process.env.OPENROUTER_KEY_CUBIKEY || process.env.OPENROUTER_API_KEY

    if (!apiKey) {
        throw new Error('OPENROUTER_KEY_CUBIKEY not configured')
    }

    try {
        const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                ...OPENROUTER_CONFIG.headers
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens
            })
        })

        if (!response.ok) {
            // Try to parse error details
            const errorBody = await response.json().catch(() => ({}))
            const errorMessage = errorBody.error?.message || `OpenRouter Error: ${response.status} ${response.statusText}`
            throw new Error(errorMessage)
        }

        const data = await response.json()

        return {
            content: data.choices[0]?.message?.content || '',
            model: data.model,
            usage: data.usage
        }

    } catch (error) {
        console.error(`[OpenRouter] Failed to call ${model}:`, error)
        throw error
    }
}
