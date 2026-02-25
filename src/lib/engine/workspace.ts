/**
 * WorkspaceManager - Provides per-task workspace isolation for agents
 *
 * Each agent has a root workspace at `data/workspaces/{agentId}`.
 * When a task is spawned, it gets an isolated sub-workspace at
 * `data/workspaces/{agentId}/tasks/{taskId}/` so that parallel
 * tasks cannot interfere with each other's files.
 *
 * Storage adapters allow workspaces to persist across serverless
 * instances — local filesystem for dev, Supabase Storage for prod.
 */

import { join, resolve, relative } from 'path';
import {
  mkdir as fsMkdir,
  rm,
  readFile as fsReadFile,
  writeFile as fsWriteFile,
  unlink,
  readdir,
  stat,
} from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';
import { pack as tarPack, extract as tarExtract } from 'tar-stream';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// StorageAdapter interface
// ---------------------------------------------------------------------------

/** Abstraction over filesystem operations so workspaces survive serverless cold starts. */
export interface StorageAdapter {
  /** Read a file and return its contents as a Buffer. */
  readFile(filePath: string): Promise<Buffer>;

  /** Write contents to a file, creating parent dirs as needed. */
  writeFile(filePath: string, data: Buffer | string): Promise<void>;

  /** Delete a single file. */
  deleteFile(filePath: string): Promise<void>;

  /** List files under a directory prefix. Returns relative paths. */
  listFiles(dirPath: string): Promise<string[]>;

  /** Create a directory (recursive). No-op for cloud storage. */
  mkdir(dirPath: string): Promise<void>;

  /** Check whether a file or directory exists. */
  exists(filePath: string): Promise<boolean>;

  /** Tar + gzip a directory into a single bundle and persist it. */
  uploadBundle(dirPath: string, bundleKey: string): Promise<void>;

  /** Download a bundle and extract it into a directory. */
  downloadBundle(bundleKey: string, destPath: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// LocalStorageAdapter — fs/promises implementation (existing behaviour)
// ---------------------------------------------------------------------------

export class LocalStorageAdapter implements StorageAdapter {
  async readFile(filePath: string): Promise<Buffer> {
    return fsReadFile(filePath);
  }

  async writeFile(filePath: string, data: Buffer | string): Promise<void> {
    const dir = join(filePath, '..');
    await fsMkdir(dir, { recursive: true });
    await fsWriteFile(filePath, data);
  }

  async deleteFile(filePath: string): Promise<void> {
    await unlink(filePath);
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const results: string[] = [];
    const walk = async (dir: string, prefix: string) => {
      let entries: string[];
      try {
        entries = await readdir(dir);
      } catch {
        return; // directory doesn't exist — treat as empty
      }
      for (const entry of entries) {
        const full = join(dir, entry);
        const rel = prefix ? `${prefix}/${entry}` : entry;
        const info = await stat(full);
        if (info.isDirectory()) {
          await walk(full, rel);
        } else {
          results.push(rel);
        }
      }
    };
    await walk(dirPath, '');
    return results;
  }

  async mkdir(dirPath: string): Promise<void> {
    await fsMkdir(dirPath, { recursive: true });
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async uploadBundle(dirPath: string, bundleKey: string): Promise<void> {
    const files = await this.listFiles(dirPath);
    const pack = tarPack();

    const gzip = createGzip();
    const output = createWriteStream(bundleKey);

    const pipelinePromise = pipeline(pack, gzip, output);

    for (const rel of files) {
      const full = join(dirPath, rel);
      const content = await fsReadFile(full);
      pack.entry({ name: rel }, content);
    }
    pack.finalize();

    await pipelinePromise;
  }

  async downloadBundle(bundleKey: string, destPath: string): Promise<void> {
    await fsMkdir(destPath, { recursive: true });

    const extract = tarExtract();

    extract.on('entry', (header, stream, next) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', async () => {
        const filePath = join(destPath, header.name);
        const dir = join(filePath, '..');
        await fsMkdir(dir, { recursive: true });
        await fsWriteFile(filePath, Buffer.concat(chunks));
        next();
      });
      stream.resume();
    });

    const input = createReadStream(bundleKey);
    const gunzip = createGunzip();

    await pipeline(input, gunzip, extract);
  }
}

// ---------------------------------------------------------------------------
// SupabaseStorageAdapter — Supabase Storage Buckets implementation
// ---------------------------------------------------------------------------

export class SupabaseStorageAdapter implements StorageAdapter {
  private client: SupabaseClient;
  private bucket: string;

  constructor(bucket: string = 'workspaces') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL1;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY1;

    if (!url || !key) {
      throw new Error(
        '[SupabaseStorageAdapter] Missing NEXT_PUBLIC_SUPABASE_URL1 or SUPABASE_SERVICE_ROLE_KEY1'
      );
    }

