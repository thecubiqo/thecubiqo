import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

interface ExecuteRequest {
  language: 'python' | 'javascript' | 'typescript' | 'bash' | 'swift';
  code: string;
  agentId?: string; // Execute in agent's workspace
  context?: {
    workdir?: string;
    timeout?: number; // milliseconds
  };
}

interface ExecuteResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  error?: string;
}

// Security: Resource limits
const MAX_EXECUTION_TIME = 30000; // 30 seconds
const MAX_OUTPUT_SIZE = 10000; // characters

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: ExecuteRequest = await req.json();
    const { language, code, context } = body;

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Missing code or language' },
        { status: 400 }
      );
    }

    // Determine execution directory
    let execDir: string;
    let isTemp = false;

    if (body.agentId) {
      // Use /tmp for workspace in production environment (Vercel)
      const os = require('os');
      const baseDir = process.env.NODE_ENV === 'production' ? os.tmpdir() : process.cwd();
      execDir = join(baseDir, 'data', 'workspaces', body.agentId);

      // Ensure agent workspace exists
      try {
        await mkdir(execDir, { recursive: true });
      } catch (e) {
        // Ignore if exists
      }
    } else {
      execDir = join('/tmp', 'cubiqo-exec', randomUUID());
      isTemp = true;
      await mkdir(execDir, { recursive: true });
    }

    const startTime = Date.now();
    let result: ExecuteResponse;

    try {
      switch (language) {
        case 'python':
          result = await executePython(code, execDir, context?.timeout);
          break;
        case 'javascript':
          result = await executeJavaScript(code, execDir, context?.timeout);
          break;
        case 'typescript':
          result = await executeTypeScript(code, execDir, context?.timeout);
          break;
        case 'bash':
          result = await executeBash(code, execDir, context?.timeout);
          break;
        case 'swift':
          result = await executeSwift(code, execDir, context?.timeout);
          break;
        default:
          return NextResponse.json(
            { error: `Unsupported language: ${language}` },
            { status: 400 }
          );
      }

      result.executionTime = Date.now() - startTime;

      // Cleanup temp directory if it was temp
      if (isTemp) {
        await execAsync(`rm -rf ${execDir}`).catch(() => { });
      }

      return NextResponse.json(result);
    } catch (error) {
      // Cleanup on error if temp
      if (isTemp) {
        await execAsync(`rm -rf ${execDir}`).catch(() => { });
      }
      throw error;
    }
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      {
        error: 'Execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function executePython(
  code: string,
  workdir: string,
  timeout = MAX_EXECUTION_TIME
): Promise<ExecuteResponse> {
  const filename = join(workdir, 'script.py');
  await writeFile(filename, code);

  try {
    const { stdout, stderr } = await execAsync(
      `python3 ${filename}`,
      {
        cwd: workdir,
        timeout,
        maxBuffer: MAX_OUTPUT_SIZE,
      }
    );

    return {
      stdout: stdout.trim().slice(0, MAX_OUTPUT_SIZE),
      stderr: stderr.trim().slice(0, MAX_OUTPUT_SIZE),
      exitCode: 0,
      executionTime: 0,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim().slice(0, MAX_OUTPUT_SIZE) || '',
      stderr: error.stderr?.trim().slice(0, MAX_OUTPUT_SIZE) || error.message,
      exitCode: error.code || 1,
      executionTime: 0,
      error: error.message,
    };
  } finally {
    await unlink(filename).catch(() => { });
  }
}

async function executeJavaScript(
  code: string,
  workdir: string,
  timeout = MAX_EXECUTION_TIME
): Promise<ExecuteResponse> {
  const filename = join(workdir, 'script.js');
  await writeFile(filename, code);

  try {
    const { stdout, stderr } = await execAsync(
      `node ${filename}`,
      {
        cwd: workdir,
        timeout,
        maxBuffer: MAX_OUTPUT_SIZE,
      }
    );

    return {
      stdout: stdout.trim().slice(0, MAX_OUTPUT_SIZE),
      stderr: stderr.trim().slice(0, MAX_OUTPUT_SIZE),
      exitCode: 0,
      executionTime: 0,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim().slice(0, MAX_OUTPUT_SIZE) || '',
      stderr: error.stderr?.trim().slice(0, MAX_OUTPUT_SIZE) || error.message,
      exitCode: error.code || 1,
      executionTime: 0,
      error: error.message,
    };
  } finally {
    await unlink(filename).catch(() => { });
  }
}

