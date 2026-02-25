/**
 * Code Agent - Code Operations Subagent
 * 
 * Handles bulk file writes, edits, reading, and deployment
 * triggers for the Emergent orchestrator.
 * 
 * @module emergent/subagents/code-agent
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'

import type { SubAgentRequest, ToolResponse, BulkWriteParams, BulkEditParams, ViewFilesParams, DeployParams } from '../agent-types'
import { ValidationError } from '../agent-types'
import { getWorkspaceDir, ensureWorkspace, validatePath } from '@/lib/code-execution/sandbox'

/**
 * Execute code agent
 * 
 * @param request - Subagent request
 * @returns Tool response with operation results
 */
export async function executeCodeAgent(
  request: SubAgentRequest
): Promise<ToolResponse> {
  const tool = request.params.tool as string

  try {
    switch (tool) {
      case 'bulk-write':
        return await handleBulkWrite(request)
      case 'bulk-edit':
        return await handleBulkEdit(request)
      case 'view-files':
        return await handleViewFiles(request)
      case 'deploy':
        return await handleDeploy(request)
      default:
        throw new ValidationError(`Unknown code tool: ${tool}`)
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Code agent execution failed',
    }
  }
}

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Write multiple files to the workspace
 */
async function handleBulkWrite(request: SubAgentRequest): Promise<ToolResponse> {
  const params = request.params as unknown as BulkWriteParams

  if (!params.files || !Array.isArray(params.files) || params.files.length === 0) {
    throw new ValidationError('files array is required and must not be empty')
  }

  const workspaceDir = await ensureWorkspace(request.projectId)
  const written: string[] = []

  for (const file of params.files) {
    if (!file.path || typeof file.path !== 'string') {
      throw new ValidationError('Each file must have a valid path')
    }
    if (typeof file.content !== 'string') {
      throw new ValidationError(`Content must be a string for file: ${file.path}`)
    }

    const pathCheck = validatePath(file.path, workspaceDir)
    if (!pathCheck.allowed) {
      throw new ValidationError(pathCheck.reason || 'Invalid file path')
    }

    const fullPath = join(workspaceDir, file.path)
    await mkdir(dirname(fullPath), { recursive: true })
    await writeFile(fullPath, file.content, 'utf-8')
    written.push(file.path)
  }

  return {
    success: true,
    data: { filesWritten: written, count: written.length },
    error: null,
    metadata: { projectId: request.projectId },
  }
}

/**
 * Edit multiple files via find & replace
 */
async function handleBulkEdit(request: SubAgentRequest): Promise<ToolResponse> {
  const params = request.params as unknown as BulkEditParams

  if (!params.edits || !Array.isArray(params.edits) || params.edits.length === 0) {
    throw new ValidationError('edits array is required and must not be empty')
  }

  const workspaceDir = getWorkspaceDir(request.projectId)
  const results: Array<{ path: string; applied: boolean; reason?: string }> = []

  for (const edit of params.edits) {
    if (!edit.path || typeof edit.path !== 'string') {
      throw new ValidationError('Each edit must have a valid path')
    }

    const pathCheck = validatePath(edit.path, workspaceDir)
    if (!pathCheck.allowed) {
      throw new ValidationError(pathCheck.reason || 'Invalid file path')
    }

    const fullPath = join(workspaceDir, edit.path)

    try {
      const content = await readFile(fullPath, 'utf-8')

      if (!content.includes(edit.oldContent)) {
        results.push({ path: edit.path, applied: false, reason: 'oldContent not found' })
        continue
      }

      const updated = content.replace(edit.oldContent, edit.newContent)
      await writeFile(fullPath, updated, 'utf-8')
      results.push({ path: edit.path, applied: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      results.push({ path: edit.path, applied: false, reason: msg })
    }
  }

  const appliedCount = results.filter(r => r.applied).length

  return {
    success: appliedCount > 0,
    data: { edits: results, applied: appliedCount, total: params.edits.length },
    error: appliedCount === 0 ? 'No edits were applied' : null,
    metadata: { projectId: request.projectId },
  }
}

/**
 * Read file contents from the workspace
 */
async function handleViewFiles(request: SubAgentRequest): Promise<ToolResponse> {
  const params = request.params as unknown as ViewFilesParams

  if (!params.paths || !Array.isArray(params.paths) || params.paths.length === 0) {
    throw new ValidationError('paths array is required and must not be empty')
  }

  const workspaceDir = getWorkspaceDir(request.projectId)
  const files: Array<{ path: string; content: string | null; error?: string }> = []

  for (const filePath of params.paths) {
    if (!filePath || typeof filePath !== 'string') {
      files.push({ path: filePath, content: null, error: 'Invalid path' })
      continue
    }

    const pathCheck = validatePath(filePath, workspaceDir)
    if (!pathCheck.allowed) {
      files.push({ path: filePath, content: null, error: pathCheck.reason })
      continue
    }

    const fullPath = join(workspaceDir, filePath)

    try {
      const content = await readFile(fullPath, 'utf-8')
      files.push({ path: filePath, content })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'File not found'
      files.push({ path: filePath, content: null, error: msg })
    }
  }

  const readCount = files.filter(f => f.content !== null).length

  return {
    success: readCount > 0,
    data: { files, read: readCount, total: params.paths.length },
    error: readCount === 0 ? 'No files could be read' : null,
    metadata: { projectId: request.projectId },
  }
}

/**
 * Trigger a deployment via the internal deploy API
 */
async function handleDeploy(request: SubAgentRequest): Promise<ToolResponse> {
  const params = request.params as unknown as DeployParams

  const validEnvironments = ['preview', 'production']
  if (!params.environment || !validEnvironments.includes(params.environment)) {
    throw new ValidationError(`environment must be one of: ${validEnvironments.join(', ')}`)
  }

  try {
    const response = await fetch('http://localhost:3000/api/emergent/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: request.projectId,
        environment: params.environment,
        version: params.version || null,
      }),
    })

    const body = await response.json()

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: body.error || `Deploy API returned ${response.status}`,
        metadata: { statusCode: response.status, projectId: request.projectId },
      }
    }

    return {
      success: true,
      data: body.data || body,
      error: null,
      metadata: {
        environment: params.environment,
        version: params.version || null,
        projectId: request.projectId,
      },
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Deploy request failed'
    return {
      success: false,
      data: null,
      error: `Deploy failed: ${msg}`,
      metadata: { projectId: request.projectId, environment: params.environment },
    }
  }
}
