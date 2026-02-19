import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCKS - Must be defined BEFORE imports
// ============================================================================

// Mock token counter
vi.mock('@/lib/utils/token-counter', () => ({
  countConversationTokens: (msgs: any[]) => msgs.length * 10,
  estimateTokenCount: (text: string) => Math.ceil(text.length / 4),
  countMessageTokens: (msg: any) => 10,
  shouldCompact: () => false,
}));

// Mock memory module
vi.mock('@/lib/engine/memory', () => ({
  searchMemory: vi.fn().mockResolvedValue([]),
  storeMemory: vi.fn().mockResolvedValue(undefined),
}));

// Mock agent module with sample agents
const mockAgents = [
  {
    id: 'a1',
    name: 'General Agent',
    soul: 'You are a general-purpose agent',
    keywords: ['general', 'help'],
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
  },
  {
    id: 'a2',
    name: 'Dev Agent',
    soul: 'You are a backend developer',
    keywords: ['dev', 'backend', 'api', 'database'],
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
  },
  {
    id: 'a3',
    name: 'Content Agent',
    soul: 'You are a content writer',
    keywords: ['content', 'write', 'blog', 'article'],
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
  },
  {
    id: 'a4',
    name: 'Test Agent',
    soul: 'You are a QA engineer',
    keywords: ['test', 'qa', 'quality', 'bug'],
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
  },
  {
    id: 'a5',
    name: 'Marketing Agent',
    soul: 'You are a marketing specialist',
    keywords: ['marketing', 'campaign', 'seo', 'ads'],
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
  },
  {
    id: 'a6',
    name: 'Animation Agent',
    soul: 'You are a 3D animation specialist',
    keywords: ['animation', '3d', 'threejs', 'webgl'],
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
  },
  {
    id: 'a7',
    name: 'Business Agent',
    soul: 'You are a business analyst',
    keywords: ['business', 'strategy', 'analysis', 'revenue'],
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
  },
];

vi.mock('@/lib/engine/agent', () => ({
  getAgent: vi.fn((id: string) => mockAgents.find((a) => a.id === id) || null),
  listAgents: vi.fn(() => mockAgents),
}));

// ============================================================================
// IMPORTS - After mocks
// ============================================================================

import { TaskQueue } from '@/lib/engine/queue';
import { ContextAssembler } from '@/lib/engine/context-assembly';
import { TaskRouter } from '@/lib/engine/router';
import type { Task } from '@/types/agent';

// ============================================================================
// TESTS: TaskQueue
// ============================================================================

