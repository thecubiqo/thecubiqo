/**
 * Engine-level task router
 * Routes tasks to the appropriate agent based on task description and keywords
 */

import { getAgent, listAgents, AgentInstance } from './agent';

/**
 * Task router that selects the best agent for a given task
 */
export class TaskRouter {
  /**
   * Route a task to the most appropriate agent based on keyword matching
   * @param task - The task description to analyze
   * @returns The best matching agent or null if no agents are available
   */
  route(task: string): AgentInstance | null {
    // Check if any agents are available
    const agents = listAgents();
    if (agents.length === 0) {
      return null;
    }

    // A2 (Dev) - Developer keywords
    if (/\b(code|dev|develop|build|fix|bug|deploy|implement|refactor|debug|program|engineer)\b/i.test(task)) {
      return getAgent('a2') ?? null;
    }

    // A3 (Writer) - Content keywords
    if (/\b(write|document|content|blog|copy|article|draft|edit|publish|readme)\b/i.test(task)) {
      return getAgent('a3') ?? null;
    }

    // A4 (Tester) - QA keywords
    if (/\b(test|qa|quality|verify|validation|regression|check|assert|coverage|suite)\b/i.test(task)) {
      return getAgent('a4') ?? null;
    }

    // A5 (Marketing) - Growth keywords
    if (/\b(market|marketing|social|post|campaign|growth|promote|seo|analytics|audience)\b/i.test(task)) {
      return getAgent('a5') ?? null;
    }

    // A6 (Animator) - Visual keywords
    if (/\b(animate|animation|visual|3d|design|motion|graphic|render|canvas|video)\b/i.test(task)) {
      return getAgent('a6') ?? null;
    }

    // A7 (Business) - Outreach keywords
    if (/\b(outreach|customer|sales|email|business|lead|prospect|crm|contact|client)\b/i.test(task)) {
      return getAgent('a7') ?? null;
    }

    // A1 (Henry) - Default/fallback for orchestration, coordination, or unmatched tasks
    return getAgent('a1') ?? null;
  }

  /**
   * Route directly to a specific agent by ID
   * @param agentId - The agent ID (e.g., 'A1', 'A2', etc.)
   * @returns The requested agent or null if not found
   */
  routeById(agentId: string): AgentInstance | null {
    return getAgent(agentId) ?? null;
  }
}

/**
 * Singleton task router instance
 */
export const taskRouter = new TaskRouter();
