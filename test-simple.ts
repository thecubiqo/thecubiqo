/**
 * Simple test for agent messaging tool
 */

import { createAgent, listAgents } from './src/lib/engine/agent';

async function simpleTest() {
  console.log('🧪 Simple Agent Messaging Test\n');

  try {
    // Create two agents
    console.log('Creating agents...');
    
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
    console.log('\n🔧 Initializing Dev session...');
    await dev.run('Hello, I am Dev agent.');
    const devSessions = await dev.listSessions();
    console.log('✅ Dev session:', devSessions[0]?.id);

    // Test tool directly
    console.log('\n📨 Testing sessions_send tool...');
    const { ToolRegistry } = await import('./src/lib/engine/tools');
    const toolRegistry = new ToolRegistry();

    const result = await toolRegistry.execute(
      'sessions_send',
      {
        targetAgentId: 'dev',
        message: "What's the status?",
      },
      {
        agentId: 'henry',
        sessionId: 'test-session',
        workspace: '/tmp',
      }
    );

    console.log('\n📊 Result:');
    console.log('Success:', result.success);
    console.log('Output:', result.output);
    if (result.error) console.log('Error:', result.error);

    // Check Dev's history
    console.log('\n📜 Dev message history:');
    const history = await dev.getHistory(devSessions[0].id);
    history.forEach((msg, i) => {
      console.log(`\n[${i}] ${msg.role}: ${msg.content.substring(0, 80)}...`);
    });

    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

simpleTest()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
