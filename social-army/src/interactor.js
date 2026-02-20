const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

// Configuration
const CUBIQO_URL = process.env.CUBIQO_URL || 'https://staging0217.cubiqo.ai'; // Default to staging for safety
const RECORDING_DURATION_MS = 15000; // 15 seconds

/**
 * The CubiQo Interactor
 * Simulates a user session to generate authentic video content.
 */
async function captureSession(promptText, outputFilename) {
    console.log(`[Interactor] Starting session for prompt: "${promptText}"`);

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] // Required for server/Docker environments
    });

    const page = await browser.newPage();

    // Set viewport to vertical video format (9:16) for TikTok/Reels
    await page.setViewport({ width: 720, height: 1280 });

    const recorder = new PuppeteerScreenRecorder(page);
    const outputPath = path.join(__dirname, '../output', outputFilename);

    // Ensure output dir exists
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    try {
        console.log('[Interactor] Navigating to CubiQo...');
        await page.goto(CUBIQO_URL, { waitUntil: 'networkidle0' });

        // Start Recording
        console.log('[Interactor] 🔴 Recording started...');
        await recorder.start(outputPath);

        // Simulate Interaction: Click the "Voice Mode" button or Chat
        // Use selectors specific to FullscreenApp.tsx
        // For now, we simulate typing in the Chat interface if available, or just interacting with the Cube

        // 1. Wait for loading
        await new Promise(r => setTimeout(r, 2000));

        // 2. Type the prompt (Visual only, simulating user input)
        // If there's an input field, type in it. 
        // For the Voice Mode UI, we might overlay text, but let's try to find an interactive element.
        // Assuming we are in "Voice Mode" (default), we might just record the Cube idling/animating.
        // If we want to simulate "Speaking", we might need to trigger the microphone state (hard in headless).
        // ALTERNATIVE: Go to /chat (Text Mode) to show typing.

        // Let's stick to the visual Cube for now.

        // 3. Capture the "Magic" (Wait for animation)
        await new Promise(r => setTimeout(r, RECORDING_DURATION_MS));

        // Stop Recording
        await recorder.stop();
        console.log(`[Interactor] ⏹️ Recording saved to: ${outputPath}`);

    } catch (error) {
        console.error('[Interactor] Error:', error);
    } finally {
        await browser.close();
    }

    return outputPath;
}

// standalone execution (for testing)
if (require.main === module) {
    captureSession("Explain quantum computing", `demo_${Date.now()}.mp4`);
}

module.exports = { captureSession };
