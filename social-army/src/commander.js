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

const gfx = new GFXToolz(process.env.GFX_TOOLZ_API_KEY);

async function runCampaign() {
  console.log(`🎯 Running campaign across ${platforms.length} platforms`);

  for (const platform of platforms) {
    try {
      console.log(`\n-----------------------------------`);
      console.log(`🤖 waking up agent: ${platform.handle} (${platform.type})`);

      // Step A: Generate Content (Recording)
      const prompt = `Show me the ${platform.type} features of CubiQo`;
      const rawVideoPath = await captureSession(prompt, `${platform.platform}_${Date.now()}.mp4`);

      // Step B: Enhance Content (GFXToolz)
      const processedVideo = await gfx.processVideo(rawVideoPath, platform.type);

      // Step C: Post (Simulated)
      console.log(`🚀 POSTING to ${platform.platform.toUpperCase()}...`);
      console.log(`✅ Success: Content deployed to ${platform.handle}`);
    } catch (err) {
      console.error(`❌ Failed for ${platform.handle}:`, err.message);
    }
  }
}

// Run Loop (Every 10 Minutes)
async function startDaemon() {
  console.log('⚔️  Social Army Commander Initialized ⚔️');
  console.log(`🎯 Targets: ${platforms.length} Platforms`);

  // Authenticate once at startup
  await gfx.login();

  // Initial Run
  await runCampaign();

  // Schedule Loop (10 minutes = 600,000 ms)
  const INTERVAL_MS = 10 * 60 * 1000;

  const tick = async () => {
    try {
      const isSystemOn = process.env.SOCIAL_ARMY_STATUS === 'ON';
      if (isSystemOn) {
        console.log('\n⏰ Scheduled Cycle Triggered...');
        await runCampaign();
      } else {
        console.log('\nzzz System Paused. Waiting for Start signal...');
      }
    } catch (err) {
      console.error('❌ Campaign cycle error:', err.message);
    }
    setTimeout(tick, INTERVAL_MS);
  };

  setTimeout(tick, INTERVAL_MS);
}

startDaemon();
