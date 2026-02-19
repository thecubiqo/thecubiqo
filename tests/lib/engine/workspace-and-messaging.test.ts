/**
 * Tests for WorkspaceManager and MessageBus
 *
 * Validates workspace isolation per-task and agent-to-agent messaging.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkspaceManager } from '@/lib/engine/workspace';
import { MessageBus } from '@/lib/engine/message-bus';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';

// ---------------------------------------------------------------------------
// WorkspaceManager
// ---------------------------------------------------------------------------

describe('WorkspaceManager', () => {
  const testRoot = join('/tmp', 'cubiqo-test-workspace', `agent-${Date.now()}`);
  let manager: WorkspaceManager;

  beforeEach(async () => {
    await mkdir(testRoot, { recursive: true });
    manager = new WorkspaceManager(testRoot);
  });

  afterEach(async () => {
    await rm(testRoot, { recursive: true, force: true });
  });

  it('should return agent root path', () => {
    expect(manager.getAgentRoot()).toBe(testRoot);
  });

  it('should create an isolated task workspace directory', async () => {
    const info = await manager.createTaskWorkspace('task-1');
    expect(info.taskId).toBe('task-1');
    expect(info.agentRoot).toBe(testRoot);
    expect(info.taskDir).toBe(join(testRoot, 'tasks', 'task-1'));
    expect(existsSync(info.taskDir)).toBe(true);
  });

  it('should isolate files between two tasks', async () => {
    const ws1 = await manager.createTaskWorkspace('task-a');
    const ws2 = await manager.createTaskWorkspace('task-b');

    // Write a file into task-a workspace
    await writeFile(join(ws1.taskDir, 'data.txt'), 'hello from a');
    // Task-b workspace should NOT have that file
    expect(existsSync(join(ws2.taskDir, 'data.txt'))).toBe(false);
  });

  it('should clean up a task workspace', async () => {
    const info = await manager.createTaskWorkspace('task-cleanup');
    await writeFile(join(info.taskDir, 'tmp.txt'), 'temp');
    expect(existsSync(info.taskDir)).toBe(true);

    await manager.cleanupTaskWorkspace('task-cleanup');
    expect(existsSync(info.taskDir)).toBe(false);
  });

  describe('validatePath', () => {
    it('should allow paths inside the boundary', () => {
      expect(WorkspaceManager.validatePath('file.txt', testRoot)).toBe(true);
      expect(WorkspaceManager.validatePath('sub/dir/file.txt', testRoot)).toBe(true);
    });

    it('should reject paths that escape the boundary', () => {
      expect(WorkspaceManager.validatePath('../../../etc/passwd', testRoot)).toBe(false);
    });

    it('should reject complex traversal attempts', () => {
      expect(WorkspaceManager.validatePath('sub/../../..', testRoot)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// MessageBus
// ---------------------------------------------------------------------------

describe('MessageBus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = MessageBus.getInstance();
    bus.reset();
  });

  it('should be a singleton', () => {
    const bus2 = MessageBus.getInstance();
    expect(bus).toBe(bus2);
  });

  it('should send a message from one agent to another', () => {
    const msg = bus.send('a1', 'a2', 'Review PR', 'Please review PR #42');
    expect(msg.from).toBe('a1');
    expect(msg.to).toBe('a2');
    expect(msg.subject).toBe('Review PR');
    expect(msg.body).toBe('Please review PR #42');
    expect(msg.read).toBe(false);
    expect(msg.id).toBeDefined();
  });

  it('should deliver messages to the correct inbox', () => {
    bus.send('a1', 'a2', 'Hello', 'Hi A2');
    bus.send('a3', 'a2', 'Docs', 'Docs ready');
    bus.send('a1', 'a3', 'Write', 'Write blog');

    expect(bus.getInbox('a2')).toHaveLength(2);
    expect(bus.getInbox('a3')).toHaveLength(1);
    expect(bus.getInbox('a1')).toHaveLength(0);
  });

  it('should filter unread messages', () => {
    bus.send('a1', 'a2', 's1', 'b1');
    const msg2 = bus.send('a3', 'a2', 's2', 'b2');

    bus.markRead('a2', msg2.id);

    const unread = bus.getInbox('a2', true);
    expect(unread).toHaveLength(1);
    expect(unread[0].subject).toBe('s1');
  });

  it('should mark a specific message as read', () => {
    const msg = bus.send('a1', 'a2', 'Test', 'body');
    expect(bus.markRead('a2', msg.id)).toBe(true);

    const inbox = bus.getInbox('a2');
    expect(inbox[0].read).toBe(true);
  });

  it('should return false when marking non-existent message', () => {
    expect(bus.markRead('a2', 'non-existent')).toBe(false);
  });

  it('should mark all messages as read', () => {
    bus.send('a1', 'a2', 's1', 'b1');
    bus.send('a3', 'a2', 's2', 'b2');

    const count = bus.markAllRead('a2');
    expect(count).toBe(2);
    expect(bus.getInbox('a2', true)).toHaveLength(0);
  });

  it('should clear an inbox', () => {
    bus.send('a1', 'a2', 's1', 'b1');
    bus.send('a3', 'a2', 's2', 'b2');

    bus.clearInbox('a2');
    expect(bus.getInbox('a2')).toHaveLength(0);
  });

  it('should return empty inbox for unknown agent', () => {
    expect(bus.getInbox('unknown')).toHaveLength(0);
  });

  it('should reset entire bus', () => {
    bus.send('a1', 'a2', 's', 'b');
    bus.send('a3', 'a4', 's', 'b');
    bus.reset();

    expect(bus.getInbox('a2')).toHaveLength(0);
    expect(bus.getInbox('a4')).toHaveLength(0);
  });
});
