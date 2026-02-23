
import 'dotenv/config'

async function testOpenRouter() {
    const apiKey = process.env.CUBIQO_UNIVERSAL_KEY || process.env.OPENROUTER_KEY_CUBIKEY || process.env.OPENROUTER_API_KEY
    const model = 'google/gemini-2.0-flash-exp:free' // Use a free model for testing if possible, or standard

    console.log('--- OpenRouter Diagnostic ---')
    console.log(`API Key present: ${!!apiKey}`)
    if (apiKey) console.log(`API Key starts with: ${apiKey.substring(0, 8)}...`)

    if (!apiKey) {
        console.error('❌ No API key found in environment')
        return
    }

    try {
        console.log(`Testing connection to ${model}...`)
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://cubiqo.ai',
                'X-Title': 'CubiQo Diagnostic'
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: 'Hello, are you online?' }],
                max_tokens: 50
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`)
            console.error(`Response body: ${error}`)
        } else {
            const data = await response.json()
            console.log('✅ Success!')
            console.log('Response:', data.choices[0]?.message?.content)
        }

    } catch (e) {
        console.error('❌ Network/Fetch Error:', e)
    }
}

testOpenRouter()
