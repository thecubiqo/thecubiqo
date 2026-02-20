const fs = require('fs');
const path = require('path');

const platforms = [
    'tiktok', 'instagram', 'twitter', 'linkedin', 'youtube',
    'reddit', 'pinterest', 'threads', 'facebook', 'discord'
];

const personas = ['builder', 'creative', 'investor', 'techie'];

function generateFleet() {
    const fleet = [];

    platforms.forEach(platform => {
        for (let i = 1; i <= 10; i++) {
            const persona = personas[Math.floor(Math.random() * personas.length)];
            fleet.push({
                id: `${platform}_account_${i}`,
                platform: platform,
                handle: `cubiqo_${platform}_${i}`,
                username: `cubiqo_${platform}_${i}@example.com`,
                password: 'CHANGE_ME',
                proxy: 'http://proxy-user:pass@host:port', // Required for 100 accounts
                persona: persona,
                status: 'pending_setup',
                last_post: null
            });
        }
    });

    const configPath = path.join(__dirname, '../config/platforms.json');

    // Ensure config dir exists
    if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(fleet, null, 2));
    console.log(`✅ Fleet config generated with 100 accounts across 10 platforms.`);
    console.log(`📍 Location: ${configPath}`);
    console.log(`🚀 Next: Fill in real passwords and proxies for each account.`);
}

if (process.argv.includes('--generate')) {
    generateFleet();
}
