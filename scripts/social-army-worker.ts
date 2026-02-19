
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST be service role to bypass RLS if needed, or just admin user

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processQueue() {
    console.log('🔄 Checking Content Queue...');

    // 1. Fetch pending items
    const { data: items, error } = await supabase
        .from('content_queue')
        .select('*, social_campaigns(name), social_accounts(username, platform)')
        .eq('generation_status', 'pending')
        .limit(5);

    if (error) {
        console.error('Error fetching queue:', error);
        return;
    }

    if (!items || items.length === 0) {
        console.log('💤 No pending items. Sleeping...');
        return;
    }

    console.log(`Found ${items.length} pending items.`);

    // 2. Process each item
    for (const item of items) {
        console.log(`\n🤖 Processing Item ${item.id}`);
        console.log(`   Campaign: ${item.social_campaigns?.name}`);
        console.log(`   Target: @${item.social_accounts?.username} on ${item.social_accounts?.platform}`);
        console.log(`   Task: Generate ${item.content_type}`);

        // Update to 'processing'
        await supabase.from('content_queue').update({ generation_status: 'processing' }).eq('id', item.id);

        // MOCK GENERATION DELAY (Simulate AI Work)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // MOCK POSTING
        const mockUrl = `https://${item.social_accounts?.platform}.com/${item.social_accounts?.username}/status/${Date.now()}`;

        // Update to 'posted'
        const { error: updateError } = await supabase
            .from('content_queue')
            .update({
                generation_status: 'posted',
                posted_at: new Date().toISOString(),
                asset_url: mockUrl,
                caption: item.caption || 'Auto-generated content #CubiQo'
            })
            .eq('id', item.id);

        if (updateError) {
            console.error(`❌ Failed to update item ${item.id}:`, updateError);
        } else {
            console.log(`✅ Success! Posted to ${mockUrl}`);
        }
    }
}

// 3. Campaign Manager (Auto-generate tasks)
async function manageCampaigns() {
    // Determine if we need to generate new tasks for running campaigns
    const { data: campaigns } = await supabase
        .from('social_campaigns')
        .select('*')
        .eq('status', 'running');

    if (!campaigns || campaigns.length === 0) return;

    for (const campaign of campaigns) {
        // Check if campaign has waiting tasks (pending or processing)
        // If query returns error (e.g. table empty), handle gracefully
        const { count } = await supabase
            .from('content_queue')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .in('generation_status', ['pending', 'processing']);

        // Only generate new tasks if queue is empty for this campaign
        if (count === 0) {
            console.log(`\n📢 Generating tasks for campaign: ${campaign.name}`);

            // Get a random active account
            const { data: accounts } = await supabase.from('social_accounts').select('id, username').eq('status', 'active');

            if (!accounts || accounts.length === 0) {
                console.log('   ⚠️ No active accounts available to assign task.');
                continue;
            }

            const randomAccount = accounts[Math.floor(Math.random() * accounts.length)];

            // Insert a new task
            const { error } = await supabase.from('content_queue').insert({
                campaign_id: campaign.id,
                target_account_id: randomAccount.id,
                content_type: Math.random() > 0.5 ? 'text' : 'image', // Random type
                caption: `Auto-generated post for campaign: ${campaign.seed_topic} [${new Date().toLocaleTimeString()}]`,
                generation_status: 'pending' // Ready for processing
            });

            if (error) console.error('   ❌ Failed to generate task:', error);
            else console.log(`   ✅ Added new task for @${randomAccount.username}`);
        }
    }
}

// Main Loop
async function main() {
    console.log('🚀 Social Army Worker Started');
    console.log('   Press Ctrl+C to stop');
    console.log('   (Polling every 5 seconds...)');

    // Run immediately once
    await manageCampaigns();
    await processQueue();

    // Then loop
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await manageCampaigns();
        await processQueue();
    }
}

main().catch(console.error);
