
const key = process.argv[2];
console.log(`Testing key: ${key.substring(0, 10)}...`);

async function test() {
    try {
        const resp = await fetch('https://openrouter.ai/api/v1/auth/key', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`
            }
        });

        console.log(`Status: ${resp.status}`);
        const data = await resp.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
