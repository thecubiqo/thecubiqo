import { Agent, AgentConfig, Task, ModelConfig } from '@/types/agent';
import { Session, Message } from '@/types/session';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { SessionStore } from './session';
import { ToolRegistry } from './tools';
import { callLLM } from '../ai/llm-router';
import { WorkspaceManager } from './workspace';

export class AgentInstance implements Agent {
  id: string;
  name: string;
  model: ModelConfig;
  soul: string = '';
  workspace: string;
  tools: string[];
  maxConcurrent: number;
  status: 'idle' | 'running' | 'error' = 'idle';
  currentTasks: Task[] = [];
  createdAt: Date;
  updatedAt: Date;

  private sessionStore: SessionStore;
  private toolRegistry: ToolRegistry;
  workspaceManager: WorkspaceManager;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.model = config.model;
    this.tools = config.tools || [];
    this.maxConcurrent = config.maxConcurrent || 2;
    // Use /tmp for workspace in production environment (Vercel)
    const os = require('os');
    const baseDir = process.env.NODE_ENV === 'production' ? os.tmpdir() : process.cwd();
    this.workspace = join(baseDir, 'data', 'workspaces', this.id);
    this.createdAt = new Date();
    this.updatedAt = new Date();

    this.sessionStore = new SessionStore(this.id);
    this.toolRegistry = new ToolRegistry();
    this.workspaceManager = new WorkspaceManager(this.workspace);
  }

  async initialize(): Promise<void> {
    // Load SOUL.md if exists
    try {
      const soulPath = join(process.cwd(), 'agents', this.id, 'SOUL.md');
      this.soul = await readFile(soulPath, 'utf-8');
    } catch {
      this.soul = `You are ${this.name}, an AI agent.`;
    }

    // Ensure workspace exists
    const { mkdir } = await import('fs/promises');
    await mkdir(this.workspace, { recursive: true });
  }

  async run(prompt: string, sessionId?: string, userId?: string): Promise<string> {
    this.status = 'running';
    this.updatedAt = new Date();

    try {
      // Get or create session
      const session = sessionId
        ? await this.sessionStore.get(sessionId)
        : await this.sessionStore.create(this.id);

      // Check if session needs compaction (before adding new message)
      if (await this.sessionStore.needsCompaction(session.id, this.model.model)) {
        console.log(`[Agent] Auto-compacting session ${session.id}`);
        try {
          const result = await this.sessionStore.compactSession(session.id, this.model);
          console.log(`[Agent] Compaction saved ~${result.tokensSaved} tokens`);
        } catch (error) {
          console.error(`[Agent] Compaction failed, continuing anyway:`, error);
        }
      }

      // Get conversation history
      const history = await this.sessionStore.getHistory(session.id);

      // Build context
      const systemPrompt = await this.buildSystemPrompt();
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user' as const, content: prompt },
      ];

      // Get tools for LLM (filtered by user integrations)
      const availableTools = await this.toolRegistry.getTools(this.tools, userId);

      // Call LLM
      const response = await callLLM({
        model: this.model,
        messages,
        tools: availableTools,
        maxTokens: this.model.maxTokens,
        temperature: this.model.temperature,
      });

      // Save messages
      await this.sessionStore.addMessage(session.id, {
        role: 'user',
        content: prompt,
      });

      await this.sessionStore.addMessage(session.id, {
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
      });

      // Handle tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolResults = await this.executeTools(response.toolCalls, session.id);

        // If tools were executed, make another LLM call with results
        if (toolResults.length > 0) {
          return await this.run(
            `Tool results: ${JSON.stringify(toolResults)}`,
            session.id
          );
        }
      }

      this.status = 'idle';
      return response.content;
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  async spawn(task: string, label?: string): Promise<{ runId: string; sessionId: string }> {
    const taskId = randomUUID();
    const session = await this.sessionStore.create(this.id);

    const taskObj: Task = {
      id: taskId,
      description: task,
      assignedTo: this.id,
      status: 'queued',
      tokenUsage: { input: 0, output: 0, cost: 0 },
    };

    this.currentTasks.push(taskObj);

    // Create isolated workspace for this task
    const wsInfo = await this.workspaceManager.createTaskWorkspace(taskId);

    // Execute task asynchronously with isolated workspace
    setImmediate(async () => {
      // Temporarily swap workspace to the isolated task directory
      const originalWorkspace = this.workspace;
      this.workspace = wsInfo.taskDir;
      try {
        taskObj.status = 'running';
        taskObj.startedAt = new Date();

        const result = await this.run(task, session.id);

        taskObj.status = 'done';
        taskObj.result = result;
        taskObj.completedAt = new Date();
      } catch (error) {
        taskObj.status = 'failed';
        taskObj.result = error instanceof Error ? error.message : 'Unknown error';
        taskObj.completedAt = new Date();
      } finally {
        // Restore original workspace
        this.workspace = originalWorkspace;
        // Clean up task workspace
        await this.workspaceManager.cleanupTaskWorkspace(taskId);
      }
    });

    return { runId: taskId, sessionId: session.id };
  }

  async stop(): Promise<void> {
    this.status = 'idle';
    this.currentTasks = this.currentTasks.filter((task) => task.status !== 'running');
  }

  async getHistory(sessionId: string): Promise<Message[]> {
    return await this.sessionStore.getHistory(sessionId);
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.sessionStore.delete(sessionId);
  }

  async listSessions(): Promise<Session[]> {
    return await this.sessionStore.list();
  }

  private async buildSystemPrompt(): Promise<string> {
    let prompt = this.soul + '\n\n';

    prompt += '# Available Tools\n';
    const tools = await this.toolRegistry.getTools(this.tools);
    tools.forEach((tool) => {
      prompt += `- ${tool.name}: ${tool.description}\n`;
    });

    prompt += '\n# Workspace\n';
    prompt += `Your workspace is at: ${this.workspace}\n`;
    prompt += 'All file operations are relative to this directory.\n';

    return prompt;
  }

  private async executeTools(toolCalls: any[], sessionId: string): Promise<any[]> {
    const results = [];

    for (const call of toolCalls) {
      try {
        const result = await this.toolRegistry.execute(call.name, call.arguments, {
          agentId: this.id,
          sessionId,
          workspace: this.workspace,
        });

        results.push({
          toolCallId: call.id,
          output: result.output,
          error: result.error,
        });
      } catch (error) {
        results.push({
          toolCallId: call.id,
          output: '',
          error: error instanceof Error ? error.message : 'Tool execution failed',
        });
      }
    }

    return results;
  }
}

// Agent registry
const agents = new Map<string, AgentInstance>();

export async function createAgent(config: AgentConfig): Promise<AgentInstance> {
  const agent = new AgentInstance(config);
  await agent.initialize();
  agents.set(agent.id, agent);
  return agent;
}

export function getAgent(id: string): AgentInstance | undefined {
  return agents.get(id);
}

export function listAgents(): AgentInstance[] {
  return Array.from(agents.values());
}

export async function deleteAgent(id: string): Promise<boolean> {
  const agent = agents.get(id);
  if (!agent) return false;

  await agent.stop();
  agents.delete(id);
  return true;
}
