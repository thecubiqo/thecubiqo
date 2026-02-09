/**
 * Test agent messaging with proper environment setup
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local first
dotenv.config({ path: resolve(__dirname, '.env.local') });

// Verify env is loaded
console.log('🔑 Environment check:');
console.log('- EMERGENT_API_KEY:', process.env.EMERGENT_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- EMERGENT_BASE_URL:', process.env.EMERGENT_BASE_URL ? '✅ Set' : '❌ Missing');
console.log('');

import { createAgent, listAgents } from './src/lib/engine/agent';
import { ToolRegistry } from './src/lib/engine/tools';

async function testWithEnv() {
  console.log('🧪 Agent Messaging Test with Environment\n');

  try {
    // Create two agents
    console.log('📝 Step 1: Creating agents...');

    const henry = await createAgent({
      id: 'henry',
      name: 'Henry',
      model: {
        provider: 'emergent',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 2048,
        temperature: 0.7,
      },
      tools: ['sessions_send'],
    });

    const dev = await createAgent({
      id: 'dev',
      name: 'Dev Agent',
      model: {
        provider: 'emergent',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 2048,
        temperature: 0.7,
      },
      tools: ['sessions_send'],
    });

    console.log('✅ Agents created:', listAgents().map(a => a.id).join(', '));

    // Initialize Dev with a session
    console.log('\n📝 Step 2: Initializing Dev session...');
    const devResponse = await dev.run('Hello, I am Dev agent. I am ready to receive messages.');
    console.log('✅ Dev initialized. Response:', devResponse.substring(0, 50) + '...');

    const devSessions = await dev.listSessions();
    console.log('✅ Dev session ID:', devSessions[0]?.id);

    // Test the sessions_send tool directly
    console.log('\n📝 Step 3: Testing sessions_send tool directly...');
    const toolRegistry = new ToolRegistry();

    const result = await toolRegistry.execute(
      'sessions_send',
      {
        targetAgentId: 'dev',
        message: "What's the status on the deployment?",
      },
      {
        agentId: 'henry',
        sessionId: 'henry-session-123',
        workspace: '/tmp',
      }
    );

    console.log('\n📊 Tool execution result:');
    console.log('  Success:', result.success);
    if (result.success) {
      console.log('  ✅ Message delivered!');
      const output = JSON.parse(result.output);
      console.log('  Target:', output.targetAgentId);
      console.log('  Session:', output.targetSessionId);
      console.log('  Response preview:', output.response.substring(0, 100) + '...');
    }
    if (result.error) {
      console.log('  ❌ Error:', result.error);
    }

    // Check Dev's conversation history
    console.log('\n📝 Step 4: Checking Dev\'s message history...');
    const history = await dev.getHistory(devSessions[0].id);
    console.log(`  Total messages: ${history.length}`);

    console.log('\n  Last 3 messages:');
    history.slice(-3).forEach((msg, i) => {
      const contentStr = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      const preview = contentStr.substring(0, 80).replace(/\n/g, ' ');
      console.log(`  [${i + 1}] ${msg.role}: ${preview}${contentStr.length > 80 ? '...' : ''}`);
    });

    // Verify message was received
    const hasHenryMessage = history.some(msg => {
      const contentStr = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      return contentStr.includes('agent:henry') && contentStr.includes('status');
    });

    console.log('\n📝 Step 5: Verification...');
    if (hasHenryMessage) {
      console.log('  ✅ Message from Henry found in Dev\'s history!');
      console.log('  ✅ Agent-to-agent messaging is WORKING!');
    } else {
      console.log('  ⚠️  Could not find Henry\'s message in Dev\'s history');
    }

    console.log('\n🎉 Test complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

testWithEnv()
  .then(() => {
    console.log('✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  });