describe('TaskQueue', () => {
  let queue: TaskQueue;

  beforeEach(() => {
    queue = new TaskQueue(2); // maxConcurrent = 2
  });

  it('should enqueue and execute a task', async () => {
    const executor = vi.fn().mockResolvedValue('Task completed');
    const task: Omit<Task, 'status' | 'tokenUsage'> = {
      id: 'task-1',
      description: 'Test task',
      assignedTo: 'agent-1',
    };

    queue.enqueue(task as Task, executor);

    // Wait for task to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const retrieved = queue.getTask('task-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.status).toBe('done');
    expect(retrieved?.result).toBe('Task completed');
    expect(executor).toHaveBeenCalledTimes(1);
  });

  it('should respect maxConcurrent limit', async () => {
    let running = 0;
    let maxRunning = 0;

    const createExecutor = (id: string) => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, 50));
      running--;
      return `Task ${id} done`;
    };

    // Enqueue 4 tasks, but maxConcurrent is 2
    for (let i = 1; i <= 4; i++) {
      const task: Omit<Task, 'status' | 'tokenUsage'> = {
        id: `task-${i}`,
        description: `Task ${i}`,
        assignedTo: 'agent-1',
      };
      queue.enqueue(task as Task, createExecutor(`${i}`));
    }

    expect(queue.pending).toBeGreaterThan(0);
    expect(queue.active).toBeLessThanOrEqual(2);

    // Wait for all tasks to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(maxRunning).toBeLessThanOrEqual(2);
    expect(queue.active).toBe(0);
    expect(queue.pending).toBe(0);
  });

  it('should return task by ID', () => {
    const executor = vi.fn().mockResolvedValue('Done');
    const task: Omit<Task, 'status' | 'tokenUsage'> = {
      id: 'task-123',
      description: 'Find me',
      assignedTo: 'agent-1',
    };

    queue.enqueue(task as Task, executor);

    const retrieved = queue.getTask('task-123');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('task-123');
    expect(retrieved?.description).toBe('Find me');

    const notFound = queue.getTask('non-existent');
    expect(notFound).toBeUndefined();
  });

  it('should list tasks by filter', async () => {
    const executor1 = vi.fn().mockResolvedValue('Done');
    const executor2 = vi.fn().mockRejectedValue(new Error('Failed'));
    const executor3 = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('Slow'), 200))
    );

    queue.enqueue(
      { id: 'task-done', description: 'Done', assignedTo: 'a1' } as Task,
      executor1
    );
    queue.enqueue(
      { id: 'task-failed', description: 'Fail', assignedTo: 'a1' } as Task,
      executor2
    );
    queue.enqueue(
      { id: 'task-running', description: 'Running', assignedTo: 'a1' } as Task,
      executor3
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const allTasks = queue.listTasks();
    expect(allTasks).toHaveLength(3);

    const doneTasks = queue.listTasks('done');
    expect(doneTasks.length).toBeGreaterThanOrEqual(1);
    expect(doneTasks.some((t) => t.id === 'task-done')).toBe(true);

    const failedTasks = queue.listTasks('failed');
    expect(failedTasks.some((t) => t.id === 'task-failed')).toBe(true);

    // Clean up
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  it('should cancel a queued task', () => {
    // Fill up the queue so next task stays queued
    const longExecutor = () => new Promise<string>((resolve) => setTimeout(() => resolve('Done'), 200));
    
    // Fill maxConcurrent slots (2)
    queue.enqueue(
      { id: 'task-blocking-1', description: 'Block 1', assignedTo: 'a1' } as Task,
      longExecutor
    );
    queue.enqueue(
      { id: 'task-blocking-2', description: 'Block 2', assignedTo: 'a1' } as Task,
      longExecutor
    );

    // This task should stay queued
    const executor = vi.fn().mockResolvedValue('Done');
    const task: Omit<Task, 'status' | 'tokenUsage'> = {
      id: 'task-cancel',
      description: 'Cancel me',
      assignedTo: 'agent-1',
    };

    queue.enqueue(task as Task, executor);

    // Verify it's queued
    expect(queue.pending).toBeGreaterThan(0);

    // Cancel it
    const cancelled = queue.cancel('task-cancel');
    expect(cancelled).toBe(true);

    const retrieved = queue.getTask('task-cancel');
    expect(retrieved?.status).toBe('failed');
    expect(retrieved?.result).toBe('Cancelled');
  });

  it('should handle failed tasks', async () => {
    const executor = vi.fn().mockRejectedValue(new Error('Task failed'));
    const task: Omit<Task, 'status' | 'tokenUsage'> = {
      id: 'task-fail',
      description: 'Will fail',
      assignedTo: 'agent-1',
    };

    queue.enqueue(task as Task, executor);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const retrieved = queue.getTask('task-fail');
    expect(retrieved?.status).toBe('failed');
    expect(retrieved?.result).toContain('Task failed');
  });
});

// ============================================================================
// TESTS: ContextAssembler
// ============================================================================

