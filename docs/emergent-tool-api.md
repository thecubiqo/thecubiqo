# Emergent Tool API Specification
## Tool Layer for AI App Builder

**Version:** 1.0.0  
**Author:** MO (CTO/Tech Architect)  
**Date:** February 18, 2025  
**Status:** Architecture Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Tool Architecture](#tool-architecture)
3. [Bulk File Operations](#bulk-file-operations)
4. [Testing Sub-Agent Interface](#testing-sub-agent-interface)
5. [Integration Executor Interface](#integration-executor-interface)
6. [Image Sub-Agent Interface](#image-sub-agent-interface)
7. [Human Interaction Interface](#human-interaction-interface)
8. [Database Sub-Agent Interface](#database-sub-agent-interface)
9. [Deployment Tools](#deployment-tools)
10. [Monitoring & Analytics Tools](#monitoring--analytics-tools)
11. [Error Handling & Retry Logic](#error-handling--retry-logic)
12. [API Security](#api-security)

---

## Overview

The Tool Layer provides a standardized interface for the Main Agent to interact with various sub-agents and external services. All tools follow a consistent API pattern for predictability and maintainability.

### Design Principles

1. **Idempotency** - Tools can be called multiple times without side effects
2. **Atomicity** - Operations succeed or fail completely
3. **Type Safety** - Full TypeScript support with Zod validation
4. **Error Context** - Rich error messages with actionable suggestions
5. **Rate Limiting** - Prevent abuse and manage costs
6. **Audit Logging** - All tool calls logged for debugging and compliance

### Tool Execution Flow

```
Main Agent Request
    │
    ▼
┌────────────────────────────────────┐
│ Tool Router                        │
│ • Validate input with Zod          │
│ • Check rate limits                │
│ • Verify permissions               │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Tool Executor                      │
│ • Call sub-agent or service        │
│ • Handle retries on failure        │
│ • Log execution                    │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Response Formatter                 │
│ • Standardize response shape       │
│ • Include metadata                 │
│ • Return to Main Agent             │
└────────────────────────────────────┘
```

---

## Tool Architecture

### Base Tool Interface

All tools implement this base interface:

```typescript
// src/lib/tools/base-tool.ts

interface ToolMetadata {
  name: string;
  description: string;
  version: string;
  category: 'code' | 'test' | 'image' | 'integration' | 'human' | 'database' | 'deployment';
  costCredits: number;  // Cost in credits per invocation
}

interface ToolInput<T = any> {
  projectId: string;
  userId: string;
  params: T;
  metadata?: {
    requestId?: string;
    parentRequestId?: string;
    retryCount?: number;
  };
}

interface ToolOutput<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    suggestions?: string[];
  };
  metadata: {
    toolName: string;
    executionTime: number;  // milliseconds
    creditsUsed: number;
    timestamp: Date;
  };
}

abstract class BaseTool<TInput, TOutput> {
  abstract metadata: ToolMetadata;
  abstract inputSchema: z.ZodSchema<TInput>;
  abstract outputSchema: z.ZodSchema<TOutput>;
  
  async execute(input: ToolInput<TInput>): Promise<ToolOutput<TOutput>> {
    const startTime = Date.now();
    
    try {
      // 1. Validate input
      const validatedInput = this.inputSchema.parse(input.params);
      
      // 2. Check rate limits
      await this.checkRateLimit(input.userId, input.projectId);
      
      // 3. Check permissions
      await this.checkPermissions(input.userId, input.projectId);
      
      // 4. Execute tool logic
      const result = await this.run(validatedInput, input.projectId, input.userId);
      
      // 5. Log execution
      await this.logExecution(input, result, true);
      
      // 6. Deduct credits
      await this.deductCredits(input.userId, this.metadata.costCredits);
      
      return {
        success: true,
        data: result,
        metadata: {
          toolName: this.metadata.name,
          executionTime: Date.now() - startTime,
          creditsUsed: this.metadata.costCredits,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      await this.logExecution(input, null, false, error);
      
      return {
        success: false,
        error: this.formatError(error),
        metadata: {
          toolName: this.metadata.name,
          executionTime: Date.now() - startTime,
          creditsUsed: 0,
          timestamp: new Date(),
        },
      };
    }
  }
  
  protected abstract run(
    params: TInput, 
    projectId: string, 
    userId: string
  ): Promise<TOutput>;
  
  protected formatError(error: any): ToolOutput['error'] {
    // Convert errors into structured format with suggestions
    return {
      code: error.code || 'TOOL_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || {},
      suggestions: this.getSuggestions(error),
    };
  }
  
  protected getSuggestions(error: any): string[] {
    // Override in subclasses for context-specific suggestions
    return ['Check input parameters', 'Verify project exists', 'Try again'];
  }
  
  private async checkRateLimit(userId: string, projectId: string) {
    const key = `rate_limit:${userId}:${this.metadata.name}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 60);  // 1 minute window
    }
    
    if (count > this.metadata.rateLimit) {
      throw new RateLimitError(`Rate limit exceeded for ${this.metadata.name}`);
    }
  }
  
  private async checkPermissions(userId: string, projectId: string) {
    const hasAccess = await db.projectMembers.exists({
      where: { userId, projectId }
    });
    
    if (!hasAccess) {
      throw new PermissionError('User does not have access to this project');
    }
  }
  
  private async logExecution(
    input: ToolInput<TInput>, 
    result: TOutput | null, 
    success: boolean,
    error?: any
  ) {
    await db.toolExecutionLogs.create({
      data: {
        toolName: this.metadata.name,
        userId: input.userId,
        projectId: input.projectId,
        input: input.params,
        output: result,
        success,
        error: error ? this.formatError(error) : null,
        timestamp: new Date(),
      },
    });
  }
  
  private async deductCredits(userId: string, amount: number) {
    await db.credits.update({
      where: { userId },
      data: { balance: { decrement: amount } }
    });
  }
}
```

### Tool Registry

```typescript
// src/lib/tools/registry.ts

class ToolRegistry {
  private tools: Map<string, BaseTool<any, any>> = new Map();
  
  register(tool: BaseTool<any, any>) {
    this.tools.set(tool.metadata.name, tool);
  }
  
  get(toolName: string): BaseTool<any, any> | undefined {
    return this.tools.get(toolName);
  }
  
  list(): ToolMetadata[] {
    return Array.from(this.tools.values()).map(tool => tool.metadata);
  }
}

export const toolRegistry = new ToolRegistry();

// Register all tools
toolRegistry.register(new BulkWriteTool());
toolRegistry.register(new BulkEditTool());
toolRegistry.register(new RunTestsTool());
toolRegistry.register(new GenerateImageTool());
toolRegistry.register(new AskHumanTool());
// ... etc
```

---

## Bulk File Operations

### 1. Bulk Write Tool

**Purpose:** Create multiple files in a single atomic operation

```typescript
// src/lib/tools/code/bulk-write-tool.ts

interface BulkWriteInput {
  files: Array<{
    path: string;          // Relative path from project root
    content: string;       // File content
    encoding?: 'utf8' | 'base64';
    overwrite?: boolean;   // Default: false (fail if exists)
  }>;
  dryRun?: boolean;        // Preview changes without applying
}

interface BulkWriteOutput {
  filesCreated: string[];
  filesSkipped: string[];  // Already exist and overwrite=false
  totalSize: number;       // Total bytes written
  warnings?: string[];     // Non-critical issues
}

class BulkWriteTool extends BaseTool<BulkWriteInput, BulkWriteOutput> {
  metadata = {
    name: 'bulk_write',
    description: 'Create multiple files atomically',
    version: '1.0.0',
    category: 'code',
    costCredits: 5,
    rateLimit: 10,  // 10 calls per minute
  };
  
  inputSchema = z.object({
    files: z.array(z.object({
      path: z.string().min(1).regex(/^[a-zA-Z0-9/_.-]+$/),  // Sanitize paths
      content: z.string(),
      encoding: z.enum(['utf8', 'base64']).optional(),
      overwrite: z.boolean().optional(),
    })).min(1).max(100),  // Max 100 files per operation
    dryRun: z.boolean().optional(),
  });
  
  outputSchema = z.object({
    filesCreated: z.array(z.string()),
    filesSkipped: z.array(z.string()),
    totalSize: z.number(),
    warnings: z.array(z.string()).optional(),
  });
  
  protected async run(
    params: BulkWriteInput, 
    projectId: string, 
    userId: string
  ): Promise<BulkWriteOutput> {
    const workspacePath = await this.getWorkspacePath(projectId);
    const filesCreated: string[] = [];
    const filesSkipped: string[] = [];
    let totalSize = 0;
    const warnings: string[] = [];
    
    // Check storage quota
    const currentSize = await this.getWorkspaceSize(workspacePath);
    const newSize = params.files.reduce((sum, f) => sum + f.content.length, 0);
    const quota = await this.getStorageQuota(userId);
    
    if (currentSize + newSize > quota) {
      throw new StorageQuotaError(
        `Storage quota exceeded: ${currentSize + newSize} > ${quota} bytes`
      );
    }
    
    // Dry run mode
    if (params.dryRun) {
      return {
        filesCreated: params.files.map(f => f.path),
        filesSkipped: [],
        totalSize: newSize,
        warnings: ['DRY RUN - No files were actually created'],
      };
    }
    
    // Execute writes atomically
    const transaction = await this.beginTransaction(workspacePath);
    
    try {
      for (const file of params.files) {
        const fullPath = path.join(workspacePath, file.path);
        
        // Validate path (prevent traversal)
        if (!fullPath.startsWith(workspacePath)) {
          throw new PathTraversalError(`Invalid path: ${file.path}`);
        }
        
        // Check if file exists
        if (fs.existsSync(fullPath) && !file.overwrite) {
          filesSkipped.push(file.path);
          warnings.push(`File already exists: ${file.path}`);
          continue;
        }
        
        // Create directory if needed
        await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
        
        // Write file
        const encoding = file.encoding || 'utf8';
        await fs.promises.writeFile(fullPath, file.content, encoding);
        
        filesCreated.push(file.path);
        totalSize += file.content.length;
      }
      
      await this.commitTransaction(transaction);
      
      // Trigger hot reload if dev server is running
      await this.triggerHotReload(projectId, filesCreated);
      
      return {
        filesCreated,
        filesSkipped,
        totalSize,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      await this.rollbackTransaction(transaction);
      throw error;
    }
  }
  
  protected getSuggestions(error: any): string[] {
    if (error instanceof StorageQuotaError) {
      return [
        'Delete unused files to free up space',
        'Upgrade to a higher plan for more storage',
        'Compress or optimize large files',
      ];
    }
    if (error instanceof PathTraversalError) {
      return [
        'Use relative paths from project root',
        'Avoid ".." in file paths',
        'Check for leading slashes',
      ];
    }
    return super.getSuggestions(error);
  }
}
```

**API Endpoint:**
```typescript
// src/app/api/tools/bulk-write/route.ts

export async function POST(req: Request) {
  const tool = toolRegistry.get('bulk_write');
  const input = await req.json();
  
  const result = await tool.execute(input);
  
  return Response.json(result);
}
```

**Example Usage:**
```typescript
const result = await fetch('/api/tools/bulk-write', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'proj-123',
    userId: 'user-456',
    params: {
      files: [
        {
          path: 'src/app/page.tsx',
          content: 'export default function Home() { return <h1>Hello</h1>; }',
        },
        {
          path: 'src/app/layout.tsx',
          content: '...',
        },
      ],
    },
  }),
});

const output = await result.json();
// {
//   success: true,
//   data: {
//     filesCreated: ['src/app/page.tsx', 'src/app/layout.tsx'],
//     filesSkipped: [],
//     totalSize: 1024,
//   },
//   metadata: { ... }
// }
```

---

### 2. Bulk Edit Tool

**Purpose:** Modify multiple files with search-and-replace operations

```typescript
// src/lib/tools/code/bulk-edit-tool.ts

interface BulkEditInput {
  edits: Array<{
    path: string;
    changes: Array<{
      search: string;       // Exact string to find (or regex if useRegex=true)
      replace: string;      // Replacement string
      useRegex?: boolean;   // Default: false
      lineNumber?: number;  // Optional line hint for faster search
      all?: boolean;        // Replace all occurrences (default: false)
    }>;
  }>;
  dryRun?: boolean;
}

interface BulkEditOutput {
  filesModified: string[];
  changesApplied: number;
  changesFailed: Array<{
    path: string;
    reason: string;
  }>;
  diff?: string;  // Unified diff format
}

class BulkEditTool extends BaseTool<BulkEditInput, BulkEditOutput> {
  metadata = {
    name: 'bulk_edit',
    description: 'Edit multiple files with search-and-replace',
    version: '1.0.0',
    category: 'code',
    costCredits: 3,
    rateLimit: 20,
  };
  
  inputSchema = z.object({
    edits: z.array(z.object({
      path: z.string().min(1),
      changes: z.array(z.object({
        search: z.string().min(1),
        replace: z.string(),
        useRegex: z.boolean().optional(),
        lineNumber: z.number().positive().optional(),
        all: z.boolean().optional(),
      })).min(1),
    })).min(1).max(50),
    dryRun: z.boolean().optional(),
  });
  
  outputSchema = z.object({
    filesModified: z.array(z.string()),
    changesApplied: z.number(),
    changesFailed: z.array(z.object({
      path: z.string(),
      reason: z.string(),
    })),
    diff: z.string().optional(),
  });
  
  protected async run(
    params: BulkEditInput, 
    projectId: string, 
    userId: string
  ): Promise<BulkEditOutput> {
    const workspacePath = await this.getWorkspacePath(projectId);
    const filesModified: string[] = [];
    let changesApplied = 0;
    const changesFailed: BulkEditOutput['changesFailed'] = [];
    const diffs: string[] = [];
    
    const transaction = await this.beginTransaction(workspacePath);
    
    try {
      for (const edit of params.edits) {
        const fullPath = path.join(workspacePath, edit.path);
        
        // Validate path
        if (!fullPath.startsWith(workspacePath)) {
          changesFailed.push({
            path: edit.path,
            reason: 'Invalid path (traversal attempt)',
          });
          continue;
        }
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          changesFailed.push({
            path: edit.path,
            reason: 'File not found',
          });
          continue;
        }
        
        // Read file
        const originalContent = await fs.promises.readFile(fullPath, 'utf8');
        let modifiedContent = originalContent;
        let fileChanged = false;
        
        // Apply changes
        for (const change of edit.changes) {
          try {
            if (change.useRegex) {
              const regex = new RegExp(change.search, change.all ? 'g' : '');
              const newContent = modifiedContent.replace(regex, change.replace);
              
              if (newContent !== modifiedContent) {
                modifiedContent = newContent;
                fileChanged = true;
                changesApplied++;
              }
            } else {
              // Exact string match
              const index = modifiedContent.indexOf(change.search);
              
              if (index !== -1) {
                if (change.all) {
                  modifiedContent = modifiedContent.split(change.search).join(change.replace);
                } else {
                  modifiedContent = 
                    modifiedContent.substring(0, index) + 
                    change.replace + 
                    modifiedContent.substring(index + change.search.length);
                }
                fileChanged = true;
                changesApplied++;
              } else {
                changesFailed.push({
                  path: edit.path,
                  reason: `Search string not found: "${change.search.substring(0, 50)}..."`,
                });
              }
            }
          } catch (error) {
            changesFailed.push({
              path: edit.path,
              reason: `Change failed: ${error.message}`,
            });
          }
        }
        
        // Write modified file
        if (fileChanged) {
          if (!params.dryRun) {
            await fs.promises.writeFile(fullPath, modifiedContent, 'utf8');
          }
          filesModified.push(edit.path);
          
          // Generate diff
          const diff = this.generateDiff(edit.path, originalContent, modifiedContent);
          diffs.push(diff);
        }
      }
      
      if (!params.dryRun) {
        await this.commitTransaction(transaction);
        
        // Trigger hot reload
        await this.triggerHotReload(projectId, filesModified);
      } else {
        await this.rollbackTransaction(transaction);
      }
      
      return {
        filesModified,
        changesApplied,
        changesFailed,
        diff: diffs.length > 0 ? diffs.join('\n\n') : undefined,
      };
    } catch (error) {
      await this.rollbackTransaction(transaction);
      throw error;
    }
  }
  
  private generateDiff(filePath: string, original: string, modified: string): string {
    // Generate unified diff format
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    let diff = `--- ${filePath}\n+++ ${filePath}\n`;
    
    // Simple line-by-line diff (can use a library like `diff` for more advanced diffing)
    for (let i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
      if (originalLines[i] !== modifiedLines[i]) {
        if (originalLines[i]) diff += `- ${originalLines[i]}\n`;
        if (modifiedLines[i]) diff += `+ ${modifiedLines[i]}\n`;
      }
    }
    
    return diff;
  }
}
```

**Example Usage:**
```typescript
// Edit multiple files to add authentication
const result = await fetch('/api/tools/bulk-edit', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 'proj-123',
    userId: 'user-456',
    params: {
      edits: [
        {
          path: 'src/app/api/auth/route.ts',
          changes: [
            {
              search: '// TODO: Add authentication',
              replace: 'const user = await authenticateRequest(req);',
            },
          ],
        },
        {
          path: 'src/middleware.ts',
          changes: [
            {
              search: 'export function middleware',
              replace: 'export async function middleware',
            },
          ],
        },
      ],
    },
  }),
});
```

---

### 3. View Files Tool

**Purpose:** Read file contents (single or multiple files)

```typescript
// src/lib/tools/code/view-files-tool.ts

interface ViewFilesInput {
  paths: string[];           // Array of file paths
  includeMetadata?: boolean; // Include file size, modified date, etc.
  maxSize?: number;          // Max file size to read (bytes)
}

interface ViewFilesOutput {
  files: Array<{
    path: string;
    content: string;
    encoding: string;
    metadata?: {
      size: number;
      modified: Date;
      lines: number;
    };
  }>;
  errors?: Array<{
    path: string;
    reason: string;
  }>;
}

class ViewFilesTool extends BaseTool<ViewFilesInput, ViewFilesOutput> {
  metadata = {
    name: 'view_files',
    description: 'Read contents of one or more files',
    version: '1.0.0',
    category: 'code',
    costCredits: 1,
    rateLimit: 50,
  };
  
  inputSchema = z.object({
    paths: z.array(z.string().min(1)).min(1).max(20),
    includeMetadata: z.boolean().optional(),
    maxSize: z.number().positive().optional(),
  });
  
  outputSchema = z.object({
    files: z.array(z.object({
      path: z.string(),
      content: z.string(),
      encoding: z.string(),
      metadata: z.object({
        size: z.number(),
        modified: z.date(),
        lines: z.number(),
      }).optional(),
    })),
    errors: z.array(z.object({
      path: z.string(),
      reason: z.string(),
    })).optional(),
  });
  
  protected async run(
    params: ViewFilesInput, 
    projectId: string, 
    userId: string
  ): Promise<ViewFilesOutput> {
    const workspacePath = await this.getWorkspacePath(projectId);
    const files: ViewFilesOutput['files'] = [];
    const errors: ViewFilesOutput['errors'] = [];
    const maxSize = params.maxSize || 10 * 1024 * 1024; // 10MB default
    
    for (const filePath of params.paths) {
      const fullPath = path.join(workspacePath, filePath);
      
      // Validate path
      if (!fullPath.startsWith(workspacePath)) {
        errors.push({ path: filePath, reason: 'Invalid path (traversal attempt)' });
        continue;
      }
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        errors.push({ path: filePath, reason: 'File not found' });
        continue;
      }
      
      // Check file size
      const stats = await fs.promises.stat(fullPath);
      if (stats.size > maxSize) {
        errors.push({ 
          path: filePath, 
          reason: `File too large: ${stats.size} > ${maxSize} bytes` 
        });
        continue;
      }
      
      // Read file
      const content = await fs.promises.readFile(fullPath, 'utf8');
      
      const fileData: ViewFilesOutput['files'][0] = {
        path: filePath,
        content,
        encoding: 'utf8',
      };
      
      if (params.includeMetadata) {
        fileData.metadata = {
          size: stats.size,
          modified: stats.mtime,
          lines: content.split('\n').length,
        };
      }
      
      files.push(fileData);
    }
    
    return {
      files,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
```

---

## Testing Sub-Agent Interface

### 4. Run Tests Tool

**Purpose:** Execute tests (unit, integration, E2E) and parse results

```typescript
// src/lib/tools/test/run-tests-tool.ts

interface RunTestsInput {
  type: 'unit' | 'integration' | 'e2e';
  pattern?: string;          // e.g., '**/*.test.ts'
  specific?: string[];       // Specific test files
  watch?: boolean;           // Run in watch mode
  coverage?: boolean;        // Collect coverage
  timeout?: number;          // Test timeout (ms)
  env?: Record<string, string>;  // Environment variables
}

interface RunTestsOutput {
  success: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;  // milliseconds
  };
  failures?: Array<{
    testName: string;
    filePath: string;
    error: string;
    stackTrace: string;
    lineNumber?: number;
  }>;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  suggestions?: string[];  // AI-generated fix suggestions
}

class RunTestsTool extends BaseTool<RunTestsInput, RunTestsOutput> {
  metadata = {
    name: 'run_tests',
    description: 'Execute tests and return results',
    version: '1.0.0',
    category: 'test',
    costCredits: 2,
    rateLimit: 10,
  };
  
  inputSchema = z.object({
    type: z.enum(['unit', 'integration', 'e2e']),
    pattern: z.string().optional(),
    specific: z.array(z.string()).optional(),
    watch: z.boolean().optional(),
    coverage: z.boolean().optional(),
    timeout: z.number().positive().optional(),
    env: z.record(z.string()).optional(),
  });
  
  outputSchema = z.object({
    success: z.boolean(),
    summary: z.object({
      total: z.number(),
      passed: z.number(),
      failed: z.number(),
      skipped: z.number(),
      duration: z.number(),
    }),
    failures: z.array(z.object({
      testName: z.string(),
      filePath: z.string(),
      error: z.string(),
      stackTrace: z.string(),
      lineNumber: z.number().optional(),
    })).optional(),
    coverage: z.object({
      lines: z.number(),
      functions: z.number(),
      branches: z.number(),
      statements: z.number(),
    }).optional(),
    suggestions: z.array(z.string()).optional(),
  });
  
  protected async run(
    params: RunTestsInput, 
    projectId: string, 
    userId: string
  ): Promise<RunTestsOutput> {
    const workspacePath = await this.getWorkspacePath(projectId);
    
    // Detect test framework (Vitest, Jest, Playwright)
    const framework = await this.detectTestFramework(workspacePath);
    
    // Build test command
    const command = this.buildTestCommand(framework, params);
    
    // Execute tests
    const { stdout, stderr, exitCode } = await this.runCommand(
      workspacePath, 
      command, 
      params.env
    );
    
    // Parse test results
    const results = this.parseTestResults(framework, stdout, stderr);
    
    // If tests failed, generate fix suggestions
    if (!results.success && results.failures) {
      results.suggestions = await this.generateFixSuggestions(results.failures);
    }
    
    return results;
  }
  
  private async detectTestFramework(workspacePath: string): Promise<string> {
    const packageJson = JSON.parse(
      await fs.promises.readFile(path.join(workspacePath, 'package.json'), 'utf8')
    );
    
    if (packageJson.dependencies?.vitest || packageJson.devDependencies?.vitest) {
      return 'vitest';
    }
    if (packageJson.dependencies?.jest || packageJson.devDependencies?.jest) {
      return 'jest';
    }
    if (packageJson.dependencies?.['@playwright/test']) {
      return 'playwright';
    }
    
    throw new Error('No test framework detected');
  }
  
  private buildTestCommand(framework: string, params: RunTestsInput): string {
    switch (framework) {
      case 'vitest':
        let cmd = 'npx vitest run';
        if (params.watch) cmd = 'npx vitest';
        if (params.coverage) cmd += ' --coverage';
        if (params.pattern) cmd += ` ${params.pattern}`;
        if (params.specific) cmd += ` ${params.specific.join(' ')}`;
        return cmd;
        
      case 'jest':
        let jestCmd = 'npx jest';
        if (params.watch) jestCmd += ' --watch';
        if (params.coverage) jestCmd += ' --coverage';
        if (params.pattern) jestCmd += ` --testMatch="${params.pattern}"`;
        return jestCmd;
        
      case 'playwright':
        return `npx playwright test ${params.specific ? params.specific.join(' ') : ''}`;
        
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
  }
  
  private parseTestResults(
    framework: string, 
    stdout: string, 
    stderr: string
  ): RunTestsOutput {
    // Parse test output based on framework
    // This is a simplified example - real implementation would use regex parsing
    
    const lines = stdout.split('\n');
    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    };
    const failures: RunTestsOutput['failures'] = [];
    
    // Example parsing for Vitest
    if (framework === 'vitest') {
      for (const line of lines) {
        if (line.includes('Test Files')) {
          // Parse: "Test Files  2 passed (2)"
          const match = line.match(/(\d+) passed/);
          if (match) summary.passed = parseInt(match[1]);
        }
        if (line.includes('Tests')) {
          // Parse: "Tests  10 passed (10)"
          const match = line.match(/(\d+) passed \((\d+)\)/);
          if (match) {
            summary.passed = parseInt(match[1]);
            summary.total = parseInt(match[2]);
          }
        }
        if (line.includes('Duration')) {
          // Parse: "Duration  1.23s"
          const match = line.match(/([\d.]+)s/);
          if (match) summary.duration = parseFloat(match[1]) * 1000;
        }
      }
      
      // Parse failures (simplified)
      const failureMatch = stderr.match(/FAIL\s+(.+?)\s+(.+)/g);
      if (failureMatch) {
        for (const failure of failureMatch) {
          const [, filePath, testName] = failure.match(/FAIL\s+(.+?)\s+(.+)/) || [];
          failures.push({
            testName: testName || 'Unknown test',
            filePath: filePath || 'Unknown file',
            error: stderr,  // Simplified - should extract specific error
            stackTrace: stderr,
          });
        }
        summary.failed = failures.length;
      }
    }
    
    summary.total = summary.passed + summary.failed + summary.skipped;
    
    return {
      success: summary.failed === 0,
      summary,
      failures: failures.length > 0 ? failures : undefined,
    };
  }
  
  private async generateFixSuggestions(
    failures: NonNullable<RunTestsOutput['failures']>
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    for (const failure of failures) {
      // Use AI to analyze failure and suggest fix
      const prompt = `
        Test failed with error:
        ${failure.error}
        
        Stack trace:
        ${failure.stackTrace}
        
        Suggest a specific fix for this test failure.
      `;
      
      const aiResponse = await this.callAI(prompt);
      suggestions.push(aiResponse);
    }
    
    return suggestions;
  }
}
```

---

## Integration Executor Interface

### 5. Integration Tool (Shopify Example)

```typescript
// src/lib/tools/integration/shopify-tool.ts

interface ShopifyToolInput {
  action: 'create_product' | 'update_product' | 'delete_product' | 'get_orders';
  params: any;  // Action-specific parameters
}

interface ShopifyToolOutput {
  success: boolean;
  data: any;
}

class ShopifyTool extends BaseTool<ShopifyToolInput, ShopifyToolOutput> {
  metadata = {
    name: 'shopify_integration',
    description: 'Interact with Shopify API',
    version: '1.0.0',
    category: 'integration',
    costCredits: 3,
    rateLimit: 30,
  };
  
  inputSchema = z.object({
    action: z.enum(['create_product', 'update_product', 'delete_product', 'get_orders']),
    params: z.any(),
  });
  
  outputSchema = z.object({
    success: z.boolean(),
    data: z.any(),
  });
  
  protected async run(
    params: ShopifyToolInput, 
    projectId: string, 
    userId: string
  ): Promise<ShopifyToolOutput> {
    // Get Shopify credentials from secrets manager
    const credentials = await this.getIntegrationCredentials(projectId, 'shopify');
    
    if (!credentials) {
      throw new Error('Shopify integration not configured for this project');
    }
    
    const shopifyClient = new ShopifyAPI({
      shopDomain: credentials.shopDomain,
      accessToken: credentials.accessToken,
    });
    
    // Execute action
    switch (params.action) {
      case 'create_product':
        const product = await shopifyClient.createProduct(params.params);
        return { success: true, data: product };
        
      case 'get_orders':
        const orders = await shopifyClient.getOrders(params.params);
        return { success: true, data: orders };
        
      // ... other actions
        
      default:
        throw new Error(`Unsupported action: ${params.action}`);
    }
  }
  
  private async getIntegrationCredentials(projectId: string, service: string) {
    const integration = await db.integrations.findFirst({
      where: { projectId, service },
    });
    
    if (!integration) return null;
    
    // Decrypt credentials
    const decrypted = await decrypt(integration.credentialsEncrypted);
    return JSON.parse(decrypted);
  }
}
```

---

## Image Sub-Agent Interface

### 6. Generate Image Tool

```typescript
// src/lib/tools/image/generate-image-tool.ts

interface GenerateImageInput {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'realistic' | 'artistic' | 'minimalist' | 'vivid' | 'natural';
  model?: 'dall-e-3' | 'dall-e-2' | 'stable-diffusion';
  saveTo?: string;  // Path to save image in workspace
  uploadCDN?: boolean;  // Upload to CDN and return URL
}

interface GenerateImageOutput {
  imageUrl: string;  // Temporary URL (expires after 1 hour)
  localPath?: string;  // Path in workspace
  cdnUrl?: string;  // Permanent CDN URL
  prompt: string;  // Used prompt (may be revised by AI)
  revisedPrompt?: string;  // AI-revised prompt (DALL-E 3)
}

class GenerateImageTool extends BaseTool<GenerateImageInput, GenerateImageOutput> {
  metadata = {
    name: 'generate_image',
    description: 'Generate images using AI models',
    version: '1.0.0',
    category: 'image',
    costCredits: 10,
    rateLimit: 5,
  };
  
  inputSchema = z.object({
    prompt: z.string().min(1).max(1000),
    size: z.enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']).optional(),
    style: z.enum(['realistic', 'artistic', 'minimalist', 'vivid', 'natural']).optional(),
    model: z.enum(['dall-e-3', 'dall-e-2', 'stable-diffusion']).optional(),
    saveTo: z.string().optional(),
    uploadCDN: z.boolean().optional(),
  });
  
  outputSchema = z.object({
    imageUrl: z.string(),
    localPath: z.string().optional(),
    cdnUrl: z.string().optional(),
    prompt: z.string(),
    revisedPrompt: z.string().optional(),
  });
  
  protected async run(
    params: GenerateImageInput, 
    projectId: string, 
    userId: string
  ): Promise<GenerateImageOutput> {
    const model = params.model || 'dall-e-3';
    
    // Generate image
    let imageUrl: string;
    let revisedPrompt: string | undefined;
    
    if (model === 'dall-e-3' || model === 'dall-e-2') {
      const response = await openai.images.generate({
        model: model,
        prompt: params.prompt,
        size: params.size || '1024x1024',
        quality: params.style === 'realistic' ? 'hd' : 'standard',
        style: params.style === 'vivid' ? 'vivid' : 'natural',
      });
      
      imageUrl = response.data[0].url!;
      revisedPrompt = response.data[0].revised_prompt;
    } else {
      // Stable Diffusion implementation
      imageUrl = await this.generateWithStableDiffusion(params.prompt, params.size);
    }
    
    const result: GenerateImageOutput = {
      imageUrl,
      prompt: params.prompt,
      revisedPrompt,
    };
    
    // Save to workspace
    if (params.saveTo) {
      const workspacePath = await this.getWorkspacePath(projectId);
      const fullPath = path.join(workspacePath, params.saveTo);
      
      // Download image
      const imageBuffer = await this.downloadImage(imageUrl);
      await fs.promises.writeFile(fullPath, imageBuffer);
      
      result.localPath = params.saveTo;
    }
    
    // Upload to CDN
    if (params.uploadCDN) {
      const imageBuffer = await this.downloadImage(imageUrl);
      const cdnUrl = await this.uploadToCDN(imageBuffer, projectId);
      result.cdnUrl = cdnUrl;
    }
    
    return result;
  }
  
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  
  private async uploadToCDN(buffer: Buffer, projectId: string): Promise<string> {
    const filename = `${projectId}/${Date.now()}.png`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('generated-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        cacheControl: '31536000',  // 1 year
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filename);
    
    return publicUrl;
  }
}
```

---

## Human Interaction Interface

### 7. Ask Human Tool

```typescript
// src/lib/tools/human/ask-human-tool.ts

interface AskHumanInput {
  question: string;
  type: 'text' | 'confirm' | 'select';
  options?: string[];  // For 'select' type
  timeout?: number;  // Seconds to wait for response
  defaultValue?: string;  // Fallback if no response
  required?: boolean;
}

interface AskHumanOutput {
  answer: string;
  timestamp: Date;
  timedOut: boolean;
}

class AskHumanTool extends BaseTool<AskHumanInput, AskHumanOutput> {
  metadata = {
    name: 'ask_human',
    description: 'Request input or confirmation from user',
    version: '1.0.0',
    category: 'human',
    costCredits: 0,  // Free
    rateLimit: 20,
  };
  
  inputSchema = z.object({
    question: z.string().min(1).max(500),
    type: z.enum(['text', 'confirm', 'select']),
    options: z.array(z.string()).optional(),
    timeout: z.number().positive().max(300).optional(),  // Max 5 minutes
    defaultValue: z.string().optional(),
    required: z.boolean().optional(),
  });
  
  outputSchema = z.object({
    answer: z.string(),
    timestamp: z.date(),
    timedOut: z.boolean(),
  });
  
  protected async run(
    params: AskHumanInput, 
    projectId: string, 
    userId: string
  ): Promise<AskHumanOutput> {
    // Create a pending human input request
    const request = await db.humanInputRequests.create({
      data: {
        projectId,
        userId,
        question: params.question,
        type: params.type,
        options: params.options,
        status: 'pending',
        createdAt: new Date(),
      },
    });
    
    // Send real-time notification to user
    await this.notifyUser(userId, {
      type: 'human_input_required',
      requestId: request.id,
      question: params.question,
      options: params.options,
    });
    
    // Wait for response
    const timeout = (params.timeout || 60) * 1000;  // Default 60 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const updated = await db.humanInputRequests.findUnique({
        where: { id: request.id },
      });
      
      if (updated?.status === 'answered') {
        return {
          answer: updated.answer!,
          timestamp: updated.answeredAt!,
          timedOut: false,
        };
      }
      
      // Poll every second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Timeout reached
    if (params.required && !params.defaultValue) {
      throw new Error('Required human input not received');
    }
    
    return {
      answer: params.defaultValue || '',
      timestamp: new Date(),
      timedOut: true,
    };
  }
  
  private async notifyUser(userId: string, notification: any) {
    // Send via WebSocket, SSE, or push notification
    await pusher.trigger(`user-${userId}`, 'human-input-required', notification);
  }
}

