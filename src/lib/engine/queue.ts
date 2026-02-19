import type { Task } from '@/types/agent';

export class TaskQueue {
  private maxConcurrent: number;
  private queue: Array<{ task: Task; executor: () => Promise<string>; priority: number }> = [];
  private running: Map<string, Task> = new Map();
  private completed: Map<string, Task> = new Map();
  private draining = false;

  constructor(maxConcurrent: number = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  enqueue(task: Task, executor: () => Promise<string>, priority: number = 0): void {
    this.queue.push({ task, executor, priority });
    console.log(`[TaskQueue] Enqueued task ${task.id} (priority: ${priority})`);
    this.drain();
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;

    try {
      while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
        // Sort by priority (descending)
        this.queue.sort((a, b) => b.priority - a.priority);
        
        const item = this.queue.shift();
        if (!item) break;

        const { task, executor } = item;
        
        // Update task status to running
        task.status = 'running';
        task.startedAt = new Date();
        this.running.set(task.id, task);
        
        console.log(`[TaskQueue] Starting task ${task.id} (${this.running.size}/${this.maxConcurrent} active)`);

        // Execute task asynchronously
        this.executeTask(task, executor);
      }
    } finally {
      this.draining = false;
    }
  }

  private async executeTask(task: Task, executor: () => Promise<string>): Promise<void> {
    try {
      const result = await executor();
      task.status = 'done';
      task.result = result;
      task.completedAt = new Date();
      console.log(`[TaskQueue] Task ${task.id} completed successfully`);
    } catch (error) {
      task.status = 'failed';
      task.result = error instanceof Error ? error.message : String(error);
      task.completedAt = new Date();
      console.error(`[TaskQueue] Task ${task.id} failed:`, error);
    } finally {
      this.running.delete(task.id);
      this.completed.set(task.id, task);
      
      // Try to drain more tasks
      this.drain();
    }
  }

  getTask(taskId: string): Task | undefined {
    // Check running tasks
    if (this.running.has(taskId)) {
      return this.running.get(taskId);
    }
    
    // Check completed tasks
    if (this.completed.has(taskId)) {
      return this.completed.get(taskId);
    }
    
    // Check queued tasks
    const queuedItem = this.queue.find(item => item.task.id === taskId);
    return queuedItem?.task;
  }

  listTasks(filter?: 'queued' | 'running' | 'done' | 'failed'): Task[] {
    const tasks: Task[] = [];
    
    // Add queued tasks
    if (!filter || filter === 'queued') {
      tasks.push(...this.queue.map(item => item.task));
    }
    
    // Add running tasks
    if (!filter || filter === 'running') {
      tasks.push(...Array.from(this.running.values()));
    }
    
    // Add completed tasks
    if (!filter || filter === 'done' || filter === 'failed') {
      const completedTasks = Array.from(this.completed.values());
      if (filter === 'done' || filter === 'failed') {
        tasks.push(...completedTasks.filter(t => t.status === filter));
      } else {
        tasks.push(...completedTasks);
      }
    }
    
    return tasks;
  }

  get pending(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.running.size;
  }

  cancel(taskId: string): boolean {
    const index = this.queue.findIndex(item => item.task.id === taskId);
    if (index === -1) return false;
    
    const [item] = this.queue.splice(index, 1);
    item.task.status = 'failed';
    item.task.result = 'Cancelled';
    item.task.completedAt = new Date();
    this.completed.set(taskId, item.task);
    
    console.log(`[TaskQueue] Cancelled task ${taskId}`);
    return true;
  }
}
