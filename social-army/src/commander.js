/**
 * The Commander v2 — Fleet Mode
 * Orchestrates the Social Army (100 accounts).
 * 
 * Logic:
 * 1. Loads 100-account Fleet Config.
 * 2. Picks one account every 10 mins (Rotates through platforms).
 * 3. Triggers Content Engine (GFXToolz/Interactor).
 * 4. Posts using specific account proxy.
 * 
 * NOTE: Run with `npx tsx src/commander.js` (tsx handles TS imports).
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Dynamic import helpers — content-engine & poster are TypeScript modules,
// so we need tsx at runtime.  When executed via `npx tsx` this works
// natively; if executed via plain `node` the require will fail gracefully.
let generateContent;
let postToSocial;

try {
  ({ generateContent } = require('./content-engine'));
} catch (_e) {
  console.error('❌ Cannot load content-engine.ts — run with `npx tsx src/commander.js`');
  process.exit(1);
}

try {
  ({ postToSocial } = require('./poster'));
} catch (_e) {
  console.warn('⚠️ Cannot load poster.ts — posting will be skipped');
  postToSocial = async () => false;
}

const CONFIG_PATH = path.join(__dirname, '../config/platforms.json');

async function getFleet() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ Fleet config missing! Run: node scripts/fleet-config-helper.js --generate');
    return [];
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

async function runCycle(accountIndex) {
  const fleet = await getFleet();
  if (fleet.length === 0) return;

  // Wrap around index
  const idx = accountIndex % fleet.length;
  const target = fleet[idx];

  console.log(`\n⚔️  FLEET MISSION: [${idx + 1}/${fleet.length}] ⚔️`);
  console.log(`🤖 Agent: ${target.handle} | Platform: ${target.platform.toUpperCase()}`);

  try {
    // 1. Generate Content
    const content = await generateContent({
      campaignTopic: "Launch of CubiQo AI - The future of personal intelligence",
      personaType: target.type,
      platform: target.platform,
      contentType: Math.random() > 0.5 ? 'image' : 'text'
    });

    // 2. Post to Social (Real automated login)
    const success = await postToSocial({
      platform: target.platform,
      username: target.username || target.handle,
      password: target.password,
      caption: content.caption,
      assetUrl: content.imageUrl || content.videoUrl
    });

    if (success) {
      console.log(`✅ Success: Deployed to ${target.handle}`);
    } else {
      console.log(`⚠️  Post skipped or failed for ${target.handle}. Check logs.`);
    }

  } catch (err) {
    console.error(`❌ Mission Crash for ${target.handle}:`, err.message);
  }
}

async function startArmy() {
  console.log('⚔️  Social Army Commander ONLINE ⚔️');
  console.log('⏱️ Schedule: One post every 10 minutes (Rotating Fleet)');

  let currentAccount = 0;

  async function scheduleNext() {
    // Randomized Jitter (adds 0-2 mins to avoid exact 10:00 patterns)
    const jitter = Math.floor(Math.random() * 2 * 60 * 1000);
    const delay = (10 * 60 * 1000) + jitter;

    console.log(`\n💤 Next mission in ${Math.round(delay / 1000 / 60)} minutes...`);

    setTimeout(async () => {
      if (process.env.SOCIAL_ARMY_STATUS === 'ON') {
        await runCycle(currentAccount);
        currentAccount++;
      } else {
        console.log('zzz System Paused (SOCIAL_ARMY_STATUS=OFF)');
      }
      scheduleNext();
    }, delay);
  }

  // Initial Launch
  if (process.env.SOCIAL_ARMY_STATUS === 'ON') {
    await runCycle(currentAccount);
    currentAccount++;
  }

  scheduleNext();
}

if (require.main === module) {
  startArmy();
}