    this.client = createClient(url, key);
    this.bucket = bucket;
  }

  /** Normalise to forward-slash storage keys (no leading slash). */
  private key(filePath: string): string {
    return filePath.split(/[\\/]/).filter(Boolean).join('/');
  }

  async readFile(filePath: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(this.key(filePath));

    if (error || !data) {
      throw new Error(`[SupabaseStorageAdapter] readFile failed for ${filePath}: ${error?.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async writeFile(filePath: string, data: Buffer | string): Promise<void> {
    const body = typeof data === 'string' ? Buffer.from(data) : data;
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(this.key(filePath), body, { upsert: true });

    if (error) {
      throw new Error(`[SupabaseStorageAdapter] writeFile failed for ${filePath}: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([this.key(filePath)]);

    if (error) {
      throw new Error(`[SupabaseStorageAdapter] deleteFile failed for ${filePath}: ${error.message}`);
    }
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const prefix = this.key(dirPath);
    const results: string[] = [];

    const walk = async (path: string) => {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .list(path, { limit: 1000 });

      if (error || !data) return;

      for (const item of data) {
        const itemPath = path ? `${path}/${item.name}` : item.name;
        if (item.id) {
          // It's a file (has an id)
          const rel = prefix ? itemPath.slice(prefix.length + 1) : itemPath;
          results.push(rel);
        } else {
          // It's a folder — recurse
          await walk(itemPath);
        }
      }
    };

    await walk(prefix);
    return results;
  }

  /** No-op — Supabase Storage doesn't need explicit directory creation. */
  async mkdir(_dirPath: string): Promise<void> {
    // Cloud storage is flat; directories are implicit via key prefixes.
  }

  async exists(filePath: string): Promise<boolean> {
    const key = this.key(filePath);
    const parentDir = key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : '';
    const fileName = key.includes('/') ? key.slice(key.lastIndexOf('/') + 1) : key;

    const { data } = await this.client.storage
      .from(this.bucket)
      .list(parentDir, { search: fileName, limit: 1 });

    return !!data && data.length > 0;
  }

  async uploadBundle(dirPath: string, bundleKey: string): Promise<void> {
    // Use LocalStorageAdapter to tar the directory into a temp buffer,
    // then upload the result to Supabase Storage.
    const pack = tarPack();
    const gzip = createGzip();
    const chunks: Buffer[] = [];

    gzip.on('data', (chunk: Buffer) => chunks.push(chunk));

    const local = new LocalStorageAdapter();
    const files = await local.listFiles(dirPath);

    const gzipDone = new Promise<void>((res, rej) => {
      gzip.on('end', res);
      gzip.on('error', rej);
    });

    pack.pipe(gzip);

    for (const rel of files) {
      const full = join(dirPath, rel);
      const content = await fsReadFile(full);
      pack.entry({ name: rel }, content);
    }
    pack.finalize();

    await gzipDone;

    const bundle = Buffer.concat(chunks);
    await this.writeFile(bundleKey, bundle);
  }

  async downloadBundle(bundleKey: string, destPath: string): Promise<void> {
    const bundle = await this.readFile(bundleKey);

    await fsMkdir(destPath, { recursive: true });

    const extract = tarExtract();
    const gunzip = createGunzip();

    const extractDone = new Promise<void>((resolve, reject) => {
      extract.on('finish', resolve);
      extract.on('error', reject);

      extract.on('entry', (header, stream, next) => {
        const entryChunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => entryChunks.push(chunk));
        stream.on('end', async () => {
          try {
            const filePath = join(destPath, header.name);
            const dir = join(filePath, '..');
            await fsMkdir(dir, { recursive: true });
            await fsWriteFile(filePath, Buffer.concat(entryChunks));
            next();
          } catch (err) {
            reject(err);
          }
        });
        stream.resume();
      });
    });

    gunzip.pipe(extract);
    gunzip.end(bundle);

    await extractDone;
  }
}

// ---------------------------------------------------------------------------
// Factory — pick the right adapter based on environment
// ---------------------------------------------------------------------------

/**
 * Returns a SupabaseStorageAdapter in production (when SUPABASE_SERVICE_ROLE_KEY1
 * is set) and a LocalStorageAdapter otherwise.
 */
export function createStorageAdapter(): StorageAdapter {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY1) {
    return new SupabaseStorageAdapter();
  }
  return new LocalStorageAdapter();
}

// ---------------------------------------------------------------------------
// WorkspaceInfo & WorkspaceManager — original exports preserved
// ---------------------------------------------------------------------------

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
  private storage: StorageAdapter;

  constructor(agentRoot: string, storage?: StorageAdapter) {
    this.agentRoot = agentRoot;
    this.storage = storage ?? new LocalStorageAdapter();
  }

  /** Return the agent-level root workspace path */
  getAgentRoot(): string {
    return this.agentRoot;
  }

  /** Return the active storage adapter */
  getStorage(): StorageAdapter {
    return this.storage;
  }

  /** Create and return an isolated workspace for a specific task */
  async createTaskWorkspace(taskId: string): Promise<WorkspaceInfo> {
    const taskDir = join(this.agentRoot, 'tasks', taskId);
    await this.storage.mkdir(taskDir);
    return { agentRoot: this.agentRoot, taskDir, taskId };
  }

  /** Clean up a task workspace after it completes */
  async cleanupTaskWorkspace(taskId: string): Promise<void> {
    const taskDir = join(this.agentRoot, 'tasks', taskId);
    try {
      const files = await this.storage.listFiles(taskDir);
      for (const file of files) {
        await this.storage.deleteFile(join(taskDir, file));
      }
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
