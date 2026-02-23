
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testChatApi() {
    console.log('Testing Chat API...');
    const key = process.env.OPENROUTER_KEY_CUBIKEY;
    const minimaxKey = process.env.MINIMAX_API_KEY || process.env.MINIMAX_KEY;
    console.log('OpenRouter Key present:', !!key);
    console.log('Minimax Key present:', !!minimaxKey);
    if (key) console.log('OpenRouter Key starts with:', key.substring(0, 10));
    if (minimaxKey) console.log('Minimax Key starts with:', minimaxKey.substring(0, 10));

    try {
        console.log('\n--- Test 1: Yellow Zone (OpenRouter) ---');
        const res = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `[FOUNDER CONTEXT] I'm the founder of CubiQo deciding which features to enable. 
                    Current feature states: []. 
                    User question: Configure a safe 'Read-Only' public mode`,
                currentColor: 'ORANGE',
                isFounder: true
            })
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch failed:', error);
        require('fs').writeFileSync('verify-chat.log', `Fetch failed: ${error}\n`, { flag: 'a' });
    }

    try {
        console.log('\n--- Test 2: Green Zone (Minimax) ---');
        const res = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Hello, this is a test for Minimax.`,
                currentColor: 'GREEN_BLUE', // Triggers Green Zone
                isFounder: false
            })
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch failed for Minimax:', error);
    }
}

testChatApi().then(() => {
    // Write success log if finished (or failure caught above)
}).catch(err => {
    require('fs').writeFileSync('verify-chat.log', `Script crashed: ${err}\n`, { flag: 'a' });
});

testChatApi();
