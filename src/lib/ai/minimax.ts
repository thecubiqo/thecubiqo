import { ENV } from '@/lib/config/env'
import { MINIMAX_CONFIG } from './providers'

// MiniMax API call (primary)
export async function callMiniMax(
    systemPrompt: string,
    messages: { role: string; content: string }[]
): Promise<string> {
    const apiKey = ENV.ai.minimax

    if (!apiKey) {
        throw new Error('MINIMAX_KEY not configured')
    }

    // Build messages for MiniMax API
    const minimaxMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }))
    ]

    const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: MINIMAX_CONFIG.model,
            messages: minimaxMessages,
            max_tokens: MINIMAX_CONFIG.maxTokens,
            temperature: 0.7
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('MiniMax API error:', response.status, errorText)
        throw new Error(`MiniMax API error: ${response.status}`)
    }

    const data = await response.json()

    // MiniMax V2 returns base_resp with status_code
    if (data.base_resp && data.base_resp.status_code !== 0) {
        const errorMsg = data.base_resp.status_msg || 'Unknown MiniMax error'
        console.error('MiniMax Business Error:', data.base_resp)
        throw new Error(`MiniMax API error: ${errorMsg} (Code: ${data.base_resp.status_code})`)
    }

    // MiniMax returns choices similar to OpenAI
    if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content
    }

    throw new Error('Invalid MiniMax response format: missing choices or content')
}
