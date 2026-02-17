
import { MINIMAX_CONFIG } from './providers'

// MiniMax API call (primary)
export async function callMiniMax(
    systemPrompt: string,
    messages: { role: string; content: string }[]
): Promise<string> {
    const apiKey = process.env.MINIMAX_API_KEY || process.env.MINIMAX_KEY

    if (!apiKey) {
        throw new Error('MINIMAX_API_KEY or MINIMAX_KEY not configured')
    }

    // Build messages for MiniMax API
    const minimaxMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }))
    ]

    const response = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
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

    // Check for API-level errors in the response body
    if (data.base_resp && data.base_resp.status_code !== 0) {
        console.error('MiniMax API returned error:', data.base_resp)
        throw new Error(`MiniMax API Error: ${data.base_resp.status_msg} (Code: ${data.base_resp.status_code})`)
    }

    // MiniMax returns choices similar to OpenAI
    if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content
    }

    console.error('Invalid MiniMax response:', JSON.stringify(data, null, 2))
    throw new Error(`Invalid MiniMax response format. Response: ${JSON.stringify(data)}`)
}
