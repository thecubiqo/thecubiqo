/**
 * GFXToolz.ai Integration
 * 
 * GFXToolz is a platform that provides access to 100+ AI creative tools
 * (Flux, Minimax, Luma, Imagen, etc.) through a single dashboard.
 * 
 * Since GFXToolz operates via a web dashboard (app.gfxtoolz.ai), 
 * this module uses Puppeteer to automate the platform:
 *   1. Login with credentials
 *   2. Navigate to the appropriate tool (e.g., image generator, video creator)
 *   3. Submit prompts and download results
 * 
 * Tools available via GFXToolz:
 *   - Image: Flux, Imagen4, DALL-E, Midjourney-style models
 *   - Video: Minimax, Luma Photon, AI video generators
 *   - Text:  Content writers, caption generators
 *   - Edit:  Photo editors, background removers
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class GFXToolz {
    constructor(email, password) {
        this.email = email || process.env.GFX_TOOLZ_USER;
        this.password = password || process.env.GFX_TOOLZ_PASS;
        this.baseUrl = 'https://app.gfxtoolz.ai';
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;
        this.outputDir = path.join(__dirname, '../output/gfx');
    }

    // ─── Browser Management ──────────────────────────────
    async launchBrowser() {
        if (this.browser) return;

        console.log('[GFXToolz] 🌐 Launching browser...');
        this.browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--window-size=1920,1080'
            ]
        });
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });

        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            this.isLoggedIn = false;
        }
    }

    // ─── Authentication ──────────────────────────────────
    async login() {
        if (this.isLoggedIn) return true;
        if (!this.email || !this.password) {
            console.error('[GFXToolz] ❌ Missing credentials. Set GFX_TOOLZ_USER and GFX_TOOLZ_PASS.');
            return false;
        }

        await this.launchBrowser();

        try {
            console.log(`[GFXToolz] 🔐 Logging in as ${this.email}...`);
            await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

            // Wait for login form
            await this.page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="mail"]', { timeout: 10000 });

            // Fill credentials
            const emailInput = await this.page.$('input[type="email"], input[name="email"], input[placeholder*="mail"]');
            if (emailInput) {
                await emailInput.click({ clickCount: 3 }); // Select all
                await emailInput.type(this.email, { delay: 50 });
            }

            const passInput = await this.page.$('input[type="password"], input[name="password"]');
            if (passInput) {
                await passInput.click({ clickCount: 3 });
                await passInput.type(this.password, { delay: 50 });
            }

            // Submit
            const submitBtn = await this.page.$('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")');
            if (submitBtn) {
                await submitBtn.click();
            } else {
                await this.page.keyboard.press('Enter');
            }

            // Wait for dashboard to load
            await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });
            await new Promise(r => setTimeout(r, 3000));

            // Verify login
            const currentUrl = this.page.url();
            if (currentUrl.includes('/login') || currentUrl.includes('/signup')) {
                console.error('[GFXToolz] ❌ Login failed. Check credentials.');
                return false;
            }

            this.isLoggedIn = true;
            console.log('[GFXToolz] ✅ Logged in successfully!');
            return true;

        } catch (err) {
            console.error('[GFXToolz] ❌ Login error:', err.message);
            return false;
        }
    }

    // ─── Image Generation ────────────────────────────────
    /**
     * Generate an image using one of GFXToolz's AI image tools.
     * @param {string} prompt - The text prompt for image generation
     * @param {string} style - Style preset ('realistic', 'artistic', 'anime', 'logo')
     * @returns {string|null} - Path to downloaded image, or null on failure
     */
    async generateImage(prompt, style = 'realistic') {
        if (!this.isLoggedIn) {
            const loggedIn = await this.login();
            if (!loggedIn) return null;
        }

        const outputFile = path.join(this.outputDir, `img_${Date.now()}.png`);

        try {
            console.log(`[GFXToolz] 🖼️  Generating image: "${prompt.substring(0, 60)}..."`);

            // Navigate to image generation tool
            // GFXToolz aggregates tools — look for Flux, DALL-E, or generic image gen
            await this.page.goto(`${this.baseUrl}/tools`, { waitUntil: 'networkidle2', timeout: 20000 });
            await new Promise(r => setTimeout(r, 2000));

            // Search for image generation tool
            const searchInput = await this.page.$('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]');
            if (searchInput) {
                await searchInput.click({ clickCount: 3 });
                await searchInput.type('image generator', { delay: 30 });
                await new Promise(r => setTimeout(r, 1500));
            }

            // Click the first available image generation tool
            const toolLink = await this.page.$('a[href*="image"], a[href*="flux"], a[href*="generate"], div[data-tool*="image"]');
            if (toolLink) {
                await toolLink.click();
                await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });
                await new Promise(r => setTimeout(r, 2000));
            }

            // Find prompt input and enter text
            const promptInput = await this.page.$('textarea, input[placeholder*="prompt"], input[placeholder*="describe"]');
            if (promptInput) {
                await promptInput.click({ clickCount: 3 });
                await promptInput.type(prompt, { delay: 20 });
            }

            // Click generate button
            const generateBtn = await this.page.$('button:has-text("Generate"), button:has-text("Create"), button[type="submit"]');
            if (generateBtn) {
                await generateBtn.click();
            }

            // Wait for generation (can take 10-60 seconds)
            console.log('[GFXToolz]    ⏳ Waiting for generation...');
            await new Promise(r => setTimeout(r, 30000));

            // Try to find and download the generated image
            const imageElement = await this.page.$('img[src*="generated"], img[src*="output"], img[src*="result"]');
            if (imageElement) {
                const imageUrl = await imageElement.evaluate(el => el.src);

                // Download the image
                const viewSource = await this.page.goto(imageUrl);
                const buffer = await viewSource.buffer();
                fs.writeFileSync(outputFile, buffer);

                console.log(`[GFXToolz] ✅ Image saved: ${outputFile}`);
                return outputFile;
            }

            // Fallback: take a screenshot of the result area
            console.log('[GFXToolz]    📸 Taking screenshot of result...');
            await this.page.screenshot({ path: outputFile, fullPage: false });
            return outputFile;

        } catch (err) {
            console.error('[GFXToolz] ❌ Image generation error:', err.message);
            return null;
        }
    }

    // ─── Video Generation ────────────────────────────────
    /**
     * Generate a video using GFXToolz's AI video tools (Minimax, Luma, etc.)
     * @param {string} prompt - Text prompt or script for video
     * @param {string} imageRef - Optional reference image path
     * @returns {string|null} - Path to downloaded video, or null on failure
     */
    async generateVideo(prompt, imageRef = null) {
        if (!this.isLoggedIn) {
            const loggedIn = await this.login();
            if (!loggedIn) return null;
        }

        const outputFile = path.join(this.outputDir, `vid_${Date.now()}.mp4`);

        try {
            console.log(`[GFXToolz] 🎬 Generating video: "${prompt.substring(0, 60)}..."`);

            // Navigate to video generation
            await this.page.goto(`${this.baseUrl}/tools`, { waitUntil: 'networkidle2', timeout: 20000 });
            await new Promise(r => setTimeout(r, 2000));

            // Search for video tool
            const searchInput = await this.page.$('input[type="search"], input[placeholder*="search"]');
            if (searchInput) {
                await searchInput.click({ clickCount: 3 });
                await searchInput.type('video generator', { delay: 30 });
                await new Promise(r => setTimeout(r, 1500));
            }

            // Click video generation tool
            const toolLink = await this.page.$('a[href*="video"], a[href*="minimax"], a[href*="luma"]');
            if (toolLink) {
                await toolLink.click();
                await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });
                await new Promise(r => setTimeout(r, 2000));
            }

            // Upload reference image if provided
            if (imageRef && fs.existsSync(imageRef)) {
                const fileInput = await this.page.$('input[type="file"]');
                if (fileInput) {
                    await fileInput.uploadFile(imageRef);
                    await new Promise(r => setTimeout(r, 2000));
                    console.log('[GFXToolz]    📎 Reference image uploaded');
                }
            }

            // Enter prompt
            const promptInput = await this.page.$('textarea, input[placeholder*="prompt"]');
            if (promptInput) {
                await promptInput.click({ clickCount: 3 });
                await promptInput.type(prompt, { delay: 20 });
            }

            // Click generate
            const generateBtn = await this.page.$('button:has-text("Generate"), button:has-text("Create"), button[type="submit"]');
            if (generateBtn) {
                await generateBtn.click();
            }

            // Video generation takes longer
            console.log('[GFXToolz]    ⏳ Waiting for video generation (this may take 1-3 minutes)...');
            await new Promise(r => setTimeout(r, 120000)); // 2 minutes

            // Download button
            const downloadBtn = await this.page.$('a[download], button:has-text("Download"), a[href*="download"]');
            if (downloadBtn) {
                // Set download behavior
                const client = await this.page.target().createCDPSession();
                await client.send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: this.outputDir
                });
                await downloadBtn.click();
                await new Promise(r => setTimeout(r, 10000));
                console.log(`[GFXToolz] ✅ Video saved: ${outputFile}`);
                return outputFile;
            }

            console.log('[GFXToolz] ⚠️ Could not find download button. Video may need manual download.');
            return null;

        } catch (err) {
            console.error('[GFXToolz] ❌ Video generation error:', err.message);
            return null;
        }
    }

    // ─── Post-Processing (Enhance raw recording) ─────────
    /**
     * Take a raw Puppeteer screen recording and enhance it with GFXToolz.
     * This is the original pipeline from commander.js.
     * @param {string} rawVideoPath - Path to raw .mp4 recording
     * @param {string} personaType - Persona for template selection
     * @returns {string|null} - Path to processed video
     */
    async processVideo(rawVideoPath, personaType = 'builder') {
        if (!this.isLoggedIn) {
            const loggedIn = await this.login();
            if (!loggedIn) return null;
        }

        const outputFile = path.join(this.outputDir, `processed_${Date.now()}.mp4`);

        try {
            console.log(`[GFXToolz] 🎨 Processing video: ${path.basename(rawVideoPath)}`);
            console.log(`[GFXToolz]    Persona template: ${personaType}`);

            // Navigate to video editor / enhancer
            await this.page.goto(`${this.baseUrl}/tools`, { waitUntil: 'networkidle2', timeout: 20000 });
            await new Promise(r => setTimeout(r, 2000));

            // Search for video editor
            const searchInput = await this.page.$('input[type="search"], input[placeholder*="search"]');
            if (searchInput) {
                await searchInput.click({ clickCount: 3 });
                await searchInput.type('video editor', { delay: 30 });
                await new Promise(r => setTimeout(r, 1500));
            }

            // Click tool
            const toolLink = await this.page.$('a[href*="editor"], a[href*="enhance"]');
            if (toolLink) {
                await toolLink.click();
                await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });
                await new Promise(r => setTimeout(r, 2000));
            }

            // Upload raw video
            const fileInput = await this.page.$('input[type="file"]');
            if (fileInput && fs.existsSync(rawVideoPath)) {
                await fileInput.uploadFile(rawVideoPath);
                console.log('[GFXToolz]    📎 Raw video uploaded');
                await new Promise(r => setTimeout(r, 5000));
            }

            // Apply template based on persona
            const templateMap = {
                builder: 'tech',
                guru: 'professional',
                philosopher: 'minimal',
                artist: 'creative',
                memer: 'trending'
            };
            const templateStyle = templateMap[personaType] || 'professional';
            console.log(`[GFXToolz]    🎭 Applying "${templateStyle}" template...`);

            // Process and wait
            const processBtn = await this.page.$('button:has-text("Process"), button:has-text("Apply"), button:has-text("Enhance")');
            if (processBtn) {
                await processBtn.click();
            }

            console.log('[GFXToolz]    ⏳ Processing...');
            await new Promise(r => setTimeout(r, 60000));

            // Download
            const downloadBtn = await this.page.$('a[download], button:has-text("Download")');
            if (downloadBtn) {
                const client = await this.page.target().createCDPSession();
                await client.send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: this.outputDir
                });
                await downloadBtn.click();
                await new Promise(r => setTimeout(r, 10000));
                console.log(`[GFXToolz] ✅ Processed video saved: ${outputFile}`);
                return outputFile;
            }

            return rawVideoPath; // Return original if processing fails

        } catch (err) {
            console.error('[GFXToolz] ❌ Video processing error:', err.message);
            return rawVideoPath;
        }
    }

    // ─── Caption Generation ──────────────────────────────
    /**
     * Use GFXToolz's AI content writer to generate captions.
     * @param {string} topic - The topic or seed text
     * @param {string} platform - Target platform (twitter, instagram, etc.)
     * @returns {string} - Generated caption text
     */
    async generateCaption(topic, platform = 'twitter') {
        if (!this.isLoggedIn) {
            const loggedIn = await this.login();
            if (!loggedIn) return `Check out ${topic}! #CubiQo`;
        }

        try {
            console.log(`[GFXToolz] ✍️  Generating caption for ${platform}...`);

            await this.page.goto(`${this.baseUrl}/tools`, { waitUntil: 'networkidle2', timeout: 20000 });
            await new Promise(r => setTimeout(r, 2000));

            // Search for content writer
            const searchInput = await this.page.$('input[type="search"], input[placeholder*="search"]');
            if (searchInput) {
                await searchInput.click({ clickCount: 3 });
                await searchInput.type('content writer', { delay: 30 });
                await new Promise(r => setTimeout(r, 1500));
            }

            const toolLink = await this.page.$('a[href*="writer"], a[href*="content"], a[href*="caption"]');
            if (toolLink) {
                await toolLink.click();
                await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });
                await new Promise(r => setTimeout(r, 2000));
            }

            // Enter topic
            const promptInput = await this.page.$('textarea, input[placeholder*="topic"], input[placeholder*="prompt"]');
            if (promptInput) {
                const fullPrompt = `Write a ${platform} post about: ${topic}. Brand: CubiQo (AI life companion). Tone: confident, premium, futuristic.`;
                await promptInput.click({ clickCount: 3 });
                await promptInput.type(fullPrompt, { delay: 10 });
            }

            // Generate
            const generateBtn = await this.page.$('button:has-text("Generate"), button:has-text("Write"), button[type="submit"]');
            if (generateBtn) {
                await generateBtn.click();
            }

            await new Promise(r => setTimeout(r, 10000));

            // Extract the generated text
            const resultText = await this.page.evaluate(() => {
                // Try common output selectors
                const selectors = [
                    '.output-text', '.result-text', '.generated-content',
                    '[data-output]', '.ai-response', '.content-output',
                    'div.output', 'pre', '.response'
                ];
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && el.textContent.trim()) return el.textContent.trim();
                }
                // Fallback: get the last large text block on page
                const allText = document.querySelectorAll('p, div');
                let longest = '';
                allText.forEach(el => {
                    const t = el.textContent.trim();
                    if (t.length > longest.length && t.length < 1000) longest = t;
                });
                return longest || null;
            });

            if (resultText) {
                console.log(`[GFXToolz] ✅ Caption generated: "${resultText.substring(0, 80)}..."`);
                return resultText;
            }

            return `Exploring ${topic} with CubiQo. The future of AI is personal. #CubiQo`;

        } catch (err) {
            console.error('[GFXToolz] ❌ Caption generation error:', err.message);
            return `Check out ${topic}! #CubiQo #AI`;
        }
    }
}

module.exports = GFXToolz;
