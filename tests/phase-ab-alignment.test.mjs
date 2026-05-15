import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

test('writeOutcome maps successful outcomes without accepting done as an input outcome', () => {
  const source = read('src/lib/agent/outcome-writer.ts');
  assert.match(source, /outcome: 'success' \| 'partial' \| 'failed' \| 'shot' \| 'abandoned'/);
  assert.doesNotMatch(source, /input\.outcome === 'done'/);
  assert.match(source, /input\.outcome === 'success' \|\| input\.outcome === 'partial' \? 'done' : 'failed'/);
});

test('Phase B migration exposes canonical queue and missing coordination tables', () => {
  const migration = read('supabase/migrations/20260516000000_phase_b_alignment.sql');
  for (const table of ['duo_questions', 'duo_blockers', 'duo_access_requests', 'agent_tool_calls']) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /add column if not exists state text default 'queued'/);
  assert.match(migration, /add column if not exists locked_at timestamptz/);
});

test('agent worker uses canonical Phase B state, approvals, and tool call tables', () => {
  const cron = read('src/app/api/cron/agent-worker/route.ts');
  const worker = read('src/lib/agent/worker.ts');
  const common = read('src/lib/agent/common.ts');
  const router = read('src/lib/agent/decision-router.ts');

  assert.match(cron, /\.eq\('state', 'queued'\)/);
  assert.match(cron, /locked_at/);
  assert.match(worker, /\.from\('duo_approvals'\)/);
  assert.match(common, /\.from\('agent_tool_calls'\)/);
  assert.match(common, /route_used/);
  assert.match(common, /failure_reason/);
  assert.match(common, /fallback_tool/);
  assert.match(common, /evidence/);
  assert.match(router, /\.from\('agent_tool_calls'\)/);
});

test('Duo approval routes use duo_approvals and do not imply fake undo', () => {
  const approve = read('src/app/api/duo/approvals/[id]/approve/route.ts');
  const reject = read('src/app/api/duo/approvals/[id]/reject/route.ts');

  assert.match(approve, /\.from\('duo_approvals'\)/);
  assert.match(approve, /\.gt\('expires_at', now\)/);
  assert.match(approve, /reversible: Boolean\(approval\.reversible\)/);
  assert.match(reject, /\.from\('duo_approvals'\)/);
  assert.match(reject, /status: 'rejected'/);
});

test('connector routes do not return token material and secrets are service-role protected', () => {
  const list = read('src/lib/agent/tool-onboarding.ts');
  const callback = read('src/app/api/duo/connectors/[platform]/callback/route.ts');
  const migration = read('supabase/migrations/20260516000000_phase_b_alignment.sql');

  assert.doesNotMatch(list, /access_token|refresh_token|secret_ref|connector_secrets/i);
  assert.doesNotMatch(callback, /encrypted_access_token|encrypted_refresh_token/);
  assert.match(callback, /access_token_plaintext/);
  assert.match(migration, /drop policy if exists "Users read own connector secret refs"/);
});

test('provider mocks block live test calls unless explicitly allowed', () => {
  const guard = read('src/lib/providers/live-provider-guard.ts');
  const mocks = read('src/lib/providers/mock-providers.ts');
  const vision = read('src/app/api/perception/vision/route.ts');
  const tts = read('src/app/api/tts/route.ts');
  const callback = read('src/app/api/duo/connectors/[platform]/callback/route.ts');

  assert.match(guard, /TEST_ALLOW_LIVE_PROVIDERS/);
  for (const provider of ['openai', 'elevenlabs', 'tavily', 'browserbase', 'stagehand', 'stripe', 'shopify', 'vercel', 'social', 'oauth']) {
    assert.match(mocks, new RegExp(`'${provider}'`));
  }
  assert.match(vision, /shouldUseProviderMock/);
  assert.match(tts, /shouldUseProviderMock/);
  assert.match(callback, /shouldUseProviderMock/);
});

test('high-risk routes have Zod validation', () => {
  for (const path of [
    'src/app/api/agent/onboard/route.ts',
    'src/app/api/agent/understand-classify/route.ts',
    'src/app/api/perception/vision/route.ts',
    'src/app/api/duo/projects/route.ts',
    'src/app/api/duo/tasks/[id]/execute/route.ts',
    'src/app/api/duo/approvals/[id]/approve/route.ts',
    'src/app/api/duo/approvals/[id]/reject/route.ts',
  ]) {
    const source = read(path);
    assert.match(source, /from 'zod'|from "zod"/, path);
    assert.match(source, /safeParse/, path);
  }
});