// Frontend component to handle human input requests
// src/components/HumanInputDialog.tsx
```

---

## Database Sub-Agent Interface

### 8. Database Migration Tool

```typescript
// src/lib/tools/database/migration-tool.ts

interface MigrationToolInput {
  action: 'create' | 'apply' | 'rollback' | 'status';
  name?: string;  // For 'create'
  sql?: string;  // For 'create'
  steps?: number;  // For 'rollback'
}

interface MigrationToolOutput {
  success: boolean;
  migrations?: Array<{
    id: string;
    name: string;
    appliedAt?: Date;
    status: 'pending' | 'applied';
  }>;
  message?: string;
}

class MigrationTool extends BaseTool<MigrationToolInput, MigrationToolOutput> {
  metadata = {
    name: 'database_migration',
    description: 'Manage database schema migrations',
    version: '1.0.0',
    category: 'database',
    costCredits: 5,
    rateLimit: 10,
  };
  
  inputSchema = z.object({
    action: z.enum(['create', 'apply', 'rollback', 'status']),
    name: z.string().optional(),
    sql: z.string().optional(),
    steps: z.number().positive().optional(),
  });
  
  outputSchema = z.object({
    success: z.boolean(),
    migrations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      appliedAt: z.date().optional(),
      status: z.enum(['pending', 'applied']),
    })).optional(),
    message: z.string().optional(),
  });
  
  protected async run(
    params: MigrationToolInput, 
    projectId: string, 
    userId: string
  ): Promise<MigrationToolOutput> {
    const dbConfig = await this.getDatabaseConfig(projectId);
    
    switch (params.action) {
      case 'create':
        return await this.createMigration(projectId, params.name!, params.sql!);
        
      case 'apply':
        return await this.applyMigrations(projectId, dbConfig);
        
      case 'rollback':
        return await this.rollbackMigrations(projectId, dbConfig, params.steps || 1);
        
      case 'status':
        return await this.getMigrationStatus(projectId, dbConfig);
        
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }
  }
  
  private async createMigration(
    projectId: string, 
    name: string, 
    sql: string
  ): Promise<MigrationToolOutput> {
    const workspacePath = await this.getWorkspacePath(projectId);
    const migrationsDir = path.join(workspacePath, 'migrations');
    
    // Create migrations directory if it doesn't exist
    await fs.promises.mkdir(migrationsDir, { recursive: true });
    
    // Generate migration file
    const timestamp = Date.now();
    const filename = `${timestamp}_${name}.sql`;
    const fullPath = path.join(migrationsDir, filename);
    
    await fs.promises.writeFile(fullPath, sql, 'utf8');
    
    return {
      success: true,
      message: `Migration created: ${filename}`,
    };
  }
  
  private async applyMigrations(
    projectId: string, 
    dbConfig: any
  ): Promise<MigrationToolOutput> {
    const workspacePath = await this.getWorkspacePath(projectId);
    const migrationsDir = path.join(workspacePath, 'migrations');
    
    // Get all migration files
    const files = await fs.promises.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    // Get applied migrations from database
    const appliedMigrations = await this.getAppliedMigrations(projectId, dbConfig);
    const appliedIds = new Set(appliedMigrations.map(m => m.id));
    
    // Apply pending migrations
    for (const file of sqlFiles) {
      if (appliedIds.has(file)) continue;
      
      const sql = await fs.promises.readFile(
        path.join(migrationsDir, file), 
        'utf8'
      );
      
      await this.executeSql(dbConfig, sql);
      await this.recordMigration(projectId, dbConfig, file);
    }
    
    return {
      success: true,
      message: `Applied ${sqlFiles.length - appliedIds.size} migrations`,
    };
  }
}
```

---

## Deployment Tools

### 9. Deploy Tool

```typescript
// src/lib/tools/deployment/deploy-tool.ts

