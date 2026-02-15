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
  skillTags?: string[];
  contactEmail?: string;
  contactPhone?: string;
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
  skillTags?: string[];
  contactEmail?: string;
  contactPhone?: string;
}

export interface AgentReport {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  reportType: 'activity' | 'task_completion' | 'error' | 'status';
  data: Record<string, any>;
  message?: string;
}
