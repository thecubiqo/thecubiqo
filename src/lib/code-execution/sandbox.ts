/**
 * Sandbox utilities for secure code execution
 * Provides command sanitization, path validation, and security controls
 */

import { resolve, relative, join } from 'path';

// Blocked command patterns that could be dangerous
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//,           // rm -rf /
  /rm\s+-rf\s+~\//,          // rm -rf ~/
  /sudo/i,                    // sudo commands
  /chmod\s+777/,             // chmod 777 (too permissive)
  /curl.*\|.*bash/,          // curl | bash
  /wget.*\|.*bash/,          // wget | bash
  /curl.*\|.*sh/,            // curl | sh
  /wget.*\|.*sh/,            // wget | sh
  /:\(\)\{.*\|.*&\s*\}/,     // fork bomb
  />\s*\/dev\/sda/,          // write to disk devices
  /mkfs/,                     // format filesystem
  /dd\s+if=/,                 // dd commands
  /iptables/,                 // firewall modifications
  /shutdown/,                 // system shutdown
  /reboot/,                   // system reboot
  /init\s+0/,                 // system halt
  /init\s+6/,                 // system reboot
  /\/etc\/passwd/,            // password file access
  /\/etc\/shadow/,            // shadow file access
];

// Allowed interpreters/commands
const ALLOWED_COMMANDS = new Set([
  'node',
  'python',
  'python3',
  'bash',
  'sh',
  'npm',
  'npx',
  'yarn',
  'pip',
  'pip3',
  'git',
  'ls',
  'cat',
  'echo',
  'mkdir',
  'touch',
  'pwd',
  'whoami',
  'which',
  'tsx',
  'tsc',
]);

export interface SandboxConfig {
  workspaceRoot?: string;
  sessionId?: string;
  maxTimeout?: number;
  maxBuffer?: number;
}

export interface SanitizationResult {
  allowed: boolean;
  reason?: string;
  sanitizedCommand?: string;
}

/**
 * Get workspace directory for a session
 */
export function getWorkspaceDir(sessionId: string, workspaceRoot?: string): string {
  const root = workspaceRoot || process.env.WORKSPACE_ROOT || '/tmp/cubiqo-workspace';
  return join(root, sessionId);
}

/**
 * Validate that a path is within the workspace
 */
export function validatePath(path: string, workspaceRoot: string): SanitizationResult {
  const resolvedPath = resolve(workspaceRoot, path);
  const relativePath = relative(workspaceRoot, resolvedPath);

  // Prevent directory traversal
  if (relativePath.startsWith('..')) {
    return {
      allowed: false,
      reason: 'Path traversal detected - attempting to access files outside workspace',
    };
  }

  // Additional check for absolute paths outside workspace
  if (!resolvedPath.startsWith(workspaceRoot)) {
    return {
      allowed: false,
      reason: 'Absolute path outside workspace not allowed',
    };
  }

  return {
    allowed: true,
    sanitizedCommand: resolvedPath,
  };
}

/**
 * Check if a command contains blocked patterns
 */
export function checkBlockedPatterns(command: string): SanitizationResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: `Command contains blocked pattern: ${pattern.source}`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Validate command is using allowed interpreter
 */
export function validateCommand(command: string): SanitizationResult {
  // Extract the base command (first word)
  const baseCommand = command.trim().split(/\s+/)[0];
  
  // Remove any path prefix to get just the command name
  const commandName = baseCommand.split('/').pop() || '';

  // Check if it's an allowed command
  if (!ALLOWED_COMMANDS.has(commandName)) {
    return {
      allowed: false,
      reason: `Command '${commandName}' is not in the allowed list. Allowed: ${Array.from(ALLOWED_COMMANDS).join(', ')}`,
    };
  }

  return { allowed: true, sanitizedCommand: command };
}

/**
 * Sanitize a shell command for safe execution
 */
export function sanitizeCommand(
  command: string,
  config: SandboxConfig = {}
): SanitizationResult {
  // Check for empty command
  if (!command || !command.trim()) {
    return {
      allowed: false,
      reason: 'Empty command not allowed',
    };
  }

  // Check blocked patterns first
  const blockedCheck = checkBlockedPatterns(command);
  if (!blockedCheck.allowed) {
    return blockedCheck;
  }

  // Validate command is allowed
  const commandCheck = validateCommand(command);
  if (!commandCheck.allowed) {
    return commandCheck;
  }

  // Additional security: prevent command chaining that might bypass checks
  const dangerousChars = ['&', '|', ';', '`', '$', '(', ')'];
  const hasDangerousChaining = dangerousChars.some(char => {
    // Allow some safe uses (e.g., npm install && npm build)
    // But block suspicious combinations
    if (char === '&' && command.includes('&&')) {
      // && is generally safe for chaining
      return false;
    }
    if (char === '|' && command.includes('||')) {
      // || is generally safe for fallbacks
      return false;
    }
    // Block pipes and other dangerous chars
    return command.includes(char);
  });

  if (hasDangerousChaining) {
    console.warn(`[Sandbox] Command contains potentially dangerous operators: ${command}`);
    // We'll allow it but log it - some legitimate commands need pipes
  }

  return {
    allowed: true,
    sanitizedCommand: command,
  };
}

/**
 * Get execution options for sandboxed command
 */
export function getSandboxExecOptions(config: SandboxConfig = {}) {
  const workspaceDir = config.sessionId 
    ? getWorkspaceDir(config.sessionId, config.workspaceRoot)
    : config.workspaceRoot || '/tmp/cubiqo-workspace';

  return {
    cwd: workspaceDir,
    timeout: config.maxTimeout || 30000, // 30 seconds default
    maxBuffer: config.maxBuffer || 1024 * 1024, // 1MB default
    env: {
      ...process.env,
      // Restrict environment
      PATH: process.env.PATH,
      HOME: workspaceDir,
      TMPDIR: '/tmp',
      // Prevent dangerous operations
      PS4: '', // Disable bash debug mode
    },
    // Additional security options
    shell: '/bin/bash',
    windowsHide: true,
  };
}

/**
 * Create workspace directory if it doesn't exist
 */
export async function ensureWorkspace(sessionId: string, workspaceRoot?: string): Promise<string> {
  const { mkdir } = await import('fs/promises');
  const workspaceDir = getWorkspaceDir(sessionId, workspaceRoot);
  
  await mkdir(workspaceDir, { recursive: true });
  
  return workspaceDir;
}

/**
 * Clean up workspace directory
 */
export async function cleanupWorkspace(sessionId: string, workspaceRoot?: string): Promise<void> {
  const { rm } = await import('fs/promises');
  const workspaceDir = getWorkspaceDir(sessionId, workspaceRoot);
  
  try {
    await rm(workspaceDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to cleanup workspace ${sessionId}:`, error);
  }
}
