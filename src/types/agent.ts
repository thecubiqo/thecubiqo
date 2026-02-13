export interface Agent {
  id: string;
  name: string;
  model: ModelConfig;
  soul: string;
  workspace: string;
  tools: string[];
  maxConcurrent: number;
  status: 'idle' | 'running' | 'error';
  currentTasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'meta' | 'mistral' | 'google' | 'emergent';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
}

export interface Task {
  id: string;
  description: string;
  assignedTo: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  result?: string;
  startedAt?: Date;
  completedAt?: Date;
  tokenUsage: {
    input: number;
    output: number;
    cost: number;
  };
}

export interface AgentConfig {
  id: string;
  name: string;
  model: ModelConfig;
  soulPath?: string;
  tools?: string[];
  maxConcurrent?: number;
}
