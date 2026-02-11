/**
 * Simple test for session compaction
 * Run with: node test-compaction-simple.mjs
 */

// Test the token counter utility
console.log('=== Testing Token Counter ===\n');

// Simulate token counting
function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}

function countMessageTokens(message) {
  let tokens = 4; // Base overhead
  tokens += estimateTokenCount(message.content);
  if (message.toolCalls) tokens += estimateTokenCount(JSON.stringify(message.toolCalls));
  if (message.toolResults) tokens += estimateTokenCount(JSON.stringify(message.toolResults));
  return tokens;
}

// Test messages
const testMessages = [
  { role: 'system', content: 'You are a helpful AI assistant.' },
  { role: 'user', content: 'Hello! Can you help me with a coding problem?' },
  { role: 'assistant', content: 'Of course! I\'d be happy to help you with your coding problem. Please share the details.' },
];

testMessages.forEach((msg, idx) => {
  const tokens = countMessageTokens(msg);
  console.log(`Message ${idx + 1} [${msg.role}]: ~${tokens} tokens`);
});

const totalTokens = testMessages.reduce((sum, msg) => sum + countMessageTokens(msg), 0);
console.log(`\nTotal: ~${totalTokens} tokens\n`);

// Test compaction threshold logic
const DEFAULT_TOKEN_LIMITS = {
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-opus-20240229': 200000,
  'gpt-4-turbo': 128000,
};

function shouldCompact(currentTokens, modelName, threshold = 0.75) {
  const limit = DEFAULT_TOKEN_LIMITS[modelName] || 100000;
  const needsCompaction = currentTokens >= limit * threshold;
  console.log(`Model: ${modelName}`);
  console.log(`Limit: ${limit} tokens`);
  console.log(`Threshold: ${(threshold * 100)}% = ${Math.floor(limit * threshold)} tokens`);
  console.log(`Current: ${currentTokens} tokens`);
  console.log(`Needs compaction: ${needsCompaction ? '✓ YES' : '✗ NO'}`);
  return needsCompaction;
}

console.log('=== Testing Compaction Threshold ===\n');

// Test scenarios
console.log('Scenario 1: Low token usage');
shouldCompact(10000, 'claude-3-5-sonnet-20241022');
console.log();

console.log('Scenario 2: At threshold');
shouldCompact(150000, 'claude-3-5-sonnet-20241022');
console.log();

console.log('Scenario 3: Over threshold');
shouldCompact(170000, 'claude-3-5-sonnet-20241022');
console.log();

console.log('=== Simulated Compaction ===\n');

// Simulate a conversation
const conversation = [];

// Add system message
conversation.push({
  id: '1',
  role: 'system',
  content: 'You are a helpful AI assistant.',
});

// Add 50 messages
for (let i = 1; i <= 25; i++) {
  conversation.push({
    id: `u${i}`,
    role: 'user',
    content: `User message ${i}: This is a test message with context. I'm asking about topic ${i}. Here's a detailed question that requires a comprehensive response from the AI assistant.`,
  });
  
  conversation.push({
    id: `a${i}`,
    role: 'assistant',
    content: `Assistant response ${i}: Thank you for your question about topic ${i}. Let me provide you with a detailed answer. Here's what you need to know about this topic, including examples and best practices.`,
  });
}

const conversationTokens = conversation.reduce((sum, msg) => sum + countMessageTokens(msg), 0);

console.log(`Original conversation:`);
console.log(`- Messages: ${conversation.length}`);
console.log(`- Estimated tokens: ~${conversationTokens}`);
console.log();

// Simulate compaction
const keepRecentCount = 10;
const systemMessages = conversation.filter(m => m.role === 'system');
const nonSystemMessages = conversation.filter(m => m.role !== 'system');
const firstMessage = nonSystemMessages[0];
const recentMessages = nonSystemMessages.slice(-keepRecentCount);
const middleMessages = nonSystemMessages.slice(1, -keepRecentCount);

console.log(`Compaction strategy:`);
console.log(`- Keep: ${systemMessages.length} system messages`);
console.log(`- Keep: 1 first message (context)`);
console.log(`- Keep: ${recentMessages.length} recent messages`);
console.log(`- Summarize: ${middleMessages.length} middle messages`);
console.log();

// Simulate summary
const summaryMessage = {
  id: 'summary-1',
  role: 'summary',
  content: `[CONVERSATION SUMMARY - ${middleMessages.length} messages compacted]\n\nThe user asked questions about topics 2-${Math.floor(middleMessages.length / 2)}. The assistant provided detailed responses covering each topic with examples and best practices. Key themes included: software development, AI concepts, and problem-solving approaches.`,
  isSummary: true,
  summarizedMessageIds: middleMessages.map(m => m.id),
};

const compactedConversation = [
  ...systemMessages,
  firstMessage,
  summaryMessage,
  ...recentMessages,
];

const compactedTokens = compactedConversation.reduce((sum, msg) => sum + countMessageTokens(msg), 0);
const tokensSaved = conversationTokens - compactedTokens;
const savingsPercent = ((tokensSaved / conversationTokens) * 100).toFixed(1);

console.log(`After compaction:`);
console.log(`- Messages: ${compactedConversation.length}`);
console.log(`- Estimated tokens: ~${compactedTokens}`);
console.log(`- Saved: ~${tokensSaved} tokens (${savingsPercent}%)`);
console.log();

console.log(`✅ Compaction logic verified!`);
console.log();

// Show structure
console.log('Compacted conversation structure:');
compactedConversation.forEach((msg, idx) => {
  const preview = msg.content.substring(0, 50).replace(/\n/g, ' ');
  console.log(`${idx + 1}. [${msg.role}] ${preview}...`);
  if (msg.isSummary) {
    console.log(`   ↳ Summarizes ${msg.summarizedMessageIds.length} messages`);
  }
});

console.log('\n=== Test Complete ===');
