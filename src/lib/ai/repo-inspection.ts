import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const rootDir = process.cwd();
const deniedSegments = new Set([
  '.git',
  '.next',
  '.vercel',
  'node_modules',
  'build',
  'dist',
  'coverage',
  '.cache'
]);
const deniedFilePatterns = [
  /^\.env/i,
  /secret/i,
  /credential/i,
  /token/i,
  /\.pem$/i,
  /\.key$/i
];
const searchableExtensions = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.mjs',
  '.cjs',
  '.md',
  '.css',
  '.sql'
]);
const searchRoots = ['api', 'src', 'frontend/src', 'supabase', 'scripts', 'docs'];

type RouteInfo = {
  route: string;
  kind: 'page' | 'api';
  file: string;
};

function toRelative(inputPath: string) {
  const cleaned = String(inputPath || '').replace(/^[/\\]+/, '');
  const resolved = path.resolve(rootDir, cleaned);
  const relative = path.relative(rootDir, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path is outside the CubiQo repository');
  }
  return relative.replace(/\\/g, '/');
}

function assertReadableRelative(relativePath: string) {
  const parts = relativePath.split(/[\\/]+/).filter(Boolean);
  if (parts.some(part => deniedSegments.has(part))) {
    throw new Error('Path is not readable by the V1 repo inspection tool');
  }
  const fileName = parts[parts.length - 1] || '';
  if (deniedFilePatterns.some(pattern => pattern.test(fileName))) {
    throw new Error('Secret-like files are not readable by the V1 repo inspection tool');
  }
}

async function walk(dir: string, files: string[] = [], limit = 700) {
  if (files.length >= limit) return files;
  if (!dir) {
    for (const searchRoot of searchRoots) {
      if (files.length >= limit) break;
      await walk(searchRoot, files, limit);
    }
    return files;
  }
  const entries = await fs.readdir(path.join(rootDir, dir), { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (files.length >= limit) break;
    const relative = path.posix.join(dir.replace(/\\/g, '/'), entry.name);
    if (entry.isDirectory()) {
      if (!deniedSegments.has(entry.name)) await walk(relative, files, limit);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!searchableExtensions.has(ext)) continue;
    try {
      assertReadableRelative(relative);
      files.push(relative);
    } catch {
      // Skip files outside the read-only allowlist.
    }
  }
  return files;
}

export async function repoReadFile(filePath: string) {
  const relative = toRelative(filePath);
  assertReadableRelative(relative);
  const absolute = path.join(rootDir, relative);
  const stat = await fs.stat(absolute);
  if (!stat.isFile()) throw new Error('Path is not a file');
  if (stat.size > 300_000) throw new Error('File is too large for V1 repo inspection');
  const content = await fs.readFile(absolute, 'utf8');
  return {
    file: relative,
    bytes: stat.size,
    truncated: content.length > 12_000,
    content: content.slice(0, 12_000)
  };
}

export async function repoSearch(query: string) {
  const needle = String(query || '').trim().toLowerCase();
  if (needle.length < 2) return { query, matches: [] };
  const files = await walk('');
  const matches: Array<{ file: string; line: number; text: string }> = [];

  for (const file of files) {
    if (matches.length >= 40) break;
    const absolute = path.join(rootDir, file);
    const stat = await fs.stat(absolute).catch(() => null);
    if (!stat || stat.size > 260_000) continue;
    const content = await fs.readFile(absolute, 'utf8').catch(() => '');
    if (!content.toLowerCase().includes(needle)) continue;
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length && matches.length < 40; index += 1) {
      if (lines[index].toLowerCase().includes(needle)) {
        matches.push({
          file,
          line: index + 1,
          text: lines[index].trim().slice(0, 220)
        });
      }
    }
  }

  return { query: needle, matches };
}

function segmentToRoute(segment: string) {
  if (segment.startsWith('(') && segment.endsWith(')')) return '';
  if (segment.startsWith('[') && segment.endsWith(']')) return `:${segment.slice(1, -1)}`;
  return segment;
}

export async function repoListRoutes() {
  const appDir = path.join(rootDir, 'src', 'app');
  const routeFiles: RouteInfo[] = [];

  async function visit(relativeDir: string) {
    const absoluteDir = path.join(appDir, relativeDir);
    const entries = await fs.readdir(absoluteDir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const next = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        await visit(next);
        continue;
      }
      if (!entry.isFile()) continue;
      const isPage = /^page\.(tsx|ts|jsx|js)$/.test(entry.name);
      const isRoute = /^route\.(tsx|ts|jsx|js)$/.test(entry.name);
      if (!isPage && !isRoute) continue;
      const parts = relativeDir
        .split(/[\\/]+/)
        .filter(Boolean)
        .map(segmentToRoute)
        .filter(Boolean);
      const route = `/${parts.join('/')}`.replace(/\/+/g, '/') || '/';
      routeFiles.push({
        route,
        kind: isRoute ? 'api' : 'page',
        file: path.posix.join('src/app', relativeDir.replace(/\\/g, '/'), entry.name)
      });
    }
  }

  await visit('');
  return {
    routes: routeFiles.sort((a, b) => a.route.localeCompare(b.route) || a.kind.localeCompare(b.kind))
  };
}

export async function repoStackSummary() {
  const packageJson = JSON.parse((await repoReadFile('package.json')).content);
  const routes = await repoListRoutes();
  const dependencies = packageJson.dependencies || {};
  return {
    app: packageJson.name,
    version: packageJson.version,
    stack: {
      framework: dependencies.next ? `Next.js ${dependencies.next}` : 'Next.js',
      react: dependencies.react || null,
      supabase: dependencies['@supabase/supabase-js'] || null,
      ai: dependencies.ai || null,
      ui: 'React app shell with shadcn/Radix UI primitives and lucide icons'
    },
    scripts: packageJson.scripts || {},
    routes: routes.routes,
    branch: process.env.VERCEL_GIT_COMMIT_REF || null
  };
}

export async function runtimeStatus() {
  const stack = await repoStackSummary();
  return {
    app: 'cq.ai / CubiQo',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'local',
    vercel: Boolean(process.env.VERCEL),
    node: process.version,
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.AI_API_KEY),
      aiGateway: Boolean(process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY),
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || process.env.XI_API_KEY)
    },
    stack: stack.stack,
    routes: stack.routes.map(route => route.route)
  };
}

export async function runCheck(check: 'typecheck' | 'verify:cqai') {
  const enabled = process.env.CUBIQO_AGENT_ALLOW_LOCAL_CHECKS === '1' && process.env.VERCEL !== '1';
  if (!enabled) {
    return {
      check,
      status: 'blocked',
      reason: 'V1 agent checks are disabled in deployed/serverless runtime. Codex runs the regression suite from the workspace instead.'
    };
  }

  const script = check === 'typecheck' ? ['run', 'typecheck'] : ['run', 'verify:cqai'];
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  try {
    const result = await execFileAsync(command, script, {
      cwd: rootDir,
      timeout: 120_000,
      maxBuffer: 1_000_000
    });
    return {
      check,
      status: 'passed',
      stdout: result.stdout.slice(-6000),
      stderr: result.stderr.slice(-3000)
    };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return {
      check,
      status: 'failed',
      stdout: String(err.stdout || '').slice(-6000),
      stderr: String(err.stderr || err.message || '').slice(-3000)
    };
  }
}
