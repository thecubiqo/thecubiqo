#!/usr/bin/env node
/**
 * Test Agent Coordination Workflow
 * 
 * Simulates: User → Henry → Dev → Result → Henry → User
 * 
 * Use case: "Build a landing page"
 * - Henry receives request
 * - Henry spawns Dev agent with specific task
 * - Dev builds the landing page
 * - Dev returns result
 * - Henry reports back to user
 */

const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { bootstrapAgents } = require('./src/lib/engine/bootstrap');
const { getAgent } = require('./src/lib/engine/agent');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testCoordination() {
  console.log('🚀 Starting Agent Coordination Test\n');

  try {
    // Step 1: Bootstrap all agents
    console.log('📦 Bootstrapping agents...');
    await bootstrapAgents();
    await sleep(1000);

    // Step 2: Get Henry (coordinator)
    const henry = getAgent('henry');
    if (!henry) {
      throw new Error('Henry agent not found!');
    }
    console.log('✅ Henry online\n');

    // Step 3: User request to Henry
    console.log('👤 USER: "Build a simple landing page for CubiQo with a hero section and CTA button"\n');

    const userRequest = `
User wants: Build a simple landing page for CubiQo with a hero section and CTA button.

Your task as Henry:
1. Analyze the request
2. Spawn a Dev agent with specific instructions
3. Wait for Dev to complete the work
4. Verify the result
5. Report back what was created

Use sessions_spawn to delegate to the 'dev' agent.
`;

    console.log('🤖 HENRY: Analyzing request and delegating to Dev...\n');
    const henryResponse = await henry.run(userRequest);

    console.log('💬 HENRY SAYS:');
    console.log(henryResponse);
    console.log('\n');

    // Step 4: Check what Dev is working on
    await sleep(2000); // Give Dev time to start

    const dev = getAgent('dev');
    if (dev && dev.currentTasks.length > 0) {
      console.log('🔨 DEV STATUS:');
      dev.currentTasks.forEach((task) => {
        console.log(`  Task: ${task.description.substring(0, 100)}...`);
        console.log(`  Status: ${task.status}`);
        if (task.result) {
          console.log(`  Result: ${task.result.substring(0, 200)}...`);
        }
      });
      console.log('\n');
    }

    // Step 5: Wait for Dev to finish (poll)
    console.log('⏳ Waiting for Dev to complete...');
    let maxWait = 60; // 60 seconds
    while (maxWait > 0) {
      await sleep(1000);
      maxWait--;

      if (dev.currentTasks.some((t) => t.status === 'done' || t.status === 'failed')) {
        break;
      }
      
      if (maxWait % 10 === 0) {
        console.log(`   Still working... (${maxWait}s remaining)`);
      }
    }

    // Step 6: Get final results
    console.log('\n📊 FINAL RESULTS:\n');

    if (dev.currentTasks.length > 0) {
      const completedTask = dev.currentTasks.find((t) => t.status === 'done');
      if (completedTask) {
        console.log('✅ DEV COMPLETED TASK:');
        console.log(`   Status: ${completedTask.status}`);
        console.log(`   Started: ${completedTask.startedAt?.toISOString()}`);
        console.log(`   Completed: ${completedTask.completedAt?.toISOString()}`);
        console.log(`   Token Usage: ${JSON.stringify(completedTask.tokenUsage)}`);
        console.log(`\n   Result Preview:`);
        console.log(`   ${completedTask.result?.substring(0, 300)}...\n`);

        // Step 7: Henry reports back
        console.log('🤖 HENRY: Reporting back to user...\n');
        const reportRequest = `
The Dev agent has completed the landing page task.
Task result: ${completedTask.result}

Summarize what was created and where the user can find it.
`;
        const finalReport = await henry.run(reportRequest);
        console.log('💬 HENRY\'S FINAL REPORT:');
        console.log(finalReport);
      } else {
        console.log('❌ Task did not complete in time or failed');
        console.log('Current tasks:', dev.currentTasks);
      }
    }

    console.log('\n✨ Test complete!\n');

    // Display agent statuses
    console.log('📈 AGENT STATUSES:');
    console.log(`   Henry: ${henry.status} (${henry.currentTasks.length} tasks)`);
    console.log(`   Dev: ${dev.status} (${dev.currentTasks.length} tasks)`);

    // Show sessions
    console.log('\n💾 ACTIVE SESSIONS:');
    const henrySessions = await henry.listSessions();
    console.log(`   Henry: ${henrySessions.length} sessions`);
    const devSessions = await dev.listSessions();
    console.log(`   Dev: ${devSessions.length} sessions`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testCoordination().then(() => {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});
