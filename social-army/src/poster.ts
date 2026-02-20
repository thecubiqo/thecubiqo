
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
        headless: "new",
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
            // Add more platforms...
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
    // Placeholder skeleton
    console.log('[Poster] 👔 Posting to LinkedIn (Skeleton)...');
    return true;
}