interface DeployToolInput {
  target: 'vercel' | 'netlify' | 'custom';
  buildCommand?: string;
  outputDir?: string;
  envVars?: Record<string, string>;
  domain?: string;
}

interface DeployToolOutput {
  success: boolean;
  deploymentUrl: string;
  buildLogs?: string;
  deploymentId: string;
}

class DeployTool extends BaseTool<DeployToolInput, DeployToolOutput> {
  metadata = {
    name: 'deploy',
    description: 'Deploy project to production',
    version: '1.0.0',
    category: 'deployment',
    costCredits: 20,
    rateLimit: 5,
  };
  
  protected async run(
    params: DeployToolInput, 
    projectId: string, 
    userId: string
  ): Promise<DeployToolOutput> {
    const workspacePath = await this.getWorkspacePath(projectId);
    
    // 1. Build project
    const buildCommand = params.buildCommand || 'npm run build';
    const { stdout: buildLogs } = await this.runCommand(workspacePath, buildCommand);
    
    // 2. Deploy to target
    switch (params.target) {
      case 'vercel':
        return await this.deployToVercel(projectId, workspacePath, params, buildLogs);
        
      case 'netlify':
        return await this.deployToNetlify(projectId, workspacePath, params, buildLogs);
        
      case 'custom':
        return await this.deployToCustom(projectId, workspacePath, params, buildLogs);
        
      default:
        throw new Error(`Unsupported deployment target: ${params.target}`);
    }
  }
  
