/**
 * Code Agent - File System Subagent
 *
 * Provides the AI's "hands" inside the workspace. Handles reading and
 * writing project files (bulk-write, bulk-edit, view-files) and
 * orchestrates deployment (deploy). All file operations are sandboxed to
 * a per-project workspace directory so the agent can never escape its
 * container.
 *
 * @module emergent/subagents/code-agent
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'

import type {
  SubAgentRequest,
  ToolResponse,
  BulkWriteParams,
  BulkEditParams,
  ViewFilesParams,
  DeployParams,
} from '../agent-types'
import { ValidationError } from '../agent-types'
import { ensureWorkspace, validatePath } from '@/lib/code-execution/sandbox'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve and validate a relative path against the workspace root. */
function resolveSafe(
  filePath: string,
  workspaceDir: string
): { allowed: false; reason: string } | { allowed: true; resolved: string } {
  const result = validatePath(filePath, workspaceDir)
  if (!result.allowed) {
    return { allowed: false, reason: result.reason ?? 'Invalid path' }
  }
  return { allowed: true, resolved: result.sanitizedCommand as string }
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/**
 * Write one or more files to the workspace in a single operation.
 * Creates parent directories as needed.
 */
async function bulkWrite(
  projectId: string,
  params: BulkWriteParams
): Promise<ToolResponse> {
  if (!Array.isArray(params.files) || params.files.length === 0) {
    throw new ValidationError('bulk-write requires at least one file')
  }

  const workspaceDir = await ensureWorkspace(projectId)
  const written: string[] = []
  const errors: Array<{ path: string; error: string }> = []

  for (const { path: filePath, content } of params.files) {
    const check = resolveSafe(filePath, workspaceDir)
    if (!check.allowed) {
      errors.push({ path: filePath, error: check.reason })
      continue
    }

    try {
      await mkdir(dirname(check.resolved), { recursive: true })
      await writeFile(check.resolved, content, 'utf-8')
      written.push(filePath)
    } catch (err) {
      errors.push({
        path: filePath,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const success = errors.length === 0
  return {
    success,
    data: { written, errors, workspaceDir },
    error: success
      ? null
      : `${errors.length} file(s) failed to write: ${errors.map((e) => e.path).join(', ')}`,
    metadata: {
      filesWritten: written.length,
      filesFailed: errors.length,
    },
  }
}

/**
 * Apply find-and-replace edits to existing workspace files.
 * Each edit must supply the exact `oldContent` to be replaced by `newContent`.
 */
async function bulkEdit(
  projectId: string,
  params: BulkEditParams
): Promise<ToolResponse> {
  if (!Array.isArray(params.edits) || params.edits.length === 0) {
    throw new ValidationError('bulk-edit requires at least one edit')
  }

  const workspaceDir = await ensureWorkspace(projectId)
  const applied: string[] = []
  const errors: Array<{ path: string; error: string }> = []

  for (const { path: filePath, oldContent, newContent } of params.edits) {
    const check = resolveSafe(filePath, workspaceDir)
    if (!check.allowed) {
      errors.push({ path: filePath, error: check.reason })
      continue
    }

    try {
      const original = await readFile(check.resolved, 'utf-8')

      if (!original.includes(oldContent)) {
        errors.push({
          path: filePath,
          error: `oldContent not found in ${filePath}`,
        })
        continue
      }

      // Replace ALL occurrences of oldContent with newContent
      const updated = original.split(oldContent).join(newContent)
      await writeFile(check.resolved, updated, 'utf-8')
      applied.push(filePath)
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      errors.push({
        path: filePath,
        error: code === 'ENOENT' ? `File not found: ${filePath}` : (err instanceof Error ? err.message : String(err)),
      })
    }
  }

  const success = errors.length === 0
  return {
    success,
    data: { applied, errors, workspaceDir },
    error: success
      ? null
      : `${errors.length} edit(s) failed: ${errors.map((e) => e.path).join(', ')}`,
    metadata: {
      editsApplied: applied.length,
      editsFailed: errors.length,
    },
  }
}

/**
 * Read one or more files from the workspace and return their contents.
 */
async function viewFiles(
  projectId: string,
  params: ViewFilesParams
): Promise<ToolResponse> {
  if (!Array.isArray(params.paths) || params.paths.length === 0) {
    throw new ValidationError('view-files requires at least one path')
  }

  const workspaceDir = await ensureWorkspace(projectId)
  const files: Record<string, string> = {}
  const errors: Array<{ path: string; error: string }> = []

  for (const filePath of params.paths) {
    const check = resolveSafe(filePath, workspaceDir)
    if (!check.allowed) {
      errors.push({ path: filePath, error: check.reason })
      continue
    }

    try {
      files[filePath] = await readFile(check.resolved, 'utf-8')
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      errors.push({
        path: filePath,
        error: code === 'ENOENT' ? `File not found: ${filePath}` : (err instanceof Error ? err.message : String(err)),
      })
    }
  }

  return {
    success: errors.length === 0,
    data: { files, errors, workspaceDir },
    error:
      errors.length > 0
        ? `${errors.length} file(s) could not be read: ${errors.map((e) => e.path).join(', ')}`
        : null,
    metadata: { filesRead: Object.keys(files).length, filesFailed: errors.length },
  }
}

/**
 * Initiate a deployment for the project.
 *
 * If a VERCEL_TOKEN is present, the internal deploy API is called.
 * Otherwise the agent returns actionable instructions so a human (or the
 * deploy route) can complete the step.
 */
async function deployProject(
  projectId: string,
  params: DeployParams
): Promise<ToolResponse> {
  const environment = params.environment ?? 'production'
  const vercelToken = process.env.VERCEL_TOKEN

  if (!vercelToken) {
    return {
      success: false,
      data: null,
      error:
        'VERCEL_TOKEN is not configured. Set the VERCEL_TOKEN environment variable to enable deployments.',
      metadata: { projectId, environment, action: 'deploy' },
    }
  }

  // Delegate to the deploy API route (reuse the same Vercel integration)
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/emergent/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, environment }),
    })

    const data = (await res.json()) as any

    return {
      success: res.ok && data.success,
      data: data.deployment ?? null,
      error: res.ok ? null : data.error ?? `Deploy API returned ${res.status}`,
      metadata: { projectId, environment },
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Deploy request failed',
      metadata: { projectId, environment },
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Execute the code agent for a given tool request.
 *
 * Supported tools (via `request.type`): bulk-write, bulk-edit, view-files, deploy.
 */
export async function executeCodeAgent(
  request: SubAgentRequest
): Promise<ToolResponse> {
  try {
    const tool = (request.params as any).__tool as string | undefined

    switch (tool ?? request.type) {
      case 'bulk-write':
        return await bulkWrite(request.projectId, request.params as unknown as BulkWriteParams)

      case 'bulk-edit':
        return await bulkEdit(request.projectId, request.params as unknown as BulkEditParams)

      case 'view-files':
        return await viewFiles(request.projectId, request.params as unknown as ViewFilesParams)

      case 'deploy':
        return await deployProject(request.projectId, request.params as unknown as DeployParams)

      default:
        return {
          success: false,
          data: null,
          error: `Code agent does not handle tool: ${tool ?? request.type}`,
        }
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Code agent execution failed',
    }
  }
}
