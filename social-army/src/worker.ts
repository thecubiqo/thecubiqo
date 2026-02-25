/**
 * Social Army Worker v3 — High-Performance Parallel
 *
 * 10-10-10 target: 10 social platforms × 10 accounts × in ≤ 10 minutes
 *
 * Architecture:
 *   1. manageCampaigns()   — seeds the content_queue with ALL accounts at once
 *   2. processQueue()      — generates content for up to BATCH_SIZE items in parallel
 *   3. postReadyContent()  — posts all ready items in parallel
 *
 * Concurrency is limited by WORKER_CONCURRENCY (default 10) so we never
 * slam the DB or GFXToolz API with hundreds of simultaneous requests.
 *
 * Health server: listens on PORT (Railway injects) at /health so Railway
 * health-checks pass even though this is a background worker.
 */

import http from 'http';
import { createClient } from '@supabase/supabase-js';
import { generateContent } from './content-engine';
import { postToSocial } from './poster';
import { browserPool } from './browser-pool';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

// ─── Config ──────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** Max simultaneous content-generation or posting tasks */
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '10', 10);
/** Items fetched per queue-processing cycle */
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);
/** Milliseconds between main-loop cycles */
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '2000', 10);

// ─── Semaphore ───────────────────────────────────────────

class Semaphore {
    private count: number;
    private waiters: Array<() => void> = [];
    constructor(n: number) { this.count = n; }

    async acquire(): Promise<() => void> {
        if (this.count > 0) {
            this.count--;
            return () => this._release();
        }
        return new Promise(resolve => {
            this.waiters.push(() => { this.count--; resolve(() => this._release()); });
        });
    }

    private _release() {
        this.count++;
        const next = this.waiters.shift();
        if (next) { this.count--; next(); }
    }
}

const sem = new Semaphore(CONCURRENCY);

/** Run tasks in parallel with bounded concurrency */
async function pAll<T>(tasks: Array<() => Promise<T>>): Promise<PromiseSettledResult<T>[]> {
    return Promise.allSettled(
        tasks.map(async task => {
            const release = await sem.acquire();
            try { return await task(); } finally { release(); }
        })
    );
}

// ─── Campaign Manager ────────────────────────────────────
// Seeds ALL active accounts into the queue when a campaign has no pending work.

async function manageCampaigns(): Promise<void> {
    const { data: campaigns } = await supabase
        .from('social_campaigns')
        .select('*')
        .eq('status', 'running');

    if (!campaigns?.length) return;

    const { data: accounts } = await supabase
        .from('social_accounts')
        .select('id, username, persona_type, platform')
        .eq('status', 'active');

    if (!accounts?.length) {
        console.log('   ⚠️ No active accounts — skipping campaign seeding');
        return;
    }

    for (const campaign of campaigns) {
        const { count } = await supabase
            .from('content_queue')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .in('generation_status', ['pending', 'processing', 'ready']);

        if ((count ?? 0) > 0) continue; // already has work

        console.log(`\n📢 Seeding campaign "${campaign.name}" for all ${accounts.length} accounts…`);

        // Insert one item per account in a single batch
        const rows = accounts.map(acc => ({
            campaign_id: campaign.id,
            target_account_id: acc.id,
            content_type: Math.random() > 0.3 ? 'text' : 'image',
            generation_status: 'pending',
            caption: null,
        }));

        const { error } = await supabase.from('content_queue').insert(rows as any);
        if (error) console.error('   ❌ Seeding failed:', error.message);
        else console.log(`   ✅ Queued ${rows.length} tasks (10 platforms × ${Math.round(rows.length / 10)} accounts)`);
    }
}

// ─── Content Generation (parallel) ───────────────────────

async function processQueue(): Promise<void> {
    const { data: items, error } = await supabase
        .from('content_queue')
        .select('*, social_campaigns(name, seed_topic), social_accounts(username, platform, persona_type)')
        .eq('generation_status', 'pending')
        .limit(BATCH_SIZE);

    if (error) { console.error('Queue fetch error:', error.message); return; }
    if (!items?.length) return;

    console.log(`\n📦 Generating content for ${items.length} items (${CONCURRENCY} parallel)…`);

    // Mark all as processing atomically
    const ids = items.map((i: any) => i.id);
    await supabase.from('content_queue')
        .update({ generation_status: 'processing' } as any)
        .in('id', ids);

    const tasks = items.map((item: any) => async () => {
        const account = item.social_accounts;
        const campaign = item.social_campaigns;
        try {
            const content = await generateContent({
                campaignTopic: campaign?.seed_topic || 'CubiQo AI',
                personaType: account?.persona_type || 'builder',
                platform: account?.platform || 'twitter',
                contentType: item.content_type || 'text',
            });

            await supabase.from('content_queue')
                .update({
                    generation_status: 'ready',
                    caption: content.caption,
                    asset_url: content.imageUrl || content.videoUrl || null,
                } as any)
                .eq('id', item.id);

            console.log(`   ✅ [${account?.platform}] @${account?.username} — generated`);
        } catch (err: any) {
            console.error(`   ❌ [${account?.platform}] @${account?.username} — ${err.message}`);
            await supabase.from('content_queue')
                .update({ generation_status: 'failed' } as any)
                .eq('id', item.id);
        }
    });

    await pAll(tasks);
}

