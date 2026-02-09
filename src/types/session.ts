export interface Session {
  id: string;
  agentId: string;
  sessionKey: string;
  channel: string;
  status: 'idle' | 'active' | 'completed' | 'error';
  messageCount: number;
  tokenUsage: {
    input: number;
    output: number;
  };
  estimatedCost: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  lastCompactedAt?: Date;
  totalTokens?: number;
}

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } };

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'summary';
  content: string | ContentBlock[];
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  tokenCount?: number;
  model?: string;
  createdAt: Date;
  isSummary?: boolean;
  summarizedMessageIds?: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}

export interface ToolResult {
  toolCallId: string;
  output: string;
  error?: string;
}

export interface SessionCreate {
  agentId: string;
  channel?: string;
  userId?: string;
}
