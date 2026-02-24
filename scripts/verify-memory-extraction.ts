
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyMemoryExtraction() {
    console.log('Verifying Memory Extraction API...');

    const sessionId = 'test-session-' + Date.now();
    const userMessage = "My name is John and I love playing guitar.";
    const aiResponse = "Nice to meet you John! Playing guitar is a great hobby.";

    console.log(`Session ID: ${sessionId}`);
    console.log(`User: ${userMessage}`);
    console.log(`AI: ${aiResponse}`);

    try {
        const res = await fetch('http://localhost:3000/api/extract-memories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId,
                userMessage,
                aiResponse,
                // We simulate the client not sending existing memories, as deemed in useChat.ts
            })
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        if (res.ok && data.extracted && data.extracted.length > 0) {
            console.log('SUCCESS: Memories extracted.');
            return true;
        } else {
            console.log('WARNING: No memories extracted or error occurred.');
            return false;
        }

    } catch (error) {
        console.error('Fetch failed:', error);
        return false;
    }
}

verifyMemoryExtraction();
