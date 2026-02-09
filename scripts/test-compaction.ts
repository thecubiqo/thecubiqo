/**
 * Test script for session compaction
 * Tests the automatic compaction of long conversations
 */

import { createAgent } from '@/lib/engine/agent';
import { ModelConfig } from '@/types/agent';

async function testCompaction() {
  console.log('=== Session Compaction Test ===\n');

  // Create test agent
  const testModel: ModelConfig = {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.EMERGENT_API_KEY,
    baseUrl: process.env.EMERGENT_BASE_URL,
    temperature: 0.7,
    maxTokens: 4096,
  };

  const agent = await createAgent({
    id: 'test-compaction',
    name: 'Test Compaction Agent',
    model: testModel,
    tools: [],
  });

  console.log('✓ Agent created\n');

  // Create a session with many messages
  const sessionStore = (agent as any).sessionStore;
  const session = await sessionStore.create('test-compaction', 'test');
  
  console.log(`✓ Session created: ${session.id}\n`);

  // Add system message
  await sessionStore.addMessage(session.id, {
    role: 'system',
    content: 'You are a helpful AI assistant.',
  });

  // Simulate a long conversation (50+ messages)
  console.log('Adding 50+ messages to simulate long conversation...');
  
  for (let i = 1; i <= 25; i++) {
    // User message
    await sessionStore.addMessage(session.id, {
      role: 'user',
      content: `User message ${i}: This is a test message with some context about topic ${i}. Let me share more details about what I'm working on. I need help with understanding various concepts and completing tasks related to software development, AI, and data science.`,
    });

    // Assistant response
    await sessionStore.addMessage(session.id, {
      role: 'assistant',
      content: `Assistant response ${i}: Thank you for sharing that information. Based on what you've told me about topic ${i}, I can help you with that. Here's a detailed explanation of the concepts involved. Let me break this down step by step and provide you with comprehensive guidance on how to approach this problem effectively.`,
    });
  }

  console.log('✓ Added 50+ messages\n');

  // Get initial stats
  const statsBefore = sessionStore.getTokenStats(session.id);
  console.log('=== Stats Before Compaction ===');
  console.log(`Messages: ${statsBefore.messageCount}`);
  console.log(`Total tokens: ~${statsBefore.totalTokens}`);
  console.log(`Avg tokens/message: ~${statsBefore.averageTokensPerMessage}`);
  console.log();

  // Check if compaction is needed
  const needsCompaction = sessionStore.needsCompaction(session.id, testModel.model);
  console.log(`Needs compaction (75% threshold): ${needsCompaction ? '❌ YES' : '✓ NO'}\n`);

  // Test manual compaction with force flag
  console.log('Running forced compaction...\n');
  
  try {
    const result = await sessionStore.compactSession(session.id, testModel, {
      keepRecentCount: 10,
      forceCompact: true,
    });

    if (result.success) {
      console.log('=== Compaction Results ===');
      console.log(`✓ Success!`);
      console.log(`Messages: ${result.messagesBefore} → ${result.messagesAfter}`);
      console.log(`Tokens: ~${result.originalTokens} → ~${result.compactedTokens}`);
      console.log(`Saved: ~${result.tokensSaved} tokens (${((result.tokensSaved / result.originalTokens) * 100).toFixed(1)}%)`);
      console.log();

      // Verify the compacted session
      const history = await sessionStore.getHistory(session.id);
      console.log('=== Compacted Session Structure ===');
      history.forEach((msg: any, idx: number) => {
        const preview = msg.content.substring(0, 60).replace(/\n/g, ' ');
        console.log(`${idx + 1}. [${msg.role}] ${preview}${msg.content.length > 60 ? '...' : ''}`);
        if (msg.isSummary) {
          console.log(`   ↳ Summary of ${msg.summarizedMessageIds?.length || 0} messages`);
        }
      });
      console.log();

      // Test automatic compaction trigger
      console.log('=== Testing Auto-Compaction Trigger ===');
      
      // Add more messages to simulate reaching threshold
      for (let i = 26; i <= 40; i++) {
        await sessionStore.addMessage(session.id, {
          role: 'user',
          content: `User message ${i}: Additional content to test auto-compaction. This should trigger automatic compaction when token threshold is reached.`,
        });

        await sessionStore.addMessage(session.id, {
          role: 'assistant',
          content: `Assistant response ${i}: Responding to your message with helpful information.`,
        });
      }

      const statsAfterAdding = sessionStore.getTokenStats(session.id);
      console.log(`Messages after adding more: ${statsAfterAdding.messageCount}`);
      console.log(`Tokens: ~${statsAfterAdding.totalTokens}`);
      
      const needsAutoCompaction = sessionStore.needsCompaction(session.id, testModel.model);
      console.log(`Should trigger auto-compaction: ${needsAutoCompaction ? '✓ YES' : '✗ NO'}`);
      console.log();

      console.log('✅ All tests passed!');
    } else {
      console.log('ℹ️ Compaction was not needed (token threshold not reached)');
    }
  } catch (error) {
    console.error('❌ Compaction failed:', error);
    throw error;
  }

  // Cleanup
  await sessionStore.delete(session.id);
  console.log('\n✓ Test session cleaned up');
}

// Run test
testCompaction()
  .then(() => {
    console.log('\n=== Test Complete ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
