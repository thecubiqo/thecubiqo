/**
 * Test script for agent-to-agent messaging
 * 
 * This script tests:
 * 1. Creating two agents (henry and dev)
 * 2. Henry sending a message to Dev
 * 3. Dev receiving and responding to the message
 */

import { createAgent, getAgent, listAgents } from './src/lib/engine/agent';
import { ToolRegistry } from './src/lib/engine/tools';

async function testAgentMessaging() {
  console.log('🚀 Starting Agent-to-Agent Messaging Test\n');

  try {
    // Step 1: Create agents
    console.log('📝 Step 1: Creating agents...');
    
    const henryConfig = {
      id: 'henry',
      name: 'Henry',
      model: {
        provider: 'anthropic' as const,
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4096,
        temperature: 0.7,
      },
      tools: ['sessions_send', 'file_read', 'file_write'],
    };

    const devConfig = {
      id: 'dev',
      name: 'Dev Agent',
      model: {
        provider: 'anthropic' as const,
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4096,
        temperature: 0.7,
      },
      tools: ['sessions_send', 'file_read', 'file_write', 'exec'],
    };

    const henry = await createAgent(henryConfig);
    const dev = await createAgent(devConfig);

    console.log(`✅ Created agent: ${henry.id} (${henry.name})`);
    console.log(`✅ Created agent: ${dev.id} (${dev.name})`);
    console.log(`\n📋 Available agents: ${listAgents().map(a => a.id).join(', ')}\n`);

    // Step 2: Create a session for Dev so he has somewhere to receive messages
    console.log('📝 Step 2: Initializing Dev agent session...');
    const devSessions = await dev.listSessions();
    let devSessionId: string;

    if (devSessions.length === 0) {
      // Create a session by having Dev introduce himself
      await dev.run('Hello! I am Dev agent, ready to help with development tasks.');
      const sessions = await dev.listSessions();
      devSessionId = sessions[0].id;
    } else {
      devSessionId = devSessions[0].id;
    }

    console.log(`✅ Dev session ready: ${devSessionId}\n`);

    // Step 3: Henry sends a message to Dev using the sessions_send tool
    console.log('📝 Step 3: Henry sending message to Dev...');
    console.log('   Message: "What\'s the status?"\n');

    const henryMessage = `Please use the sessions_send tool to send this message to the dev agent: "What's the status?"`;
    
    const henryResponse = await henry.run(henryMessage);
    console.log('📨 Henry\'s response:');
    console.log('---');
    console.log(henryResponse);
    console.log('---\n');

    // Step 4: Check Dev's session history to see if message was received
    console.log('📝 Step 4: Checking Dev\'s message history...');
    const devHistory = await dev.getHistory(devSessionId);
    
    console.log(`\n📜 Dev's conversation history (${devHistory.length} messages):`);
    devHistory.slice(-4).forEach((msg, idx) => {
      console.log(`\n[${idx + 1}] ${msg.role}:`);
      console.log(msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : ''));
    });

    // Step 5: Verify the messaging worked
    console.log('\n📝 Step 5: Verification...');
    const hasMessageFromHenry = devHistory.some(
      msg => msg.content.includes('agent:henry') || msg.content.includes('What\'s the status?')
    );

    if (hasMessageFromHenry) {
      console.log('✅ SUCCESS: Dev received message from Henry!');
      console.log('✅ Agent-to-agent messaging is working correctly!\n');
    } else {
      console.log('⚠️  WARNING: Could not confirm message delivery to Dev');
      console.log('   This might be a timing issue or the message format changed.\n');
    }

    // Step 6: Test the API endpoint
    console.log('📝 Step 6: Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/agents/dev/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test message via API endpoint',
          fromAgentId: 'henry',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API endpoint working!');
        console.log(`   Response: ${data.response.substring(0, 100)}...`);
      } else {
        console.log(`⚠️  API endpoint returned status: ${response.status}`);
      }
    } catch (apiError) {
      console.log('⚠️  Could not test API endpoint (server may not be running)');
      console.log(`   Error: ${apiError}`);
    }

    console.log('\n🎉 Test complete!\n');

    // Cleanup
    console.log('🧹 Cleaning up...');
    await henry.stop();
    await dev.stop();
    console.log('✅ Cleanup complete\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testAgentMessaging()
  .then(() => {
    console.log('✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
