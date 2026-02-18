/**
 * The Commander
 * Orchestrates the Social Army.
 * 
 * Logic:
 * 1. Reads the Platform Schedule.
 * 2. Wakes up the Content Factory (Interactor + GFXToolz).
 * 3. Distributes content to the 10 Platforms.
 */

require('dotenv').config();
const platforms = require('../config/platforms.json');
const { captureSession } = require('./interactor');
const GFXToolz = require('./gfxtoolz');

const gfx = new GFXToolz(process.env.GFX_TOOLZ_USER, process.env.GFX_TOOLZ_PASS);

async function runCampaign() {
  console.log('⚔️  Social Army Commander Initialized ⚔️');
  console.log(`🎯 Targets: ${platforms.length} Platforms`);

  // 1. Authenticate with GFX Toolz
  await gfx.login();

  // 2. Loop through platforms (Mocking the loop for the pilot)
  for (const platform of platforms) {
    console.log(`\n-----------------------------------`);
    console.log(`🤖 waking up agent: ${platform.handle} (${platform.type})`);

    // Step A: Generate Content (Recording)
    // In reality, we'd vary the prompt based on Persona (platform.type)
    const prompt = `Show me the ${platform.type} features of CubiQo`;
    const rawVideoPath = await captureSession(prompt, `${platform.platform}_${Date.now()}.mp4`);

    // Step B: Enhance Content (GFXToolz)
    const processedVideo = await gfx.processVideo(rawVideoPath, platform.type);

    // Step C: Post (Simulated)
    // We would use Puppeteer to log in to the specific social platform here
    console.log(`🚀 POSTING to ${platform.platform.toUpperCase()}...`);
    console.log(`✅ Success: Content deployed to ${platform.handle}`);
  }
}

// Run Loop (Every 10 Minutes)
async function startDaemon() {
  console.log('⚔️  Social Army Commander Initialized ⚔️');
  console.log(`🎯 Targets: ${platforms.length} Platforms`);

  // Login once at startup
  await gfx.login();

  // Initial Run
  await runCampaign();

  // Schedule Loop (10 minutes = 600,000 ms)
  setInterval(async () => {
    // Check if system is enabled in DB (Mock for now, would be supabase query)
    const isSystemOn = process.env.SOCIAL_ARMY_STATUS === 'ON';

    if (isSystemOn) {
      console.log('\n⏰ Scheduled Cycle Triggered...');
      await runCampaign();
    } else {
      console.log('\nzzz System Paused. Waiting for Start signal...');
    }
  }, 10 * 60 * 1000);
}

startDaemon();