  private async deployToVercel(
    projectId: string, 
    workspacePath: string, 
    params: DeployToolInput,
    buildLogs: string
  ): Promise<DeployToolOutput> {
    // Vercel CLI deployment
    const { stdout } = await this.runCommand(
      workspacePath, 
      'vercel --prod --yes',
      params.envVars
    );
    
    // Parse deployment URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    const deploymentUrl = urlMatch ? urlMatch[0] : '';
    
    // Record deployment
    const deployment = await db.projectDeployments.create({
      data: {
        projectId,
        target: 'vercel',
        url: deploymentUrl,
        status: 'success',
        buildLogs,
        deployedAt: new Date(),
      },
    });
    
    return {
      success: true,
      deploymentUrl,
      buildLogs,
      deploymentId: deployment.id,
    };
  }
}
```

---

## Monitoring & Analytics Tools

### 10. Monitoring Tool

```typescript
// src/lib/tools/monitoring/monitoring-tool.ts

interface MonitoringToolInput {
  action: 'uptime' | 'errors' | 'performance' | 'users';
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

interface MonitoringToolOutput {
  success: boolean;
  data: any;
}

class MonitoringTool extends BaseTool<MonitoringToolInput, MonitoringToolOutput> {
  metadata = {
    name: 'monitoring',
    description: 'Get monitoring data for deployed project',
    version: '1.0.0',
    category: 'monitoring',
    costCredits: 1,
    rateLimit: 30,
  };
  
