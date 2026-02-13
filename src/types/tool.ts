export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: JSONSchema;
  execute: (params: any, context: ToolContext) => Promise<ToolResult>;
  requiresApproval?: boolean;
  allowedAgents?: string[];
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface ToolContext {
  agentId: string;
  sessionId: string;
  workspace: string;
  userId?: string;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  artifacts?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: JSONSchema;
}