async function executeTypeScript(
  code: string,
  workdir: string,
  timeout = MAX_EXECUTION_TIME
): Promise<ExecuteResponse> {
  const filename = join(workdir, 'script.ts');
  await writeFile(filename, code);

  try {
    // Compile TypeScript first
    await execAsync(`npx tsx ${filename}`, {
      cwd: workdir,
      timeout: 5000, // Quick compile timeout
    });

    // Execute compiled JS
    const { stdout, stderr } = await execAsync(
      `npx tsx ${filename}`,
      {
        cwd: workdir,
        timeout,
        maxBuffer: MAX_OUTPUT_SIZE,
      }
    );

    return {
      stdout: stdout.trim().slice(0, MAX_OUTPUT_SIZE),
      stderr: stderr.trim().slice(0, MAX_OUTPUT_SIZE),
      exitCode: 0,
      executionTime: 0,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim().slice(0, MAX_OUTPUT_SIZE) || '',
      stderr: error.stderr?.trim().slice(0, MAX_OUTPUT_SIZE) || error.message,
      exitCode: error.code || 1,
      executionTime: 0,
      error: error.message,
    };
  } finally {
    await unlink(filename).catch(() => { });
  }
}

async function executeBash(
  code: string,
  workdir: string,
  timeout = MAX_EXECUTION_TIME
): Promise<ExecuteResponse> {
  const filename = join(workdir, 'script.sh');
  await writeFile(filename, code);
  await execAsync(`chmod +x ${filename}`);

  try {
    const { stdout, stderr } = await execAsync(
      `bash ${filename}`,
      {
        cwd: workdir,
        timeout,
        maxBuffer: MAX_OUTPUT_SIZE,
      }
    );

    return {
      stdout: stdout.trim().slice(0, MAX_OUTPUT_SIZE),
      stderr: stderr.trim().slice(0, MAX_OUTPUT_SIZE),
      exitCode: 0,
      executionTime: 0,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim().slice(0, MAX_OUTPUT_SIZE) || '',
      stderr: error.stderr?.trim().slice(0, MAX_OUTPUT_SIZE) || error.message,
      exitCode: error.code || 1,
      executionTime: 0,
      error: error.message,
    };
  } finally {
    await unlink(filename).catch(() => { });
  }
}

async function executeSwift(
  code: string,
  workdir: string,
  timeout = MAX_EXECUTION_TIME
): Promise<ExecuteResponse> {
  const filename = join(workdir, 'script.swift');
  await writeFile(filename, code);

  try {
    const { stdout, stderr } = await execAsync(
      `swift ${filename}`,
      {
        cwd: workdir,
        timeout,
        maxBuffer: MAX_OUTPUT_SIZE,
      }
    );

    return {
      stdout: stdout.trim().slice(0, MAX_OUTPUT_SIZE),
      stderr: stderr.trim().slice(0, MAX_OUTPUT_SIZE),
      exitCode: 0,
      executionTime: 0,
    };
  } catch (error: any) {
    const isNotFound = error.message.includes('not found') || (error.stderr && error.stderr.includes('not found'));
    return {
      stdout: error.stdout?.trim().slice(0, MAX_OUTPUT_SIZE) || '',
      stderr: isNotFound
        ? 'Swift compiler not found. Please install Swift to run this code.'
        : (error.stderr?.trim().slice(0, MAX_OUTPUT_SIZE) || error.message),
      exitCode: error.code || 1,
      executionTime: 0,
      error: error.message,
    };
  } finally {
    await unlink(filename).catch(() => { });
  }
}
