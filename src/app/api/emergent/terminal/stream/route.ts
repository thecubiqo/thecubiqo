/**
 * SSE Terminal Streaming API
 *
 * Streams real-time terminal output from long-running commands via
 * Server-Sent Events. This is the serverless-compatible alternative to
 * WebSocket-based terminal access — Next.js API routes can't hold WS
 * connections, but they CAN stream SSE responses.
 *
 * POST /api/emergent/terminal/stream
 *   Body: { workspaceId: string; command: string; timeout?: number }
 *
 * Event types sent to the client:
 *   stdout  – a chunk of standard output text
 *   stderr  – a chunk of standard error text
 *   exit    – JSON payload with { exitCode: number | null }
 *   error   – a human-readable error message
 *
 * Security:
 *   - Supabase auth guard (session required)
 *   - Command sanitization via sandbox utilities
 *   - Workspace isolation per session
 *   - Timeout protection (default 60 s, capped at 120 s)
 */

import { spawn } from 'child_process';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sanitizeCommand,
  ensureWorkspace,
  getSandboxExecOptions,
} from '@/lib/code-execution/sandbox';

// ── Runtime directives ─────────────────────────────────────────────────
/** Force Node.js runtime so child_process is available in Vercel. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Constants ──────────────────────────────────────────────────────────
const DEFAULT_TIMEOUT_S = 60;
const MAX_TIMEOUT_S = 120;

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Encode a single SSE frame.
 *
 * @param event  – the event type the client listens for
 * @param data   – the data payload (will be stringified if it isn't already)
 */
function sseFrame(event: string, data: string): string {
  // SSE spec: each field on its own line, terminated by a blank line.
  // Multi-line data values require each line to be prefixed with "data: ".
  const lines = data.split('\n');
  const dataLines = lines.map((line) => `data: ${line}`).join('\n');
  return `event: ${event}\n${dataLines}\n\n`;
}

// ── Route handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 1. Authenticate ────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── 2. Parse & validate body ───────────────────────────────────────
  let body: { workspaceId?: unknown; command?: unknown; timeout?: unknown };

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { workspaceId, command, timeout: rawTimeout } = body;

  if (!workspaceId || !command) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing workspaceId or command' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (typeof workspaceId !== 'string' || typeof command !== 'string') {
    return new Response(
      JSON.stringify({ success: false, error: 'workspaceId and command must be strings' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Clamp timeout to [1, MAX_TIMEOUT_S]
  const timeout = Math.max(
    1,
    Math.min(
      MAX_TIMEOUT_S,
      typeof rawTimeout === 'number' ? rawTimeout : DEFAULT_TIMEOUT_S,
    ),
  );

  // ── 3. Sanitize command ────────────────────────────────────────────
  const sanitization = sanitizeCommand(command);

  if (!sanitization.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Command not allowed',
        reason: sanitization.reason,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── 4. Prepare workspace ───────────────────────────────────────────
  let workspacePath: string;
  try {
    workspacePath = await ensureWorkspace(workspaceId);
  } catch (err) {
    console.error('Failed to ensure workspace:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create workspace' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const execOptions = getSandboxExecOptions({ sessionId: workspaceId });
  const cmdToRun = sanitization.sanitizedCommand ?? command;

  // ── 5. Build the SSE stream ────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let settled = false;

      /**
       * Enqueue one SSE frame into the stream. After enqueueing an "exit"
       * or "error" frame the stream is closed automatically.
       */
      function send(event: string, data: string) {
        try {
          controller.enqueue(encoder.encode(sseFrame(event, data)));
        } catch {
          // Controller already closed – ignore.
        }
      }

      /** Close the stream exactly once. */
      function close() {
        if (settled) return;
        settled = true;
        try {
          controller.close();
        } catch {
          // Already closed – ignore.
        }
      }

      // Spawn the child process ------------------------------------------
      const child = spawn(cmdToRun, [], {
        cwd: workspacePath,
        shell: '/bin/bash',
        env: {
          ...execOptions.env,
          HOME: workspacePath,
          TERM: 'xterm-256color',
        },
      });

      // Timeout guard ----------------------------------------------------
      const timeoutId = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
          // Give the process a moment to exit cleanly, then force-kill.
          setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL');
            }
          }, 2000);
        }
      }, timeout * 1000);

      // stdout -----------------------------------------------------------
      child.stdout?.on('data', (chunk: Buffer) => {
        send('stdout', chunk.toString());
      });

      // stderr -----------------------------------------------------------
      child.stderr?.on('data', (chunk: Buffer) => {
        send('stderr', chunk.toString());
      });

      // Spawn error (e.g. command not found) -----------------------------
      child.on('error', (err: Error) => {
        clearTimeout(timeoutId);
        send('error', err.message);
        close();
      });

      // Process exit -----------------------------------------------------
      child.on('close', (exitCode: number | null, signal: string | null) => {
        clearTimeout(timeoutId);

        // If killed by our timeout, report 124 (standard timeout code).
        const code = signal === 'SIGTERM' || signal === 'SIGKILL' ? 124 : exitCode;

        send('exit', JSON.stringify({ exitCode: code }));
        close();
      });

      // If the *client* disconnects (aborts the request), kill the child.
      request.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        if (!child.killed) {
          child.kill('SIGTERM');
        }
        close();
      });
    },
  });

  // ── 6. Return the streaming response ─────────────────────────────
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering if present
    },
  });
}

// ── CORS preflight ─────────────────────────────────────────────────────
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
