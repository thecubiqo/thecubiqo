
/**
 * Social Army Poster v3 — All 10 Platforms
 *
 * Platforms:
 *   Twitter/X    — Puppeteer (existing)
 *   LinkedIn     — Puppeteer (existing)
 *   Instagram    — Puppeteer (mobile viewport)
 *   TikTok       — Puppeteer (mobile viewport, text posts)
 *   Reddit       — Puppeteer (old.reddit.com text submit)
 *   Pinterest    — Puppeteer (pin creation tool)
 *   YouTube      — Puppeteer (Studio community post)
 *   Threads      — Puppeteer (threads.net)
 *   Facebook     — Puppeteer (facebook.com feed)
 *   Discord      — Webhook API  (no browser, instant)
 *
 * All browser-based platforms draw from the shared BrowserPool so
 * instances are reused across concurrent posts.
 *
 * Special credential conventions (stored in social_accounts.password_encrypted):
 *   Discord  — the value IS the full webhook URL
 *              e.g. https://discord.com/api/webhooks/{id}/{token}
 *   Reddit   — password may include the target sub after a "|"
 *              e.g.  "mypassword|artificial"  → sub = r/artificial
 *   Pinterest— password may include board name after "|"
 *              e.g.  "mypassword|AI Art"
 */

import { Page } from 'puppeteer';
import { browserPool } from './browser-pool';

export interface PostContent {
    platform: string;
    username: string;
    password?: string;   // plain credential OR webhook URL (Discord) OR "pass|extra"
    caption: string;
    assetUrl?: string;   // Public URL or local path to image/video
}

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 '
    + '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
    + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── Helpers ─────────────────────────────────────────────

/** Split "password|extra" → [password, extra] */
function splitCred(raw: string): [string, string | undefined] {
    const idx = raw.indexOf('|');
    if (idx < 0) return [raw, undefined];
    return [raw.slice(0, idx), raw.slice(idx + 1)];
}

async function wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main Entry ──────────────────────────────────────────

export async function postToSocial(content: PostContent): Promise<boolean> {
    const platform = content.platform.toLowerCase();
    console.log(`[Poster] 🚀 ${platform.toUpperCase()} @${content.username}`);

    // Discord uses Webhook API — no browser needed
    if (platform === 'discord') return postToDiscord(content);

    if (!content.password) {
        console.log(`[Poster] ⚠️ No credentials for @${content.username} — skipping`);
        return false;
    }

    const { browser, release } = await browserPool.acquire();
    try {
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(45_000);
        await page.setDefaultTimeout(30_000);
        try {
            switch (platform) {
                case 'twitter': case 'x':   return await postToTwitter(page, content);
                case 'linkedin':            return await postToLinkedIn(page, content);
                case 'instagram':           return await postToInstagram(page, content);
                case 'tiktok':              return await postToTikTok(page, content);
                case 'reddit':              return await postToReddit(page, content);
                case 'pinterest':           return await postToPinterest(page, content);
                case 'youtube':             return await postToYouTube(page, content);
                case 'threads':             return await postToThreads(page, content);
                case 'facebook':            return await postToFacebook(page, content);
                default:
                    console.log(`[Poster] ❌ Unknown platform: ${platform}`);
                    return false;
            }
        } finally {
            await page.close().catch(() => {});
        }
    } catch (err: any) {
        console.error(`[Poster] ❌ ${platform} @${content.username}: ${err.message}`);
        return false;
    } finally {
        release();
    }
}

// ─── Twitter / X ─────────────────────────────────────────

async function postToTwitter(page: Page, content: PostContent): Promise<boolean> {
    await page.setUserAgent(DESKTOP_UA);
    await page.goto('https://twitter.com/i/flow/login', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('input[autocomplete="username"]', { timeout: 15_000 });
    await page.type('input[autocomplete="username"]', content.username, { delay: 40 });
    await page.keyboard.press('Enter');

    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 10_000 });
    await page.type('input[name="password"]', content.password!, { delay: 40 });
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20_000 });

    if (page.url().includes('login')) throw new Error('Twitter login failed');

    await page.goto('https://twitter.com/compose/tweet', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('div[aria-label="Tweet text"]', { timeout: 15_000 });
    await page.type('div[aria-label="Tweet text"]', content.caption, { delay: 20 });

    if (content.assetUrl?.startsWith('/')) {
        const input = await page.$('input[type="file"]');
        if (input) { await input.uploadFile(content.assetUrl); await wait(4000); }
    }

    const btn = await page.$('div[data-testid="tweetButton"]');
    if (!btn) return false;
    await btn.click();
    await page.waitForSelector('div[data-testid="toast"]', { timeout: 15_000 });
    console.log('[Poster] ✅ Tweet posted');
    return true;
}

