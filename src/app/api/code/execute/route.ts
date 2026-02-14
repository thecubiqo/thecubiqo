import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

interface ExecuteRequest {
  language: 'python' | 'javascript' | 'typescript' | 'bash';
  code: string;
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

    // Create temp directory for execution
    const tempDir = join('/tmp', 'cubiqo-exec', randomUUID());
    await mkdir(tempDir, { recursive: true });

    const startTime = Date.now();
    let result: ExecuteResponse;

    try {
      switch (language) {
        case 'python':
          result = await executePython(code, tempDir, context?.timeout);
          break;
        case 'javascript':
          result = await executeJavaScript(code, tempDir, context?.timeout);
          break;
        case 'typescript':
          result = await executeTypeScript(code, tempDir, context?.timeout);
          break;
        case 'bash':
          result = await executeBash(code, tempDir, context?.timeout);
          break;
        default:
          return NextResponse.json(
            { error: `Unsupported language: ${language}` },
            { status: 400 }
          );
      }

      result.executionTime = Date.now() - startTime;

      // Cleanup temp directory
      await execAsync(`rm -rf ${tempDir}`).catch(() => {});

      return NextResponse.json(result);
    } catch (error) {
      // Cleanup on error
      await execAsync(`rm -rf ${tempDir}`).catch(() => {});
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
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message: string; code?: number };
    return {
      stdout: err.stdout?.trim().slice(0, MAX_OUTPUT_SIZE) || '',
      stderr: err.stderr?.trim().slice(0, MAX_OUTPUT_SIZE) || err.message,
      exitCode: err.code || 1,
      executionTime: 0,
      error: err.message,
    };
  } finally {
    await unlink(filename).catch(() => {});
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
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message: string; code?: number };
    return {
      stdout: err.stdout?.trim().slice(0, MAX_OUTPUT_SIZE) || '',
      stderr: err.stderr?.trim().slice(0, MAX_OUTPUT_SIZE) || err.message,
      exitCode: err.code || 1,
      executionTime: 0,
      error: err.message,
    };
  } finally {
    await unlink(filename).catch(() => {});
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
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message: string; code?: number };
    return {
      stdout: err.stdout?.trim().slice(0, MAX_OUTPUT_SIZE) || '',
      stderr: err.stderr?.trim().slice(0, MAX_OUTPUT_SIZE) || err.message,
      exitCode: err.code || 1,
      executionTime: 0,
      error: err.message,
    };
  } finally {
    await unlink(filename).catch(() => {});
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
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message: string; code?: number };
    return {
      stdout: err.stdout?.trim().slice(0, MAX_OUTPUT_SIZE) || '',
      stderr: err.stderr?.trim().slice(0, MAX_OUTPUT_SIZE) || err.message,
      exitCode: err.code || 1,
      executionTime: 0,
      error: err.message,
    };
  } finally {
    await unlink(filename).catch(() => {});
  }
}
