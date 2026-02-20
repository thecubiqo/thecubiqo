/**
 * WorkspaceManager - Provides per-task workspace isolation for agents
 *
 * Each agent has a root workspace at `data/workspaces/{agentId}`.
 * When a task is spawned, it gets an isolated sub-workspace at
 * `data/workspaces/{agentId}/tasks/{taskId}/` so that parallel
 * tasks cannot interfere with each other's files.
 */

import { join, resolve, relative } from 'path';
import { mkdir, rm } from 'fs/promises';

export interface WorkspaceInfo {
  /** Root workspace for the agent */
  agentRoot: string;
  /** Isolated task workspace (if a task is active) */
  taskDir: string;
  /** The taskId that owns this workspace (empty string for agent root) */
  taskId: string;
}

export class WorkspaceManager {
  private agentRoot: string;

  constructor(agentRoot: string) {
    this.agentRoot = agentRoot;
  }

  /** Return the agent-level root workspace path */
  getAgentRoot(): string {
    return this.agentRoot;
  }

  /** Create and return an isolated workspace for a specific task */
  async createTaskWorkspace(taskId: string): Promise<WorkspaceInfo> {
    const taskDir = join(this.agentRoot, 'tasks', taskId);
    await mkdir(taskDir, { recursive: true });
    return { agentRoot: this.agentRoot, taskDir, taskId };
  }

  /** Clean up a task workspace after it completes */
  async cleanupTaskWorkspace(taskId: string): Promise<void> {
    const taskDir = join(this.agentRoot, 'tasks', taskId);
    try {
      await rm(taskDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`[WorkspaceManager] Failed to cleanup task workspace ${taskId}:`, error);
    }
  }

  /**
   * Validate that a resolved file path stays within the given workspace boundary.
   * Returns true if the path is safe, false if it escapes.
   */
  static validatePath(filePath: string, workspaceBoundary: string): boolean {
    const resolved = resolve(workspaceBoundary, filePath);
    const rel = relative(workspaceBoundary, resolved);
    // If the relative path starts with ".." it's escaping the boundary
    return !rel.startsWith('..');
  }
}
