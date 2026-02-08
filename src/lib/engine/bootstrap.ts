import { createAgent } from './agent';
import { ModelConfig } from '@/types/agent';

const defaultModel: ModelConfig = {
  provider: 'emergent',
  model: 'claude-sonnet-4-5',
  apiKey: process.env.EMERGENT_API_KEY,
  baseUrl: process.env.EMERGENT_BASE_URL,
  maxTokens: 4096,
  temperature: 0.7,
};

export async function bootstrapAgents() {
  try {
    // Create Henry (coordinator)
    await createAgent({
      id: 'henry',
      name: 'Henry',
      model: defaultModel,
      tools: ['file_read', 'file_list', 'sessions_spawn', 'sessions_send'],
      maxConcurrent: 4,
    });

    // Create Dev
    await createAgent({
      id: 'dev',
      name: 'Dev',
      model: defaultModel,
      tools: ['exec', 'file_read', 'file_write', 'file_list', 'sessions_spawn'],
      maxConcurrent: 2,
    });

    console.log('✅ Agents bootstrapped: henry, dev');
  } catch (error) {
    console.error('Failed to bootstrap agents:', error);
  }
}
