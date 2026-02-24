
import puppeteer, { Browser, Page } from 'puppeteer';

interface PostContent {
    platform: string;
    username: string;
    password?: string;
    caption: string;
    assetUrl?: string; // Local path or URL
}

export async function postToSocial(content: PostContent): Promise<boolean> {
    console.log(`[Poster] 🚀 Starting automated post to ${content.platform}...`);

    if (!content.password) {
        console.log(`[Poster] ⚠️ No password provided for @${content.username}. Skipping real login.`);
        return false; // Still simulated
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        let success = false;
        switch (content.platform.toLowerCase()) {
            case 'twitter':
            case 'x':
                success = await postToTwitter(page, content);
                break;
            case 'linkedin':
                success = await postToLinkedIn(page, content);
                break;
            case 'instagram':
                success = await postToInstagram(page, content);
                break;
            case 'tiktok':
                success = await postToTikTok(page, content);
                break;
            default:
                console.log(`[Poster] ❌ Platform ${content.platform} automation not yet implemented.`);
        }

        return success;

    } catch (err: any) {
        console.error(`[Poster] ❌ Error posting to ${content.platform}: ${err.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

async function postToTwitter(page: Page, content: PostContent): Promise<boolean> {
    try {
        console.log('[Poster] 🐦 Logging in to Twitter...');
        await page.goto('https://twitter.com/i/flow/login', { waitUntil: 'networkidle2' });

        // Username
        await page.waitForSelector('input[autocomplete="username"]');
        await page.type('input[autocomplete="username"]', content.username);
        await page.keyboard.press('Enter');

        // Password
        await page.waitForSelector('input[name="password"]', { visible: true });
        await page.type('input[name="password"]', content.password!);
        await page.keyboard.press('Enter');

        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Check login success
        if (page.url().includes('login')) throw new Error('Twitter login failed');

        console.log('[Poster] ✍️ Composing tweet...');
        // Click Tweet button / Composer
        await page.goto('https://twitter.com/compose/tweet', { waitUntil: 'networkidle2' });

        await page.waitForSelector('div[aria-label="Tweet text"]');
        await page.type('div[aria-label="Tweet text"]', content.caption);

        // Upload Media (if any)
        if (content.assetUrl) {
            const inputUpload = await page.$('input[type="file"]');
            if (inputUpload) {
                await inputUpload.uploadFile(content.assetUrl); // Must be local path for Puppeteer upload!
                await new Promise(r => setTimeout(r, 5000)); // Wait for upload
            }
        }

        // Click Tweet
        const tweetBtn = await page.$('div[data-testid="tweetButton"]');
        if (tweetBtn) {
            await tweetBtn.click();
            await page.waitForSelector('div[data-testid="toast"]', { timeout: 10000 });
            console.log('[Poster] ✅ Tweet posted successfully!');
            return true;
        }

        return false;

    } catch (err) {
        console.error('[Poster] Twitter error:', err);
        throw err;
    }
}

async function postToLinkedIn(page: Page, content: PostContent): Promise<boolean> {
    try {
        console.log('[Poster] 👔 Logging in to LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

        await page.waitForSelector('#username');
        await page.type('#username', content.username);
        await page.type('#password', content.password!);
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        console.log('[Poster] ✍️ Composing LinkedIn post...');
        await page.waitForSelector('.share-box-feed-entry__trigger');
        await page.click('.share-box-feed-entry__trigger');

        await page.waitForSelector('.ql-editor');
        await page.type('.ql-editor', content.caption);

        // Asset upload would go here

        await page.click('.share-actions__primary-action');
        console.log('[Poster] ✅ LinkedIn post successful!');
        return true;
    } catch (err) {
        console.error('[Poster] LinkedIn error:', err);
        return false;
    }
}

async function postToInstagram(page: Page, content: PostContent): Promise<boolean> {
    console.log('[Poster] 📸 Instagram automation not yet implemented — skipping.');
    return false;
}

async function postToTikTok(page: Page, content: PostContent): Promise<boolean> {
    console.log('[Poster] 🎵 TikTok automation not yet implemented — skipping.');
    return false;
}
