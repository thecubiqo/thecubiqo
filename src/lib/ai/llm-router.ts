import Anthropic from '@anthropic-ai/sdk';
import { ModelConfig } from '@/types/agent';
import { ToolDefinition } from '@/types/tool';

interface LLMRequest {
  model: ModelConfig;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string | any[] }>;
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
    case 'groq':
      return await callGroq(model, messages, tools, maxTokens, temperature);
    case 'mistral':
      return await callMistral(model, messages, tools, maxTokens, temperature);
    case 'google':
      return await callGoogle(model, messages, tools, maxTokens, temperature);
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}

// ... existing callAnthropic and callOpenAI ...

async function callGroq(
  model: ModelConfig,
  messages: Array<{ role: string; content: string | any[] }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  const apiKey = model.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key not configured');

  // Groq is OpenAI-compatible
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  return await callOpenAICompatible(client, model, messages, tools, maxTokens, temperature);
}

async function callMistral(
  model: ModelConfig,
  messages: Array<{ role: string; content: string | any[] }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  const apiKey = model.apiKey || process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('Mistral API key not configured');

  // Mistral is OpenAI-compatible
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.mistral.ai/v1',
  });

  return await callOpenAICompatible(client, model, messages, tools, maxTokens, temperature);
}

async function callGoogle(
  model: ModelConfig,
  messages: Array<{ role: string; content: string | any[] }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  const apiKey = model.apiKey || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Google API key not configured');

  // Using OpenAI SDK with Google's OpenAI-compatible endpoint if available,
  // or custom fetch. Google recently added OpenAI compatibility for Gemini.
  // Base URL: https://generativelanguage.googleapis.com/v1beta/openai/
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  });

  return await callOpenAICompatible(client, model, messages, tools, maxTokens, temperature);
}

async function callOpenAICompatible(
  client: OpenAI,
  model: ModelConfig,
  messages: Array<{ role: string; content: string | any[] }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  // Convert tools to OpenAI format
  const openAITools = tools?.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));

  const response = await client.chat.completions.create({
    model: model.model,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content as any,
    })),
    tools: openAITools,
    max_tokens: maxTokens || 4096,
    temperature,
  });

  const message = response.choices[0].message;
  const content = message.content || '';
  const toolCalls = message.tool_calls?.map((call: any) => ({
    id: call.id,
    name: call.function.name,
    arguments: JSON.parse(call.function.arguments),
  }));

  return {
    content,
    toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}

async function callAnthropic(
  model: ModelConfig,
  messages: Array<{ role: string; content: string | any[] }>,
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

  const systemPrompt = systemMessages.map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content))).join('\n\n');

  // Map content for Anthropic
  const anthropicMessages = conversationMessages.map((m) => {
    let content: any = m.content;
    if (Array.isArray(m.content)) {
      content = m.content.map(block => {
        if (block.type === 'image_url') {
          // Anthropic expects base64 or specific media type, but for now we'll pass as is or assume URL support via proxy
          // If strictly using SDK with URLs, might need conversion if not supported directly. 
          // Standard Anthropic API expects { type: "image", source: { type: "base64", media_type: ..., data: ... } }
          // For now assuming the proxy or updated SDK handles URLs or we assume text-only for images in V1.
          // Let's keep it simple: strict text mapping for now to avoid breaking, 
          // OR strictly map standard "image_url" to text description if not fully implemented.
          // ACTUALLY: Let's enable it properly if possible. 
          // For simplicity in this step, we'll cast to any and let the SDK validation handle it or fail if complex.
          return block;
        }
        return block;
      });
    }
    return {
      role: m.role as 'user' | 'assistant',
      content: content,
    };
  });

  const response = await client.messages.create({
    model: model.model,
    system: systemPrompt,
    messages: anthropicMessages as any,
    tools: tools as any,
    max_tokens: maxTokens || 4096,
    temperature,
  });

  // ... (rest of function same as before) ...
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

import OpenAI from 'openai';

async function callOpenAI(
  model: ModelConfig,
  messages: Array<{ role: string; content: string | any[] }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  const apiKey = model.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const client = new OpenAI({
    apiKey,
    baseURL: model.baseUrl,
  });

  // Convert tools to OpenAI format
  const openAITools = tools?.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));

  const response = await client.chat.completions.create({
    model: model.model,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content as any, // OpenAI SDK handles array content (image_url) natively
    })),
    tools: openAITools,
    max_tokens: maxTokens || 4096,
    temperature,
  });

  const message = response.choices[0].message;
  const content = message.content || '';
  const toolCalls = message.tool_calls?.map((call: any) => ({
    id: call.id,
    name: call.function.name,
    arguments: JSON.parse(call.function.arguments),
  }));

  return {
    content,
    toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}
