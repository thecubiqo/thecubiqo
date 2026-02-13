import Anthropic from '@anthropic-ai/sdk';
import { ModelConfig } from '@/types/agent';
import { ToolDefinition } from '@/types/tool';

interface LLMRequest {
  model: ModelConfig;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  content: string;
  toolCalls?: Array<{ id: string; name: string; arguments: any }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const { model, messages, tools, maxTokens = 4096, temperature = 0.7 } = request;

  switch (model.provider) {
    case 'anthropic':
    case 'emergent':
      return await callAnthropic(model, messages, tools, maxTokens, temperature);
    case 'openai':
      return await callOpenAI(model, messages, tools, maxTokens, temperature);
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}

async function callAnthropic(
  model: ModelConfig,
  messages: Array<{ role: string; content: string }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  const apiKey = model.apiKey || process.env.ANTHROPIC_API_KEY || process.env.EMERGENT_API_KEY;
  const baseURL = model.baseUrl || process.env.EMERGENT_BASE_URL;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const client = new Anthropic({
    apiKey,
    baseURL,
  });

  // Separate system messages
  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  const systemPrompt = systemMessages.map((m) => m.content).join('\n\n');

  const response = await client.messages.create({
    model: model.model,
    system: systemPrompt,
    messages: conversationMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    tools: tools as any,
    max_tokens: maxTokens || 4096,
    temperature,
  });

  // Parse tool calls
  const toolCalls: Array<{ id: string; name: string; arguments: any }> = [];
  
  for (const block of response.content) {
    if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: block.input,
      });
    }
  }

  const textContent = response.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('\n');

  return {
    content: textContent,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

async function callOpenAI(
  model: ModelConfig,
  messages: Array<{ role: string; content: string }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  // TODO: Implement OpenAI client
  throw new Error('OpenAI provider not yet implemented');
}
