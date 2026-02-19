/**
 * Token counting utilities for session management
 * Uses rough estimation: ~4 characters per token (Claude/GPT average)
 */

export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This is conservative and works well for Claude/GPT models
  return Math.ceil(text.length / 4);
}

export function countMessageTokens(message: {
  role: string;
  content: string | any[];
  toolCalls?: any[];
  toolResults?: any[];
}): number {
  let tokens = 0;

  // Base message overhead (role, formatting)
  tokens += 4;

  // Content tokens
  if (typeof message.content === 'string') {
    tokens += estimateTokenCount(message.content);
  } else if (Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.type === 'text') {
        tokens += estimateTokenCount(block.text || '');
      } else if (block.type === 'image_url') {
        tokens += 1000; // Rough estimate for image
      }
    }
  }

  // Tool calls
  if (message.toolCalls && message.toolCalls.length > 0) {
    tokens += estimateTokenCount(JSON.stringify(message.toolCalls));
  }

  // Tool results
  if (message.toolResults && message.toolResults.length > 0) {
    tokens += estimateTokenCount(JSON.stringify(message.toolResults));
  }

  return tokens;
}

export function countConversationTokens(
  messages: Array<{
    role: string;
    content: string | any[];
    toolCalls?: any[];
    toolResults?: any[];
  }>
): number {
  return messages.reduce((total, msg) => total + countMessageTokens(msg), 0);
}

export const DEFAULT_TOKEN_LIMITS = {
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-5-haiku-20241022': 200000,
  'claude-3-opus-20240229': 200000,
  'gpt-4-turbo': 128000,
  'gpt-4': 8192,
  'gpt-3.5-turbo': 16385,
} as const;

export function getTokenLimit(modelName: string): number {
  return DEFAULT_TOKEN_LIMITS[modelName as keyof typeof DEFAULT_TOKEN_LIMITS] || 100000;
}

export function shouldCompact(
  currentTokens: number,
  modelName: string,
  threshold: number = 0.75
): boolean {
  const limit = getTokenLimit(modelName);
  return currentTokens >= limit * threshold;
}