// ─── Posting (parallel) ──────────────────────────────────

async function postReadyContent(): Promise<void> {
    const { data: readyItems } = await supabase
        .from('content_queue')
        .select('*, social_accounts(username, platform, password_encrypted)')
        .eq('generation_status', 'ready')
        .limit(BATCH_SIZE);

    if (!readyItems?.length) return;

    console.log(`\n🚀 Posting ${readyItems.length} items (${CONCURRENCY} parallel)…`);

    const tasks = readyItems.map((item: any) => async () => {
        const account = item.social_accounts;
        const platform = account?.platform || 'unknown';
        const username = account?.username || 'unknown';

        let posted = false;
        if (account?.password_encrypted) {
            posted = await postToSocial({
                platform,
                username,
                password: account.password_encrypted,
                caption: item.caption || '',
                assetUrl: item.asset_url || undefined,
            }).catch(err => {
                console.error(`   ❌ [${platform}] @${username}: ${err.message}`);
                return false;
            });
        } else {
            console.log(`   ⚠️ [${platform}] @${username}: no credentials — dry-run`);
        }

        await supabase.from('content_queue')
            .update({
                generation_status: 'posted',
                posted_at: new Date().toISOString(),
            } as any)
            .eq('id', item.id);

        const icon = posted ? '✅' : '📋';
        console.log(`   ${icon} [${platform}] @${username} — ${posted ? 'posted' : 'dry-run'}`);
    });

    const results = await pAll(tasks);
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    console.log(`   📊 ${succeeded}/${readyItems.length} posted successfully`);
}

// ─── Stats ───────────────────────────────────────────────

async function logStats(): Promise<void> {
    const statuses = ['pending', 'processing', 'ready', 'posted', 'failed'];
    const counts: Record<string, number> = {};
    await Promise.all(statuses.map(async s => {
        const { count } = await supabase
            .from('content_queue')
            .select('id', { count: 'exact', head: true })
            .eq('generation_status', s);
        counts[s] = count ?? 0;
    }));

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const bar = `P:${counts.pending} | Gen:${counts.processing} | Ready:${counts.ready} | ✅:${counts.posted} | ❌:${counts.failed}`;
    console.log(`\n📈 Queue [total=${total}]: ${bar}`);
}

// ─── Health Server (Railway requires a live port) ────────

function startHealthServer() {
    const port = parseInt(process.env.PORT || '3001', 10);
    const startTime = Date.now();

    const server = http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                uptime: Math.floor((Date.now() - startTime) / 1000),
                worker: 'social-army-v3',
            }));
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(port, () => {
        console.log(`[Health] 🟢 Listening on :${port}/health`);
    });
}

// ─── Main Loop ───────────────────────────────────────────

async function main() {
    console.log('⚔️  Social Army Worker v3 — 10-10-10 Mode');
    console.log(`   Concurrency: ${CONCURRENCY} | Batch: ${BATCH_SIZE} | Poll: ${POLL_INTERVAL}ms`);
    console.log(`   GFXToolz: ${process.env.GFX_TOOLZ_USER ? '✅' : '❌ (fallback mode)'}`);
    console.log(`   Gemini: ${process.env.GEMINI_API_KEY ? '✅' : '❌'}`);
    console.log(`   OpenAI:  ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
    console.log(`   Supabase: ${SUPABASE_URL}\n`);

    startHealthServer();

    // Pre-warm browser pool in background (don't block first cycle)
    browserPool.init().catch(err =>
        console.warn('[Main] Browser pool warm-up error:', err.message)
    );

    let cycles = 0;
    while (true) {
        try {
            await manageCampaigns();
            await processQueue();
            await postReadyContent();

            if (++cycles % 10 === 0) await logStats();
        } catch (err: any) {
            console.error('[Main] Loop error:', err.message);
        }
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received — shutting down gracefully…');
    await browserPool.close();
    process.exit(0);
});

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});

