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
    // 1. A1 (Henry): Project Lead, Architect, PO
    await createAgent({
      id: 'a1',
      name: 'A1 (Henry)',
      model: defaultModel,
      tools: ['file_read', 'file_list', 'sessions_spawn', 'sessions_send', 'agent_message', 'web_search', 'web_fetch', 'telegram_send', 'vision_analyze', 'slack_send', 'discord_send', 'email_send'],
      maxConcurrent: 5,
    });

    // 2. A2 (Dev): Technical Architect, Updates, Bug Fixes
    await createAgent({
      id: 'a2',
      name: 'A2 (Dev)',
      model: defaultModel,
      tools: ['exec', 'file_read', 'file_write', 'file_patch', 'file_list', 'sessions_spawn', 'sessions_send', 'agent_message', 'git', 'web_fetch'],
      maxConcurrent: 3,
    });

    // 3. A3 (Writer): Content, Documentation, Patent Specialist
    await createAgent({
      id: 'a3',
      name: 'A3 (Writer)',
      model: defaultModel,
      tools: ['file_read', 'file_write', 'file_list', 'sessions_send', 'agent_message', 'web_fetch', 'git', 'web_search'],
      maxConcurrent: 3,
    });

    // 4. A4 (Tester): QA, Bug Verification
    await createAgent({
      id: 'a4',
      name: 'A4 (Tester)',
      model: defaultModel,
      tools: ['exec', 'file_read', 'file_write', 'file_list', 'sessions_send', 'agent_message', 'web_fetch'],
      maxConcurrent: 2,
    });

    // 5. A5 (Marketing): Social Media, Growth
    await createAgent({
      id: 'a5',
      name: 'A5 (Marketing)',
      model: defaultModel,
      tools: ['file_read', 'file_write', 'file_list', 'sessions_send', 'agent_message', 'web_search', 'web_fetch', 'vision_analyze', 'slack_send', 'discord_send', 'telegram_send', 'email_send'],
      maxConcurrent: 3,
    });

    // 6. A6 (Animator): Animations, Visual Interactions
    await createAgent({
      id: 'a6',
      name: 'A6 (Animator)',
      model: defaultModel,
      tools: ['file_read', 'file_write', 'file_list', 'sessions_send', 'agent_message', 'vision_analyze'],
      maxConcurrent: 2,
    });

    // 7. A7 (Business): Outreach, Customer Service
    await createAgent({
      id: 'a7',
      name: 'A7 (Business)',
      model: defaultModel,
      tools: ['file_read', 'file_write', 'file_list', 'sessions_send', 'agent_message', 'web_search', 'web_fetch', 'telegram_send', 'slack_send', 'discord_send', 'email_send'],
      maxConcurrent: 3,
    });

    console.log('✅ Agents bootstrapped: A1, A2, A3, A4, A5, A6, A7');
  } catch (error) {
    console.error('Failed to bootstrap agents:', error);
  }
}
