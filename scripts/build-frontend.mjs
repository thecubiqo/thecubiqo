import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const frontendDir = path.join(repoRoot, 'frontend');
const npmCommand = process.platform === 'win32' ? process.execPath : 'npm';
const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');

function run(args, options = {}) {
  const commandArgs = process.platform === 'win32' ? [npmCli, ...args] : args;
  const result = spawnSync(npmCommand, commandArgs, {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: false,
    ...options
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}

run(['install', '--legacy-peer-deps']);
run(['run', 'build'], { env: { ...process.env, CI: 'false' } });
