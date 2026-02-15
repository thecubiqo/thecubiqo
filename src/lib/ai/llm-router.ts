import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

  console.log(`[LLM Router] Using provider: ${model.provider}, model: ${model.model}`);

  switch (model.provider) {
    case 'anthropic':
    case 'emergent':
      return await callAnthropic(model, messages, tools, maxTokens, temperature);
    case 'openai':
      return await callOpenAI(model, messages, tools, maxTokens, temperature);
    case 'groq':
      return await callGroq(model, messages, tools, maxTokens, temperature);
    case 'google':
      return await callGoogle(model, messages, tools, maxTokens, temperature);
    case 'openrouter':
      return await callOpenRouter(model, messages, tools, maxTokens, temperature);
    case 'mistral':
      return await callMistral(model, messages, tools, maxTokens, temperature);
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
  const apiKey = model.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const client = new OpenAI({
    apiKey,
    baseURL: model.baseUrl,
  });

  // Convert tools to OpenAI format
  const openaiTools = tools?.map((tool) => ({
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
      content: m.content,
    })),
    tools: openaiTools,
    max_tokens: maxTokens || 4096,
    temperature,
  });

  const message = response.choices[0]?.message;
  if (!message) {
    throw new Error('No response from OpenAI');
  }

  // Parse tool calls
  const toolCalls: Array<{ id: string; name: string; arguments: any }> = [];
  
  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.type === 'function') {
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
      }
    }
  }

  return {
    content: message.content || '',
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}

async function callGroq(
  model: ModelConfig,
  messages: Array<{ role: string; content: string }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  const apiKey = model.apiKey || process.env.GROQ_API_KEY;
  const baseURL = model.baseUrl || 'https://api.groq.com/openai/v1';

  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  // Groq uses OpenAI-compatible API
  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  // Convert tools to OpenAI format
  const openaiTools = tools?.map((tool) => ({
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
      content: m.content,
    })),
    tools: openaiTools,
    max_tokens: maxTokens || 4096,
    temperature,
  });

  const message = response.choices[0]?.message;
  if (!message) {
    throw new Error('No response from Groq');
  }

  // Parse tool calls
  const toolCalls: Array<{ id: string; name: string; arguments: any }> = [];
  
  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.type === 'function') {
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
      }
    }
  }

  return {
    content: message.content || '',
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}

async function callGoogle(
  model: ModelConfig,
  messages: Array<{ role: string; content: string }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  const apiKey = model.apiKey || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ 
    model: model.model,
  });

  // Convert tools to Google format
  // Note: Google SDK has strict types, but the runtime accepts this format
  // We use a type-safe approach by matching the expected structure
  const googleTools = tools ? {
    functionDeclarations: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: tool.input_schema.properties || {},
        required: tool.input_schema.required || [],
      },
    })),
  } : undefined;

  // Separate system messages
  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  // Convert messages to Google format
  const googleMessages = conversationMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const systemInstruction = systemMessages.map((m) => m.content).join('\n\n');

  const chat = geminiModel.startChat({
    history: googleMessages.slice(0, -1),
    generationConfig: {
      maxOutputTokens: maxTokens || 4096,
      temperature,
    },
    tools: googleTools ? [googleTools] : undefined,
    systemInstruction: systemInstruction || undefined,
  });

  const lastMessage = conversationMessages[conversationMessages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;

  // Parse tool calls
  const toolCalls: Array<{ id: string; name: string; arguments: any }> = [];
  
  const functionCalls = response.functionCalls();
  if (functionCalls) {
    for (const call of functionCalls) {
      toolCalls.push({
        id: call.name, // Google doesn't provide IDs, use name
        name: call.name,
        arguments: call.args,
      });
    }
  }

  return {
    content: response.text() || '',
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
    },
  };
}

async function callOpenRouter(
  model: ModelConfig,
  messages: Array<{ role: string; content: string }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  const apiKey = model.apiKey || process.env.OPENROUTER_API_KEY;
  const baseURL = model.baseUrl || 'https://openrouter.ai/api/v1';

  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // OpenRouter uses OpenAI-compatible API
  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  // Convert tools to OpenAI format
  const openaiTools = tools?.map((tool) => ({
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
      content: m.content,
    })),
    tools: openaiTools,
    max_tokens: maxTokens || 4096,
    temperature,
  });

  const message = response.choices[0]?.message;
  if (!message) {
    throw new Error('No response from OpenRouter');
  }

  // Parse tool calls
  const toolCalls: Array<{ id: string; name: string; arguments: any }> = [];
  
  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.type === 'function') {
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
      }
    }
  }

  return {
    content: message.content || '',
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}

async function callMistral(
  model: ModelConfig,
  messages: Array<{ role: string; content: string }>,
  tools?: ToolDefinition[],
  maxTokens?: number,
  temperature?: number
): Promise<LLMResponse> {
  const apiKey = model.apiKey || process.env.MISTRAL_API_KEY;
  const baseURL = model.baseUrl || 'https://api.mistral.ai/v1';

  if (!apiKey) {
    throw new Error('Mistral API key not configured');
  }

  // Mistral uses OpenAI-compatible API
  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  // Convert tools to OpenAI format
  const openaiTools = tools?.map((tool) => ({
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
      content: m.content,
    })),
    tools: openaiTools,
    max_tokens: maxTokens || 4096,
    temperature,
  });

  const message = response.choices[0]?.message;
  if (!message) {
    throw new Error('No response from Mistral');
  }

  // Parse tool calls
  const toolCalls: Array<{ id: string; name: string; arguments: any }> = [];
  
  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.type === 'function') {
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
      }
    }
  }

  return {
    content: message.content || '',
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}
