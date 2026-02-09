import { Tool, ToolContext, ToolResult, ToolDefinition } from '@/types/tool';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, unlink, readdir } from 'fs/promises';
import { join } from 'path';
import { webSearchTool, webFetchTool } from './web-tools';
import { sessionsSendTool } from './tools/sessions-send';

const execAsync = promisify(exec);

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerBuiltinTools();
  }

  private registerBuiltinTools() {
    // Core tools
    this.register(execTool);
    this.register(fileReadTool);
    this.register(fileWriteTool);
    this.register(fileListTool);
    this.register(sessionsSpawnTool);
    this.register(sessionsSendTool); // Import from tools/sessions-send.ts
    this.register(gitTool);
    this.register(webSearchTool);
    this.register(webFetchTool);
  }

  register(tool: Tool) {
    this.tools.set(tool.id, tool);
  }

  async getTools(toolIds?: string[], userId?: string): Promise<ToolDefinition[]> {
    const tools = toolIds
      ? toolIds.map((id) => this.tools.get(id)).filter(Boolean) as Tool[]
      : Array.from(this.tools.values());

    // TODO: Tool filtering based on integrations (removed for now)
    // All tools available - can add filtering later

    return tools.map((tool) => ({
      name: tool.id,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }

  async execute(toolId: string, params: any, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return {
        success: false,
        output: '',
        error: `Tool not found: ${toolId}`,
      };
    }

    // Check if agent is allowed to use this tool
    if (tool.allowedAgents && !tool.allowedAgents.includes(context.agentId)) {
      return {
        success: false,
        output: '',
        error: `Agent ${context.agentId} not allowed to use tool ${toolId}`,
      };
    }

    return await tool.execute(params, context);
  }
}

// Built-in tools

const execTool: Tool = {
  id: 'exec',
  name: 'Execute Shell Command',
  description: 'Run a shell command in the agent workspace. Returns stdout and stderr.',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Shell command to execute' },
      timeout: { type: 'number', description: 'Timeout in milliseconds (default: 30000)' },
    },
    required: ['command'],
  },
  execute: async (params, context) => {
    try {
      const { command, timeout = 30000 } = params;
      const { stdout, stderr } = await execAsync(command, {
        cwd: context.workspace,
        timeout,
        maxBuffer: 1024 * 1024, // 1MB
      });

      return {
        success: true,
        output: JSON.stringify({ stdout, stderr }),
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.message,
      };
    }
  },
};

const fileReadTool: Tool = {
  id: 'file_read',
  name: 'Read File',
  description: 'Read a file from the workspace. Path is relative to workspace root.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path relative to workspace' },
      encoding: { type: 'string', description: 'File encoding (default: utf-8)' },
    },
    required: ['path'],
  },
  execute: async (params, context) => {
    try {
      const { path, encoding = 'utf-8' } = params;
      const fullPath = join(context.workspace, path);
      const content = await readFile(fullPath, encoding as BufferEncoding);

      return {
        success: true,
        output: content.toString(),
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  },
};

const fileWriteTool: Tool = {
  id: 'file_write',
  name: 'Write File',
  description: 'Write content to a file in the workspace. Creates parent directories if needed.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path relative to workspace' },
      content: { type: 'string', description: 'Content to write' },
    },
    required: ['path', 'content'],
  },
  execute: async (params, context) => {
    try {
      const { path, content } = params;
      const fullPath = join(context.workspace, path);
      
      // Ensure parent directory exists
      const { mkdir } = await import('fs/promises');
      const dir = join(fullPath, '..');
      await mkdir(dir, { recursive: true });

      await writeFile(fullPath, content, 'utf-8');

      return {
        success: true,
        output: `File written: ${path} (${content.length} bytes)`,
        artifacts: [fullPath],
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Failed to write file',
      };
    }
  },
};

const fileListTool: Tool = {
  id: 'file_list',
  name: 'List Files',
  description: 'List files and directories in the workspace.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path (default: workspace root)' },
    },
  },
  execute: async (params, context) => {
    try {
      const { path = '.' } = params;
      const fullPath = join(context.workspace, path);
      const entries = await readdir(fullPath, { withFileTypes: true });

      const files = entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
      }));

      return {
        success: true,
        output: JSON.stringify(files, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Failed to list files',
      };
    }
  },
};

const sessionsSpawnTool: Tool = {
  id: 'sessions_spawn',
  name: 'Spawn Subagent',
  description: 'Create a subagent to work on a task in parallel. Returns runId and sessionId.',
  parameters: {
    type: 'object',
    properties: {
      task: { type: 'string', description: 'Task description for the subagent' },
      agentId: { type: 'string', description: 'Target agent ID (default: self)' },
      label: { type: 'string', description: 'Optional label for the task' },
    },
    required: ['task'],
  },
  execute: async (params, context) => {
    try {
      const { task, agentId = context.agentId, label } = params;
      
      // Import agent dynamically to avoid circular dependency
      const { getAgent } = await import('./agent');
      const agent = getAgent(agentId);

      if (!agent) {
        return {
          success: false,
          output: '',
          error: `Agent not found: ${agentId}`,
        };
      }

      const { runId, sessionId } = await agent.spawn(task, label);

      return {
        success: true,
        output: JSON.stringify({ runId, sessionId, status: 'accepted' }),
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Failed to spawn subagent',
      };
    }
  },
};

// sessionsSendTool moved to tools/sessions-send.ts for better organization

const gitTool: Tool = {
  id: 'git',
  name: 'Git Operations',
  description: 'Perform git operations: status, add, commit, push, pull, log, diff, branch',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['status', 'add', 'commit', 'push', 'pull', 'log', 'diff', 'branch'],
        description: 'Git action to perform',
      },
      args: { type: 'string', description: 'Additional arguments' },
      message: { type: 'string', description: 'Commit message (for commit)' },
    },
    required: ['action'],
  },
  execute: async (params, context) => {
    try {
      const { action, args = '', message } = params;
      let command: string;
      
      switch (action) {
        case 'status': command = 'git status'; break;
        case 'add': command = `git add ${args || '.'}`;break;
        case 'commit':
          if (!message) return { success: false, output: '', error: 'Commit message required' };
          command = `git commit -m "${message.replace(/"/g, '\\"')}"`; break;
        case 'push': command = `git push ${args || 'origin production'}`; break;
        case 'pull': command = `git pull ${args || 'origin production'}`; break;
        case 'log': command = `git log ${args || '--oneline -10'}`; break;
        case 'diff': command = `git diff ${args || ''}`; break;
        case 'branch': command = `git branch ${args || '-a'}`; break;
        default: return { success: false, output: '', error: `Unknown git action: ${action}` };
      }

      const { stdout, stderr } = await execAsync(command, { cwd: context.workspace, timeout: 30000 });
      return { success: true, output: stdout || stderr };
    } catch (error: any) {
      return { success: false, output: error.stdout || '', error: error.message };
    }
  },
};