  protected async run(
    params: MonitoringToolInput, 
    projectId: string, 
    userId: string
  ): Promise<MonitoringToolOutput> {
    switch (params.action) {
      case 'uptime':
        return await this.getUptimeData(projectId, params.timeRange);
        
      case 'errors':
        return await this.getErrorData(projectId, params.timeRange);
        
      case 'performance':
        return await this.getPerformanceData(projectId, params.timeRange);
        
      case 'users':
        return await this.getUserAnalytics(projectId, params.timeRange);
        
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }
  }
}
```

---

## Error Handling & Retry Logic

### Retry Strategy

```typescript
// src/lib/tools/retry.ts

interface RetryOptions {
  maxRetries: number;
  backoff: 'exponential' | 'linear';
  initialDelay: number;  // milliseconds
  maxDelay: number;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
  }
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error instanceof PermissionError || error instanceof ValidationError) {
        throw error;
      }
      
      // Calculate delay
      let delay = options.initialDelay;
      if (options.backoff === 'exponential') {
        delay = Math.min(options.initialDelay * Math.pow(2, attempt), options.maxDelay);
      } else {
        delay = Math.min(options.initialDelay * (attempt + 1), options.maxDelay);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Usage in tools
protected async run(params: TInput, projectId: string, userId: string): Promise<TOutput> {
  return await withRetry(() => this.executeLogic(params, projectId, userId), {
    maxRetries: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
  });
}
```

---

## API Security

### Authentication & Authorization

```typescript
// src/middleware/auth.ts

export async function authenticateToolRequest(req: Request): Promise<AuthContext> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new UnauthorizedError('No authentication token provided');
  }
  
  // Verify JWT
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new UnauthorizedError('Invalid authentication token');
  }
  
  return {
    userId: user.id,
    email: user.email!,
  };
}

