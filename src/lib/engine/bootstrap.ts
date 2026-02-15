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
      tools: ['file_read', 'file_list', 'sessions_spawn', 'sessions_send', 'web_search', 'web_fetch'],
      maxConcurrent: 4,
    });

    // Create Dev
    await createAgent({
      id: 'dev',
      name: 'Dev',
      model: defaultModel,
      tools: ['exec', 'file_read', 'file_write', 'file_list', 'sessions_spawn', 'git', 'web_fetch'],
      maxConcurrent: 2,
    });

    // Create Writer
    await createAgent({
      id: 'writer',
      name: 'Writer',
      model: defaultModel,
      tools: ['file_read', 'file_write', 'file_list', 'web_fetch', 'git'],
      maxConcurrent: 2,
    });

    // Create Tester
    await createAgent({
      id: 'tester',
      name: 'Tester',
      model: defaultModel,
      tools: ['exec', 'file_read', 'file_write', 'file_list', 'web_fetch'],
      maxConcurrent: 2,
    });

    // Create Marketing
    await createAgent({
      id: 'marketing',
      name: 'Marketing',
      model: defaultModel,
      tools: ['file_read', 'file_write', 'file_list', 'web_search', 'web_fetch', 'git'],
      maxConcurrent: 2,
    });

    // Create PR-Triage (dry-run)
    await createAgent({
      id: 'pr-triage',
      name: 'PR-Triage',
      model: defaultModel,
      tools: ['exec', 'file_read', 'file_list'],
      maxConcurrent: 1,
    });

    console.log('✅ Agents bootstrapped: henry, dev, writer, tester, marketing, pr-triage');
  } catch (error) {
    console.error('Failed to bootstrap agents:', error);
  }
}
