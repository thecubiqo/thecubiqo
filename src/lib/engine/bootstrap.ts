import { createAgent } from './agent';
import { ModelConfig } from '@/types/agent';

function getDefaultModel(): ModelConfig {
  // Try providers in priority order based on which keys are available
  console.log('[Bootstrap] Detecting available LLM provider...');
  
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('[Bootstrap] Using Anthropic Claude');
    return {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 4096,
      temperature: 0.7,
    };
  }
  
  if (process.env.OPENAI_API_KEY) {
    console.log('[Bootstrap] Using OpenAI GPT-4o');
    return {
      provider: 'openai',
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY,
      maxTokens: 4096,
      temperature: 0.7,
    };
  }
  
  if (process.env.GROQ_API_KEY) {
    console.log('[Bootstrap] Using Groq Llama');
    return {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: 'https://api.groq.com/openai/v1',
      maxTokens: 4096,
      temperature: 0.7,
    };
  }
  
  if (process.env.OPENROUTER_API_KEY) {
    console.log('[Bootstrap] Using OpenRouter');
    return {
      provider: 'openrouter',
      model: 'anthropic/claude-sonnet-4',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
      maxTokens: 4096,
      temperature: 0.7,
    };
  }
  
  if (process.env.GOOGLE_AI_API_KEY) {
    console.log('[Bootstrap] Using Google Gemini');
    return {
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
      apiKey: process.env.GOOGLE_AI_API_KEY,
      maxTokens: 4096,
      temperature: 0.7,
    };
  }
  
  if (process.env.EMERGENT_API_KEY) {
    console.log('[Bootstrap] Using Emergent proxy');
    return {
      provider: 'emergent',
      model: 'claude-sonnet-4-5',
      apiKey: process.env.EMERGENT_API_KEY,
      baseUrl: process.env.EMERGENT_BASE_URL,
      maxTokens: 4096,
      temperature: 0.7,
    };
  }
  
  // Fallback — will error at runtime if no key
  console.warn('[Bootstrap] No LLM API key found! Using Anthropic as fallback (will fail without key)');
  return {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.7,
  };
}

export async function bootstrapAgents() {
  try {
    const defaultModel = getDefaultModel();
    
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

    console.log('✅ Agents bootstrapped: henry, dev, writer, tester, marketing');
  } catch (error) {
    console.error('Failed to bootstrap agents:', error);
  }
}
