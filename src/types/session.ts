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

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'summary';
  content: string;
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
