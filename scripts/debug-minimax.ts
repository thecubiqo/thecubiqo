
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testMinimax() {
    console.log('Testing Minimax API...');
    const apiKey = process.env.MINIMAX_API_KEY || process.env.MINIMAX_KEY;

    if (!apiKey) {
        console.error('ERROR: MINIMAX_API_KEY is not set in .env.local');
        return;
    }

    console.log('MINIMAX_API_KEY is present.');

    const models = [
        'MiniMax-M2',
        'minimax-m2-her',
        'MiniMax-M2-Her',
        'abab6.5s',
    ];
    const endpoints = [
        'https://api.minimax.io/v1/text/chatcompletion_v2',
        'https://api.minimax.io/v1/text/chatcompletion_pro',
        'https://api.minimax.io/v1/text/chatcompletion',
        'https://api.minimaxi.chat/v1/text/chatcompletion_v2', // The one in code
        'https://api.minimax.chat/v1/text/chatcompletion_v2'
    ];

    for (const endpoint of endpoints) {
        console.log(`\nTesting Endpoint: ${endpoint}`);
        for (const model of models) {
            console.log(`  Testing Model: ${model}`);
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant.' },
                            { role: 'user', content: 'Hello, are you working?' }
                        ],
                        max_tokens: 50,
                        temperature: 0.7
                    })
                });

                console.log(`    Status: ${response.status}`);
                const data = await response.json();

                if (response.ok && data.base_resp && data.base_resp.status_code === 0) {
                    console.log('    SUCCESS!');
                    console.log('    Response:', JSON.stringify(data, null, 2));
                    return; // Stop if success
                } else {
                    console.log('    FAILED (API Error or non-zero status_code)');
                    console.log('    Response:', JSON.stringify(data, null, 2));
                }
            } catch (err: any) {
                console.log('    Exception:', err.message);
            }
        }
    }
}

testMinimax();
