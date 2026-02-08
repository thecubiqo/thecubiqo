import { createAgent } from './src/lib/engine/agent.ts';

async function test() {
  console.log('Testing agent spawn...');
  
  const henry = await createAgent({
    id: 'henry-test',
    name: 'Henry',
    model: {
      provider: 'emergent',
      model: 'claude-sonnet-4-5',
      apiKey: process.env.EMERGENT_API_KEY,
      baseUrl: process.env.EMERGENT_BASE_URL,
      maxTokens: 4096,
      temperature: 0.7,
    },
    tools: ['file_read', 'file_write', 'sessions_spawn'],
    maxConcurrent: 2,
  });

  console.log('Henry created:', henry.id);
  
  const result = await henry.spawn('Create a test file named test-output.txt with "Hello from spawned task!"');
  console.log('Task spawned:', result);
}

test().catch(console.error);