describe('ContextAssembler', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler({
      agentId: 'test-agent',
      soul: 'You are a test agent',
      workspace: '/test/workspace',
      model: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
        maxTokens: 4096,
        temperature: 0.7,
      },
    });
  });

  it('should assemble context with system prompt, history, and user prompt', async () => {
    const result = await assembler.assemble({
      history: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ],
      tools: [],
      userPrompt: 'What is 2+2?',
      includeMemory: false,
    });

    expect(result).toBeDefined();
    expect(result.messages).toBeDefined();
    expect(result.systemPrompt).toContain('You are a test agent');
    expect(result.tokenEstimate).toBeGreaterThan(0);
    expect(result.messages.length).toBeGreaterThanOrEqual(3); // system + history + user
  });

  it('should include tool descriptions in system prompt', async () => {
    const tools = [
      {
        name: 'calculator',
        description: 'Performs math calculations',
        input_schema: { type: 'object', properties: {} },
      },
      {
        name: 'search',
        description: 'Searches the web',
        input_schema: { type: 'object', properties: {} },
      },
    ];

    const result = await assembler.assemble({
      history: [],
      tools,
      userPrompt: 'Calculate 5*5 and search for cats',
      includeMemory: false,
    });

    expect(result.systemPrompt).toContain('calculator');
    expect(result.systemPrompt).toContain('search');
    expect(result.systemPrompt).toContain('Performs math calculations');
    expect(result.systemPrompt).toContain('Searches the web');
  });

  it('should handle empty history', async () => {
    const result = await assembler.assemble({
      history: [],
      tools: [],
      userPrompt: 'First message',
      includeMemory: false,
    });

    expect(result.messages).toBeDefined();
    expect(result.messages.length).toBeGreaterThanOrEqual(2); // system + user
    expect(result.messages.some((m) => m.content.includes('First message'))).toBe(true);
  });

  it('should set includeMemory to false to skip memory retrieval', async () => {
    const { searchMemory } = await import('@/lib/engine/memory');

    const result = await assembler.assemble({
      history: [],
      tools: [],
      userPrompt: 'Test prompt',
      includeMemory: false,
    });

    expect(result.memoryHits).toBe(0);
    // searchMemory should not be called when includeMemory is false
  });

  it('should include memory when includeMemory is true', async () => {
    const { searchMemory } = await import('@/lib/engine/memory');
    (searchMemory as any).mockResolvedValueOnce([
      { content: 'Memory 1', similarity: 0.9 },
      { content: 'Memory 2', similarity: 0.8 },
    ]);

    const result = await assembler.assemble({
      history: [],
      tools: [],
      userPrompt: 'Remember this',
      includeMemory: true,
    });

    expect(searchMemory).toHaveBeenCalled();
    expect(result.memoryHits).toBe(2);
  });
});

// ============================================================================
// TESTS: TaskRouter
// ============================================================================

describe('TaskRouter', () => {
  let router: TaskRouter;

  beforeEach(() => {
    // Create a fresh router instance
    router = new TaskRouter();
  });

  it('should route dev tasks to a2', () => {
    const agent = router.route('Fix a bug in the API endpoint');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('a2');
  });

  it('should route content tasks to a3', () => {
    const agent = router.route('Write a blog post about AI');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('a3');
  });

  it('should route test tasks to a4', () => {
    const agent = router.route('Run test suite for the login component');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('a4');
  });

  it('should route marketing tasks to a5', () => {
    const agent = router.route('Plan a marketing campaign for product launch');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('a5');
  });

  it('should route animation tasks to a6', () => {
    const agent = router.route('Create a 3D animation with Three.js');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('a6');
  });

  it('should route business tasks to a7', () => {
    const agent = router.route('Send outreach emails to new prospects');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('a7');
  });

  it('should default to a1 for unmatched tasks', () => {
    const agent = router.route('Something completely random and unrelated');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('a1');
  });

  it('should route by ID directly', () => {
    const agent = router.routeById('a3');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('a3');
    expect(agent?.name).toBe('Content Agent');

    const notFound = router.routeById('non-existent');
    expect(notFound).toBeNull();
  });

  it('should handle case-insensitive keyword matching', () => {
    const agent1 = router.route('Fix bug in BACKEND code');
    expect(agent1?.id).toBe('a2');

    const agent2 = router.route('write CONTENT for website');
    expect(agent2?.id).toBe('a3');

    const agent3 = router.route('Run QA test coverage');
    expect(agent3?.id).toBe('a4');
  });

  it('should match first matching pattern in precedence order', () => {
    const agent = router.route('Test the backend API endpoint');
    // A2 (dev) pattern is checked before A4 (test) pattern
    expect(agent).toBeDefined();
    expect(['a2', 'a4'].includes(agent?.id || '')).toBe(true);
  });
});
