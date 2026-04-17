import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    console.log('--- Social Army Live Status Check ---');

    // 1. Check Accounts
    const { data: accounts } = await supabase
        .from('social_accounts')
        .select('platform, username, status');

    console.log(`\n👥 Accounts: ${accounts?.length || 0}`);
    accounts?.forEach(a => console.log(`   - @${a.username} on ${a.platform} [${a.status}]`));

    // 2. Check Queue Statuses
    const { data: queue } = await supabase
        .from('content_queue')
        .select('generation_status');

    const stats = queue?.reduce((acc: any, curr) => {
        acc[curr.generation_status] = (acc[curr.generation_status] || 0) + 1;
        return acc;
    }, {});

    console.log('\n📦 Content Queue Stats:');
    console.log(JSON.stringify(stats, null, 2));

    // 3. Check for recently updated items (to see if worker is active)
    const { data: recent } = await supabase
        .from('content_queue')
        .select('id, generation_status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\n🕒 Most Recent Queue Items:');
    recent?.forEach(r => console.log(`   - ${r.id.slice(0, 8)}: ${r.generation_status} (${r.created_at})`));
}

checkStatus();
