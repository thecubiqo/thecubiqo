#!/usr/bin/env node
/**
 * Simple Agent Spawn Test
 * Tests sessions_spawn and sessions_send tools
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function testSpawn() {
  console.log('🧪 Testing Agent Spawn Capabilities\n');

  // Import after env is loaded
  const { bootstrapAgents } = require('./src/lib/engine/bootstrap');
  const { getAgent } = require('./src/lib/engine/agent');

  try {
    // Step 1: Bootstrap agents
    console.log('1️⃣  Bootstrapping agents...');
    await bootstrapAgents();
    console.log('   ✅ Agents ready\n');

    // Step 2: Get Henry
    const henry = getAgent('henry');
    if (!henry) throw new Error('Henry not found');
    console.log('2️⃣  Henry agent loaded');
    console.log(`   Tools: ${henry.tools.join(', ')}\n`);

    // Step 3: Test sessions_spawn
    console.log('3️⃣  Testing sessions_spawn...');
    const task = 'Create a simple test file at /root/clawd/thecubiqo/test-output.txt with content: "Hello from Dev agent! This file was created by an AI."';
    
    console.log(`   Task: ${task}\n`);
    
    const spawnResult = await henry.spawn(task);
    console.log('   ✅ Spawn successful!');
    console.log(`   Run ID: ${spawnResult.runId}`);
    console.log(`   Session ID: ${spawnResult.sessionId}\n`);

    // Step 4: Wait for completion
    console.log('4️⃣  Waiting for Dev to complete (max 30s)...');
    
    const dev = getAgent('dev');
    let waited = 0;
    const maxWait = 30;

    while (waited < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      waited++;

      const task = dev.currentTasks.find((t) => t.id === spawnResult.runId);
      if (task && (task.status === 'done' || task.status === 'failed')) {
        console.log(`\n   ✅ Task ${task.status}!`);
        console.log(`   Duration: ${waited}s`);
        if (task.result) {
          console.log(`   Result: ${task.result.substring(0, 200)}...\n`);
        }
        break;
      }

      if (waited % 5 === 0) {
        process.stdout.write(`   ... ${waited}s elapsed\n`);
      }
    }

    // Step 5: Verify file was created
    console.log('5️⃣  Verifying output...');
    const fs = require('fs');
    const outputPath = '/root/clawd/thecubiqo/test-output.txt';
    
    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, 'utf-8');
      console.log('   ✅ File created successfully!');
      console.log(`   Content: "${content}"\n`);
    } else {
      console.log('   ⚠️  File not found (task may still be running)\n');
    }

    // Step 6: Check sessions
    console.log('6️⃣  Session info:');
    const henrySessions = await henry.listSessions();
    const devSessions = await dev.listSessions();
    console.log(`   Henry: ${henrySessions.length} session(s)`);
    console.log(`   Dev: ${devSessions.length} session(s)`);
    console.log(`   Dev tasks: ${dev.currentTasks.length}\n`);

    console.log('✅ Test complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

testSpawn();
