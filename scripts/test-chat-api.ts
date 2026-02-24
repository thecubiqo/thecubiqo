
import 'dotenv/config'

async function testChatApi() {
    console.log('Testing /api/chat...')
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Hello CubiQo",
                currentColor: 'ORANGE',
                isFounder: true
            })
        })

        console.log(`Status: ${response.status}`)
        const text = await response.text()
        console.log(`Body: ${text}`)

    } catch (e) {
        console.error('Fetch failed:', e)
    }
}

testChatApi()
