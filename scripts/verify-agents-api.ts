
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyAgentsApi() {
    console.log('Verifying Agents API...');

    try {
        const res = await fetch('http://localhost:3000/api/agents', {
            method: 'GET',
        });

        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Agents found:', data.agents ? data.agents.length : 0);
            console.log('First agent:', data.agents?.[0] ? JSON.stringify(data.agents[0], null, 2) : 'None');
            return true;
        } else {
            const text = await res.text();
            console.error('Failed to list agents:', text);
            return false;
        }

    } catch (error) {
        console.error('Fetch failed:', error);
        return false;
    }
}

verifyAgentsApi();
