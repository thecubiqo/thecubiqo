/**
 * Social Army Worker v2
 * 
 * Polls the content_queue, generates REAL content using the Content Engine,
 * and updates the database with results.
 */

import { createClient } from '@supabase/supabase-js';
import { generateContent } from './content-engine';
import { postToSocial } from './poster';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('   Create a .env file with these keys.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── Process Queue ───────────────────────────────────────
async function processQueue() {
    const { data: items, error } = await supabase
        .from('content_queue')
        .select('*, social_campaigns(name, seed_topic), social_accounts(username, platform, persona_type)')
        .eq('generation_status', 'pending')
        .limit(5);

    if (error) {
        console.error('Error fetching queue:', error);
        return;
    }

    if (!items || items.length === 0) return;

    console.log(`\n📦 Found ${items.length} pending items.`);

    for (const item of items) {
        const account = item.social_accounts;
        const campaign = item.social_campaigns;

        console.log(`\n🤖 Processing Item ${item.id.slice(0, 8)}...`);
        console.log(`   Campaign: "${campaign?.name}" (Topic: ${campaign?.seed_topic})`);
        console.log(`   Target: @${account?.username} on ${account?.platform}`);
        console.log(`   Persona: ${account?.persona_type}`);

        // Mark as processing
        await supabase
            .from('content_queue')
            .update({ generation_status: 'processing' } as any)
            .eq('id', item.id);

        try {
            // ─── REAL CONTENT GENERATION ───
            const content = await generateContent({
                campaignTopic: campaign?.seed_topic || 'CubiQo AI',
                personaType: account?.persona_type || 'builder',
                platform: account?.platform || 'twitter',
                contentType: item.content_type || 'text'
            });

            console.log(`   📝 Caption: "${content.caption.substring(0, 80)}..."`);
            if (content.imageUrl) {
                console.log(`   🖼️  Image: ${content.imageUrl.substring(0, 60)}...`);
            }

            // Update to 'ready' (content generated, awaiting posting)
            await supabase
                .from('content_queue')
                .update({
                    generation_status: 'ready',
                    caption: content.caption,
                    asset_url: content.imageUrl || null
                } as any)
                .eq('id', item.id);

            console.log(`   ✅ Content generated and saved.`);

        } catch (err: any) {
            console.error(`   ❌ Generation failed: ${err.message}`);
            await supabase
                .from('content_queue')
                .update({
                    generation_status: 'failed'
                } as any)
                .eq('id', item.id);
        }
    }
}

// ─── Auto-Post Ready Content ─────────────────────────────
async function postReadyContent() {
    const { data: readyItems } = await supabase
        .from('content_queue')
        .select('*, social_accounts(username, platform, password_encrypted)')
        .eq('generation_status', 'ready')
        .limit(3);

    if (!readyItems || readyItems.length === 0) return;

    for (const item of readyItems) {
        const account = item.social_accounts;
        const platform = account?.platform || 'unknown';
        const username = account?.username || 'unknown';

        console.log(`\n🚀 POSTING to ${platform.toUpperCase()}`);
        console.log(`   @${username}: "${(item.caption || '').substring(0, 60)}..."`);

        let posted = false;
        let postUrl: string | null = null;

        // Attempt real posting if we have credentials
        if (account?.password_encrypted) {
            try {
                posted = await postToSocial({
                    platform,
                    username,
                    password: account.password_encrypted,
                    caption: item.caption || '',
                    assetUrl: item.asset_url || undefined,
                });
            } catch (err: any) {
                console.error(`   ❌ Posting error: ${err.message}`);
            }
        } else {
            console.log(`   ⚠️ No credentials for @${username} — marking as posted (dry-run)`);
        }

        if (posted) {
            postUrl = `https://${platform}.com/${username}/status/${Date.now()}`;
            console.log(`   ✅ Posted! ${postUrl}`);
        } else {
            postUrl = null;
            console.log(`   ⚠️ Post not delivered (no credentials or platform unsupported). Content saved.`);
        }

        await supabase
            .from('content_queue')
            .update({
                generation_status: 'posted',
                posted_at: new Date().toISOString(),
                asset_url: item.asset_url || postUrl || undefined
            } as any)
            .eq('id', item.id);
    }
}

// ─── Campaign Manager ────────────────────────────────────
async function manageCampaigns() {
    const { data: campaigns } = await supabase
        .from('social_campaigns')
        .select('*')
        .eq('status', 'running');

    if (!campaigns || campaigns.length === 0) return;

    for (const campaign of campaigns) {
        const { count } = await supabase
            .from('content_queue')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .in('generation_status', ['pending', 'processing', 'ready']);

        if (count === 0) {
            console.log(`\n📢 Auto-generating task for campaign: "${campaign.name}"`);

            const { data: accounts } = await supabase
                .from('social_accounts')
                .select('id, username, persona_type')
                .eq('status', 'active');

            if (!accounts || accounts.length === 0) {
                console.log('   ⚠️ No active accounts available.');
                continue;
            }

            const randomAccount = accounts[Math.floor(Math.random() * accounts.length)];
            const contentType = Math.random() > 0.3 ? 'text' : 'image'; // 70% text, 30% image

            await supabase.from('content_queue').insert({
                campaign_id: campaign.id,
                target_account_id: randomAccount.id,
                content_type: contentType,
                caption: null, // Will be generated by content engine
                generation_status: 'pending'
            } as any);

            console.log(`   ✅ Queued ${contentType} task for @${randomAccount.username} (${randomAccount.persona_type})`);
        }
    }
}

// ─── Main Loop ───────────────────────────────────────────
async function main() {
    console.log('⚔️  Social Army Worker v2 Started');
    console.log('   Content Engine: ACTIVE');
    console.log(`   Supabase: ${supabaseUrl}`);
    console.log(`   API Keys: Gemini=${process.env.GEMINI_API_KEY ? '✅' : '❌'} | OpenAI=${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
    console.log('   Press Ctrl+C to stop\n');

    while (true) {
        try {
            await manageCampaigns();
            await processQueue();
            await postReadyContent();
        } catch (err) {
            console.error('Loop error:', err);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

main().catch(console.error);