// ─── LinkedIn ────────────────────────────────────────────

async function postToLinkedIn(page: Page, content: PostContent): Promise<boolean> {
    await page.setUserAgent(DESKTOP_UA);
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('#username', { timeout: 15_000 });
    await page.type('#username', content.username, { delay: 40 });
    await page.type('#password', content.password!, { delay: 40 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20_000 });

    // Start a post
    await page.waitForSelector('[data-artdeco-is-focused],.share-box-feed-entry__trigger,[data-test-id="share-selfie-trigger"]', { timeout: 15_000 });
    await page.click('.share-box-feed-entry__trigger');
    await page.waitForSelector('.ql-editor', { timeout: 10_000 });
    await page.type('.ql-editor', content.caption, { delay: 20 });
    await page.click('.share-actions__primary-action');
    await wait(3000);
    console.log('[Poster] ✅ LinkedIn post published');
    return true;
}

// ─── Instagram ───────────────────────────────────────────

async function postToInstagram(page: Page, content: PostContent): Promise<boolean> {
    await page.setUserAgent(MOBILE_UA);
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    await page.waitForSelector('input[name="username"]', { timeout: 15_000 });
    await page.type('input[name="username"]', content.username, { delay: 40 });
    await page.type('input[name="password"]', content.password!, { delay: 40 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25_000 });

    if (page.url().includes('login') || page.url().includes('challenge')) {
        throw new Error('Instagram login failed or requires challenge');
    }

    // Navigate to create post (image required — use assetUrl or skip if text-only)
    if (!content.assetUrl) {
        // Text-only: use "Create" → text only note (new Instagram feature)
        await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('svg[aria-label="New post"]', { timeout: 10_000 }).catch(() => {});
    }

    // Tap "+" new post button
    const newPostBtn = await page.$('a[href="/create/style/"]') ||
        await page.$('svg[aria-label="New post"]');
    if (!newPostBtn) return false;
    await newPostBtn.click();
    await wait(2000);

    // If we have an image, upload it
    if (content.assetUrl?.startsWith('/')) {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) { await fileInput.uploadFile(content.assetUrl); await wait(3000); }
    }

    // Next → Next → Caption
    for (let i = 0; i < 2; i++) {
        const nextBtn = await page.$('div[role="button"]::-p-text(Next)') ||
            await page.$('button::-p-text(Next)');
        if (nextBtn) { await nextBtn.click(); await wait(2000); }
    }

    const captionArea = await page.$('textarea[aria-label="Write a caption…"]') ||
        await page.$('div[contenteditable="true"]');
    if (captionArea) { await captionArea.click(); await page.keyboard.type(content.caption, { delay: 20 }); }

    const shareBtn = await page.$('div[role="button"]::-p-text(Share)') ||
        await page.$('button::-p-text(Share)');
    if (!shareBtn) return false;
    await shareBtn.click();
    await wait(4000);
    console.log('[Poster] ✅ Instagram post published');
    return true;
}

// ─── TikTok ──────────────────────────────────────────────