export async function authorizeProjectAccess(
  userId: string, 
  projectId: string
): Promise<void> {
  const hasAccess = await db.projectMembers.exists({
    where: { userId, projectId }
  });
  
  if (!hasAccess) {
    throw new ForbiddenError('User does not have access to this project');
  }
}
```

### Rate Limiting

```typescript
// src/middleware/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests per minute
});

export async function checkRateLimit(userId: string, toolName: string): Promise<void> {
  const key = `rate_limit:${userId}:${toolName}`;
  const { success, remaining } = await rateLimiter.limit(key);
  
  if (!success) {
    throw new RateLimitError(`Rate limit exceeded. Try again later. (${remaining} remaining)`);
  }
}
```

### Input Validation

All tool inputs are validated using Zod schemas before execution. This prevents:
- SQL injection
- Path traversal
- XSS attacks
- Invalid data types
- Out-of-range values

---

## Conclusion

The Tool API provides a standardized, secure, and extensible interface for the Main Agent to interact with various sub-agents and external services. Key features:

1. **Type Safety** - Full TypeScript + Zod validation
2. **Error Handling** - Structured errors with actionable suggestions
3. **Rate Limiting** - Prevent abuse and manage costs
4. **Audit Logging** - All tool calls logged
5. **Retry Logic** - Automatic retries with backoff
6. **Authentication** - JWT-based auth with project-level authorization
7. **Credit System** - Usage-based billing with credit deduction

---

**Next Steps:**
1. Implement core tools (bulk write, bulk edit, view files)
2. Implement testing sub-agent
3. Implement integration sub-agents (Shopify, Stripe)
4. Implement human interaction tool
5. Create frontend UI components for human input dialogs
6. Add comprehensive error handling and logging
7. Write integration tests for all tools

---

**Document Maintained By:** MO (CTO/Tech Architect)  
**Last Updated:** February 18, 2025  
**Status:** Ready for Implementation
