/**
 * Terminal API
 * Executes sandboxed shell commands inside per-workspace directories.
 *
 * POST – Run a command in the workspace sandbox.
 * GET  – Returns 501 because Next.js cannot upgrade HTTP to WebSocket here.
 */

import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  sanitizeCommand,
  ensureWorkspace,
  getSandboxExecOptions,
} from '@/lib/code-execution/sandbox';

const execAsync = promisify(exec);

/** Force Node.js runtime so child_process is available. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get('upgrade');

  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  return new Response(
    JSON.stringify({
      error: 'WebSocket terminal requires a dedicated WebSocket server',
      message: 'Terminal WebSocket endpoint - requires node-pty backend server',
      status: 'not_implemented',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// POST – Execute a terminal command inside a sandboxed workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, command } = body;

    // ── 1. Input validation ────────────────────────────────────────────
    if (!workspaceId || !command) {
      return new Response(
        JSON.stringify({ error: 'Missing workspaceId or command' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (typeof workspaceId !== 'string' || typeof command !== 'string') {
      return new Response(
        JSON.stringify({ error: 'workspaceId and command must be strings' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 2. Sanitize the command via sandbox rules ──────────────────────
    const sanitization = sanitizeCommand(command);

    if (!sanitization.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Command not allowed',
          reason: sanitization.reason,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 3. Prepare workspace & execution options ───────────────────────
    const workspacePath = await ensureWorkspace(workspaceId);
    const execOptions = getSandboxExecOptions({ sessionId: workspaceId });

    // Override cwd to the resolved workspace path
    const options = { ...execOptions, cwd: workspacePath };

    // Use the sanitised form when available, otherwise the original command
    const cmdToRun = sanitization.sanitizedCommand ?? command;

    // ── 4. Execute ─────────────────────────────────────────────────────
    const { stdout, stderr } = await execAsync(cmdToRun, options);

    return new Response(
      JSON.stringify({
        success: true,
        exitCode: 0,
        stdout: stdout ?? '',
        stderr: stderr ?? '',
        workspaceId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    // ── 5. Error handling ──────────────────────────────────────────────
    const execErr = error as {
      killed?: boolean;
      code?: number | string;
      signal?: string;
      stdout?: string;
      stderr?: string;
      message?: string;
    };

    // Timeout / SIGTERM
    if (execErr.killed || execErr.signal === 'SIGTERM') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Command timed out',
          exitCode: 124,
          stdout: execErr.stdout ?? '',
          stderr: execErr.stderr ?? '',
        }),
        { status: 408, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Non-zero exit code (command ran but failed)
    if (typeof execErr.code === 'number') {
      return new Response(
        JSON.stringify({
          success: false,
          exitCode: execErr.code,
          stdout: execErr.stdout ?? '',
          stderr: execErr.stderr ?? '',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Unexpected / parse errors
    console.error('Terminal command execution error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to execute command',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
