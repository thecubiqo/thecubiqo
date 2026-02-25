/**
 * Workspace Adapter Tests
 *
 * Validates LocalStorageAdapter filesystem operations, WorkspaceManager
 * lifecycle (create / cleanup / validate), and the createStorageAdapter
 * factory function that selects local vs. Supabase storage based on env vars.
 */

import { describe, it, expect, afterEach, afterAll, vi } from 'vitest';
import { join } from 'path';
import { mkdtemp, rm, writeFile as fsWriteFile, readFile as fsReadFile, stat } from 'fs/promises';
import { tmpdir } from 'os';

import {
  LocalStorageAdapter,
  WorkspaceManager,
  createStorageAdapter,
} from '@/lib/engine/workspace';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect temp dirs so we can nuke them in afterAll even if a test fails. */
const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'test-workspace-'));
  tempDirs.push(dir);
  return dir;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Global cleanup
// ---------------------------------------------------------------------------

afterAll(async () => {
  for (const dir of tempDirs) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

// ============================================================================
// TESTS: LocalStorageAdapter
// ============================================================================

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;
  let root: string;

  afterEach(async () => {
    // Each test creates its own temp dir so cleanup is handled in afterAll,
    // but we can also do per-test cleanup here if root was set.
  });

  // -----------------------------------------------------------------------
  // readFile
  // -----------------------------------------------------------------------

  describe('readFile', () => {
    it('reads a file and returns its contents as a Buffer', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const filePath = join(root, 'hello.txt');
      await fsWriteFile(filePath, 'Hello, Cubiqo!');

      const result = await adapter.readFile(filePath);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('Hello, Cubiqo!');
    });

    it('throws when the file does not exist', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      await expect(adapter.readFile(join(root, 'nope.txt'))).rejects.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // writeFile
  // -----------------------------------------------------------------------

  describe('writeFile', () => {
    it('writes a string to a file and creates parent directories', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const filePath = join(root, 'sub', 'dir', 'output.txt');
      await adapter.writeFile(filePath, 'written by adapter');

      expect(await pathExists(filePath)).toBe(true);

      const content = await fsReadFile(filePath, 'utf-8');
      expect(content).toBe('written by adapter');
    });

    it('writes a Buffer to a file', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const filePath = join(root, 'binary.bin');
      const buf = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
      await adapter.writeFile(filePath, buf);

      const result = await fsReadFile(filePath);
      expect(result).toEqual(buf);
    });

    it('overwrites an existing file', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const filePath = join(root, 'overwrite.txt');
      await adapter.writeFile(filePath, 'first');
      await adapter.writeFile(filePath, 'second');

      const content = await fsReadFile(filePath, 'utf-8');
      expect(content).toBe('second');
    });
  });

  // -----------------------------------------------------------------------
  // deleteFile
  // -----------------------------------------------------------------------

  describe('deleteFile', () => {
    it('deletes an existing file', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const filePath = join(root, 'doomed.txt');
      await fsWriteFile(filePath, 'goodbye');
      expect(await pathExists(filePath)).toBe(true);

      await adapter.deleteFile(filePath);
      expect(await pathExists(filePath)).toBe(false);
    });

    it('throws when the file does not exist', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      await expect(adapter.deleteFile(join(root, 'ghost.txt'))).rejects.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // listFiles
  // -----------------------------------------------------------------------

  describe('listFiles', () => {
    it('returns relative paths for a flat directory', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      await fsWriteFile(join(root, 'a.txt'), 'a');
      await fsWriteFile(join(root, 'b.txt'), 'b');

      const files = await adapter.listFiles(root);
      expect(files.sort()).toEqual(['a.txt', 'b.txt']);
    });

    it('returns relative paths for a nested directory structure', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      // Create: root/src/index.ts, root/src/lib/utils.ts, root/README.md
      await adapter.mkdir(join(root, 'src', 'lib'));
      await fsWriteFile(join(root, 'src', 'index.ts'), '// entry');
      await fsWriteFile(join(root, 'src', 'lib', 'utils.ts'), '// utils');
      await fsWriteFile(join(root, 'README.md'), '# readme');

      const files = await adapter.listFiles(root);
      expect(files.sort()).toEqual([
        'README.md',
        'src/index.ts',
        'src/lib/utils.ts',
      ]);
    });

    it('returns an empty array for a non-existent directory', async () => {
      adapter = new LocalStorageAdapter();
      const files = await adapter.listFiles('/tmp/test-workspace-does-not-exist-' + Date.now());
      expect(files).toEqual([]);
    });

    it('returns an empty array for an empty directory', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const files = await adapter.listFiles(root);
      expect(files).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // mkdir
  // -----------------------------------------------------------------------

  describe('mkdir', () => {
    it('creates a single directory', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const dir = join(root, 'new-dir');
      await adapter.mkdir(dir);
      expect(await pathExists(dir)).toBe(true);
    });

    it('creates nested directories recursively', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const nested = join(root, 'a', 'b', 'c', 'd');
      await adapter.mkdir(nested);
      expect(await pathExists(nested)).toBe(true);
    });

    it('is idempotent — does not throw if directory already exists', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const dir = join(root, 'idempotent');
      await adapter.mkdir(dir);
      await adapter.mkdir(dir); // should not throw
      expect(await pathExists(dir)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // exists
  // -----------------------------------------------------------------------

  describe('exists', () => {
    it('returns true for an existing file', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const filePath = join(root, 'present.txt');
      await fsWriteFile(filePath, 'here');

      expect(await adapter.exists(filePath)).toBe(true);
    });

    it('returns true for an existing directory', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      const dir = join(root, 'existing-dir');
      await adapter.mkdir(dir);

      expect(await adapter.exists(dir)).toBe(true);
    });

    it('returns false for a non-existing path', async () => {
      root = await makeTempDir();
      adapter = new LocalStorageAdapter();

      expect(await adapter.exists(join(root, 'missing.txt'))).toBe(false);
    });

    it('returns false for a deeply non-existing path', async () => {
      adapter = new LocalStorageAdapter();
      expect(await adapter.exists('/tmp/test-workspace-no-such/deep/path/file.txt')).toBe(false);
    });
  });
});

// ============================================================================
// TESTS: WorkspaceManager
// ============================================================================

describe('WorkspaceManager', () => {
  let root: string;

  // -----------------------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('works with default storage (no adapter param)', async () => {
      root = await makeTempDir();
      const mgr = new WorkspaceManager(root);

      expect(mgr.getAgentRoot()).toBe(root);
      // Default storage is LocalStorageAdapter
      expect(mgr.getStorage()).toBeInstanceOf(LocalStorageAdapter);
    });

    it('works with an explicit LocalStorageAdapter', async () => {
      root = await makeTempDir();
      const adapter = new LocalStorageAdapter();
      const mgr = new WorkspaceManager(root, adapter);

      expect(mgr.getStorage()).toBe(adapter);
    });
  });

  // -----------------------------------------------------------------------
  // getAgentRoot
  // -----------------------------------------------------------------------

  describe('getAgentRoot', () => {
    it('returns the root path passed to the constructor', async () => {
      root = await makeTempDir();
      const mgr = new WorkspaceManager(root);
      expect(mgr.getAgentRoot()).toBe(root);
    });
  });

  // -----------------------------------------------------------------------
  // getStorage
  // -----------------------------------------------------------------------

  describe('getStorage', () => {
    it('returns the storage adapter', async () => {
      root = await makeTempDir();
      const adapter = new LocalStorageAdapter();
      const mgr = new WorkspaceManager(root, adapter);
      expect(mgr.getStorage()).toBe(adapter);
    });
  });

  // -----------------------------------------------------------------------
  // createTaskWorkspace
  // -----------------------------------------------------------------------

  describe('createTaskWorkspace', () => {
    it('creates the task directory and returns correct WorkspaceInfo', async () => {
      root = await makeTempDir();
      const mgr = new WorkspaceManager(root);

      const info = await mgr.createTaskWorkspace('task-42');

      expect(info.agentRoot).toBe(root);
      expect(info.taskId).toBe('task-42');
      expect(info.taskDir).toBe(join(root, 'tasks', 'task-42'));

      // The task directory should actually exist on disk
      expect(await pathExists(info.taskDir)).toBe(true);
    });

    it('creates separate workspaces for different tasks', async () => {
      root = await makeTempDir();
      const mgr = new WorkspaceManager(root);

      const info1 = await mgr.createTaskWorkspace('task-a');
      const info2 = await mgr.createTaskWorkspace('task-b');

      expect(info1.taskDir).not.toBe(info2.taskDir);
      expect(await pathExists(info1.taskDir)).toBe(true);
      expect(await pathExists(info2.taskDir)).toBe(true);
    });

    it('is safe to call twice for the same taskId (idempotent mkdir)', async () => {
      root = await makeTempDir();
      const mgr = new WorkspaceManager(root);

      const info1 = await mgr.createTaskWorkspace('task-dup');
      const info2 = await mgr.createTaskWorkspace('task-dup');

      expect(info1.taskDir).toBe(info2.taskDir);
      expect(await pathExists(info1.taskDir)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // cleanupTaskWorkspace
  // -----------------------------------------------------------------------

  describe('cleanupTaskWorkspace', () => {
    it('removes all files inside the task workspace', async () => {
      root = await makeTempDir();
      const mgr = new WorkspaceManager(root);

      // Create workspace and add some files
      const info = await mgr.createTaskWorkspace('task-clean');
      const adapter = mgr.getStorage();
      await adapter.writeFile(join(info.taskDir, 'file1.txt'), 'content1');
      await adapter.writeFile(join(info.taskDir, 'sub', 'file2.txt'), 'content2');

      // Verify files exist
      const filesBefore = await adapter.listFiles(info.taskDir);
      expect(filesBefore.length).toBe(2);

      // Cleanup
      await mgr.cleanupTaskWorkspace('task-clean');

      // Files should be gone
      const filesAfter = await adapter.listFiles(info.taskDir);
      expect(filesAfter).toEqual([]);
    });

    it('does not throw when the task workspace does not exist', async () => {
      root = await makeTempDir();
      const mgr = new WorkspaceManager(root);

      // Should not throw — the error path logs but swallows the error
      await expect(mgr.cleanupTaskWorkspace('task-nonexistent')).resolves.toBeUndefined();
    });

    it('does not throw when the task workspace is already empty', async () => {
      root = await makeTempDir();
      const mgr = new WorkspaceManager(root);

      await mgr.createTaskWorkspace('task-empty');

      await expect(mgr.cleanupTaskWorkspace('task-empty')).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // validatePath (static)
  // -----------------------------------------------------------------------

  describe('validatePath (static)', () => {
    const boundary = '/tmp/cubiqo-workspace/agent-1';

    it('allows a relative path inside the boundary', () => {
      expect(WorkspaceManager.validatePath('src/index.ts', boundary)).toBe(true);
    });

    it('allows a nested relative path', () => {
      expect(WorkspaceManager.validatePath('tasks/t1/output.txt', boundary)).toBe(true);
    });

    it('blocks directory traversal with ../', () => {
      expect(WorkspaceManager.validatePath('../../etc/passwd', boundary)).toBe(false);
    });

    it('blocks deeply nested traversal', () => {
      expect(WorkspaceManager.validatePath('a/b/../../../../etc/shadow', boundary)).toBe(false);
    });

    it('allows a bare filename', () => {
      expect(WorkspaceManager.validatePath('file.txt', boundary)).toBe(true);
    });

    it('allows an empty string (resolves to boundary itself)', () => {
      expect(WorkspaceManager.validatePath('', boundary)).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: createStorageAdapter factory
// ============================================================================

describe('createStorageAdapter', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns LocalStorageAdapter when SUPABASE_SERVICE_ROLE_KEY1 is NOT set', () => {
    // Ensure the env var is absent
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY1', '');

    const adapter = createStorageAdapter();
    expect(adapter).toBeInstanceOf(LocalStorageAdapter);
  });

  it('returns LocalStorageAdapter when env var is undefined', () => {
    // Remove the key entirely by stubbing to empty string
    // (process.env values are always strings or undefined)
    delete process.env.SUPABASE_SERVICE_ROLE_KEY1;

    const adapter = createStorageAdapter();
    expect(adapter).toBeInstanceOf(LocalStorageAdapter);
  });

  it('throws when SUPABASE_SERVICE_ROLE_KEY1 is set but NEXT_PUBLIC_SUPABASE_URL1 is not', () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY1', 'fake-service-role-key');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL1', '');

    expect(() => createStorageAdapter()).toThrow(
      /Missing NEXT_PUBLIC_SUPABASE_URL1 or SUPABASE_SERVICE_ROLE_KEY1/
    );
  });
});