async function postToTikTok(page: Page, content: PostContent): Promise<boolean> {
    await page.setUserAgent(DESKTOP_UA);
    await page.goto('https://www.tiktok.com/login/phone-or-email/email', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    await page.waitForSelector('input[name="username"]', { timeout: 15_000 });
    await page.type('input[name="username"]', content.username, { delay: 40 });
    await page.type('input[type="password"]', content.password!, { delay: 40 });
    await page.click('button[data-e2e="login-button"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25_000 });

    if (page.url().includes('login')) throw new Error('TikTok login failed');

    // Navigate to text post creation (TikTok added text-only posts)
    await page.goto('https://www.tiktok.com/creator#upload', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    // Click "Text" tab if available
    const textTab = await page.$('[data-e2e="text-tab"]') || await page.$('button::-p-text(Text)');
    if (textTab) { await textTab.click(); await wait(1000); }

    const captionBox = await page.$('[data-e2e="caption-input"]') ||
        await page.$('div[contenteditable="true"]');
    if (!captionBox) return false;
    await captionBox.click();
    await page.keyboard.type(content.caption, { delay: 20 });

    const postBtn = await page.$('[data-e2e="post-button"]') || await page.$('button::-p-text(Post)');
    if (!postBtn) return false;
    await postBtn.click();
    await wait(4000);
    console.log('[Poster] ✅ TikTok post published');
    return true;
}

// ─── Reddit ──────────────────────────────────────────────

async function postToReddit(page: Page, content: PostContent): Promise<boolean> {
    const [password, subreddit] = splitCred(content.password!);
    const sub = subreddit || 'artificial';   // default sub

    await page.setUserAgent(DESKTOP_UA);
    await page.goto('https://old.reddit.com/login', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('#user_login', { timeout: 15_000 });
    await page.type('#user_login', content.username, { delay: 40 });
    await page.type('#passwd_login', password, { delay: 40 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20_000 });

    if (page.url().includes('login')) throw new Error('Reddit login failed');

    // Go to text submit
    await page.goto(
        `https://old.reddit.com/r/${sub}/submit?selftext=true`,
        { waitUntil: 'domcontentloaded' }
    );

    // Title = first 300 chars of caption
    const title = content.caption.slice(0, 300);
    const body = content.caption.length > 300 ? content.caption.slice(300) : '';

    await page.waitForSelector('#title-field', { timeout: 15_000 });
    await page.type('#title-field', title, { delay: 20 });

    if (body) {
        const textArea = await page.$('#text-desc');
        if (textArea) await textArea.type(body, { delay: 10 });
    }

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20_000 });
    console.log('[Poster] ✅ Reddit post submitted');
    return true;
}

// ─── Pinterest ───────────────────────────────────────────

async function postToPinterest(page: Page, content: PostContent): Promise<boolean> {
    const [password, boardName] = splitCred(content.password!);

    await page.setUserAgent(DESKTOP_UA);
    await page.goto('https://www.pinterest.com/login/', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('input[id="email"]', { timeout: 15_000 });
    await page.type('input[id="email"]', content.username, { delay: 40 });
    await page.type('input[id="password"]', password, { delay: 40 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20_000 });

    await page.goto('https://www.pinterest.com/pin-creation-tool/', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    // Upload image if available
    if (content.assetUrl?.startsWith('/')) {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) { await fileInput.uploadFile(content.assetUrl); await wait(4000); }
    }

    // Fill description
    const descBox = await page.$('[data-test-id="pin-draft-description"]') ||
        await page.$('textarea[placeholder*="description"]');
    if (descBox) { await descBox.click(); await page.keyboard.type(content.caption, { delay: 20 }); }

    // Select board if provided
    if (boardName) {
        const boardSelect = await page.$('[data-test-id="board-dropdown-select-button"]');
        if (boardSelect) {
            await boardSelect.click();
            await wait(500);
            const boardOption = await page.$(`[data-test-id="board-option"]::-p-text(${boardName})`);
            if (boardOption) await boardOption.click();
        }
    }

    const publishBtn = await page.$('[data-test-id="pin-draft-save-button"]') ||
        await page.$('button::-p-text(Publish)');
    if (!publishBtn) return false;
    await publishBtn.click();
    await wait(4000);
    console.log('[Poster] ✅ Pinterest pin created');
    return true;
}

// ─── YouTube (Community posts) ───────────────────────────

async function postToYouTube(page: Page, content: PostContent): Promise<boolean> {
    await page.setUserAgent(DESKTOP_UA);
    // YouTube login via Google account
    await page.goto('https://accounts.google.com/signin/v2/identifier', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('input[type="email"]', { timeout: 15_000 });
    await page.type('input[type="email"]', content.username, { delay: 40 });
    await page.keyboard.press('Enter');

    await page.waitForSelector('input[type="password"]', { visible: true, timeout: 10_000 });
    await page.type('input[type="password"]', content.password!, { delay: 40 });
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25_000 });

    // Go to YouTube Studio community
    await page.goto('https://studio.youtube.com/', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    // Navigate to Community tab
    await page.goto('https://www.youtube.com/post', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    const postBox = await page.$('div#contenteditable-root') ||
        await page.$('[contenteditable="true"]');
    if (!postBox) return false;
    await postBox.click();
    await page.keyboard.type(content.caption, { delay: 20 });

    const submitBtn = await page.$('button#submit-button') ||
        await page.$('yt-button-renderer#submit-button button');
    if (!submitBtn) return false;
    await submitBtn.click();
    await wait(4000);
    console.log('[Poster] ✅ YouTube community post published');
    return true;
}

// ─── Threads ─────────────────────────────────────────────

async function postToThreads(page: Page, content: PostContent): Promise<boolean> {
    await page.setUserAgent(MOBILE_UA);
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('https://www.threads.net/login', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    // Threads uses Instagram credentials
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 15_000 });
    await page.type('input[autocomplete="username"]', content.username, { delay: 40 });
    await page.type('input[type="password"]', content.password!, { delay: 40 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25_000 });

    if (page.url().includes('login')) throw new Error('Threads login failed');

    // Click "New Thread" / compose button
    await wait(2000);
    const composeBtn = await page.$('a[href="/compose"]') ||
        await page.$('[aria-label="New thread"]');
    if (!composeBtn) return false;
    await composeBtn.click();
    await wait(1500);

    const editor = await page.$('div[contenteditable="true"]') ||
        await page.$('textarea[placeholder*="thread"]');
    if (!editor) return false;
    await editor.click();
    await page.keyboard.type(content.caption, { delay: 20 });

    const postBtn = await page.$('div[role="button"]::-p-text(Post)') ||
        await page.$('button::-p-text(Post)');
    if (!postBtn) return false;
    await postBtn.click();
    await wait(4000);
    console.log('[Poster] ✅ Threads post published');
    return true;
}

// ─── Facebook ────────────────────────────────────────────

async function postToFacebook(page: Page, content: PostContent): Promise<boolean> {
    await page.setUserAgent(DESKTOP_UA);
    await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('#email', { timeout: 15_000 });
    await page.type('#email', content.username, { delay: 40 });
    await page.type('#pass', content.password!, { delay: 40 });
    await page.click('[name="login"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25_000 });

    if (page.url().includes('login')) throw new Error('Facebook login failed');

    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    // Click "What's on your mind?" composer
    const composerBtn = await page.$('[aria-label*="mind"]') ||
        await page.$('[data-testid="status-attachment-mentions-input"]') ||
        await page.$('div[role="button"][tabindex="0"]::-p-text(mind)');

    if (!composerBtn) return false;
    await composerBtn.click();
    await wait(1500);

    // Type in expanded composer
    const textArea = await page.$('div[contenteditable="true"][aria-label*="mind"]') ||
        await page.$('div[contenteditable="true"]');
    if (!textArea) return false;
    await textArea.click();
    await page.keyboard.type(content.caption, { delay: 20 });

    const postBtn = await page.$('[aria-label="Post"]:not([disabled])') ||
        await page.$('div[aria-label="Post"][role="button"]');
    if (!postBtn) return false;
    await postBtn.click();
    await wait(4000);
    console.log('[Poster] ✅ Facebook post published');
    return true;
}

// ─── Discord (Webhook API — no browser) ──────────────────

async function postToDiscord(content: PostContent): Promise<boolean> {
    // password field holds the full webhook URL for Discord
    const webhookUrl = content.password ||
        process.env[`DISCORD_WEBHOOK_${content.username.toUpperCase()}`];

    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        console.log('[Poster] Discord: no webhook URL available — skipping');
        return false;
    }

    try {
        // Build payload: optional embed with image
        const body: any = { content: content.caption };
        if (content.assetUrl?.startsWith('https://')) {
            body.embeds = [{
                description: content.caption,
                image: { url: content.assetUrl },
            }];
            body.content = undefined; // embed replaces plain content
        }

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.status === 204 || res.ok) {
            console.log('[Poster] ✅ Discord webhook sent');
            return true;
        }
        console.warn(`[Poster] Discord webhook ${res.status}: ${await res.text()}`);
        return false;
    } catch (err: any) {
        console.error(`[Poster] Discord error: ${err.message}`);
        return false;
    }
}

