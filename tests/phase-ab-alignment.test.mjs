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

test('security watchdog sprint files are present and wired', () => {
  const middleware = read('src/middleware.ts');
  const logger = read('src/lib/security/event-logger.ts');
  const limiter = read('src/lib/security/rate-limiter.ts');
  const classifier = read('src/lib/security/threat-classifier.ts');
  const route = read('src/app/api/security/events/route.ts');
  const migration = read('supabase/migrations/20260520_security_watchdog.sql');

  assert.match(classifier, /ignore\\s\+previous\\s\+instructions/);
  assert.match(classifier, /severity = 'high'/);
  assert.match(limiter, /security_rate_limits/);
  assert.match(limiter, /security_ip_blocklist/);
  assert.match(logger, /security_events/);
  assert.match(logger, /SECURITY_ALERT_WEBHOOK/);
  assert.match(middleware, /checkRateLimit/);
  assert.match(middleware, /assessThreat/);
  assert.match(middleware, /logSecurityEvent/);
  assert.match(route, /requireAdminRequest/);
  assert.match(migration, /create table if not exists public\.security_rate_limits/);
  assert.match(migration, /create table if not exists public\.security_ip_blocklist/);
});

test('Sprint 2 onboarding routes match canonical profile and memory schema', () => {
  const progress = read('src/app/api/onboarding/progress/route.ts');
  const complete = read('src/app/api/onboarding/complete/route.ts');
  const config = read('src/lib/onboarding/step-config.ts');
  const migration = read('supabase/migrations/20260520_onboarding.sql');

  for (const step of ['welcome', 'right_now', 'about_you', 'how_you_work', 'connector_setup', 'first_message']) {
    assert.match(config, new RegExp(`id: '${step}'`));
  }
  assert.match(progress, /\.from\('onboarding_progress'\)/);
  assert.match(progress, /\.from\('onboarding_events'\)/);
  assert.match(progress, /safeParse/);
  assert.match(complete, /\.from\('user_ai_profile'\)/);
  assert.match(complete, /\.from\('memory_events'\)/);
  assert.match(complete, /summary: truncate/);
  assert.doesNotMatch(complete, /content: `User context from onboarding/);
  assert.doesNotMatch(complete, /importance:/);
  assert.match(complete, /\.from\('rgy_status'\)/);
  assert.match(migration, /create table if not exists public\.onboarding_progress/);
  assert.match(migration, /create table if not exists public\.onboarding_events/);
  assert.match(migration, /answer_data jsonb/);
});

test('Sprint 2 RGY system uses status, transitions, and service-only evaluator', () => {
  const engine = read('src/lib/rgy/rgy-engine.ts');
  const status = read('src/app/api/rgy/status/route.ts');
  const history = read('src/app/api/rgy/history/route.ts');
  const evaluate = read('src/app/api/rgy/evaluate/route.ts');
  const migration = read('supabase/migrations/20260520_rgy_system.sql');

  assert.match(engine, /\.from\('rgy_rules'\)/);
  assert.match(engine, /\.from\('conversation_sessions'\)/);
  assert.match(engine, /\.from\('memory_events'\)/);
  assert.match(engine, /\.from\('rgy_status'\)/);
  assert.match(engine, /\.from\('rgy_transitions'\)/);
  assert.match(status, /computeRGYScore/);
  assert.match(history, /\.from\('rgy_transitions'\)/);
  assert.match(evaluate, /x-cron-secret/);
  assert.match(evaluate, /x-cubiqo-internal/);
  assert.match(evaluate, /safeParse/);
  assert.match(migration, /create table if not exists public\.rgy_status/);
  assert.match(migration, /create table if not exists public\.rgy_transitions/);
  assert.match(migration, /create table if not exists public\.rgy_rules/);
  assert.match(migration, /score numeric\(5,2\)/);
});

test('Sprint 2 chatroom RGY reads canonical cq chatroom membership tables', () => {
  const chatroom = read('src/lib/rgy/chatroom-rgy.ts');
  const migration = read('supabase/migrations/20260520_rgy_chatrooms.sql');
  const runner = read('scripts/run-phase-ab-migrations.mjs');

  assert.match(chatroom, /\.from\('cq_chatroom_members'\)/);
  assert.doesNotMatch(chatroom, /\.from\('chatroom_members'\)/);
  assert.match(chatroom, /\.from\('chatroom_rgy_snapshots'\)/);
  assert.match(chatroom, /\.from\('chatroom_rgy_aggregates'\)/);
  assert.match(migration, /create table if not exists public\.chatroom_rgy_snapshots/);
  assert.match(migration, /create table if not exists public\.chatroom_rgy_aggregates/);
  assert.match(runner, /20260520_onboarding\.sql/);
  assert.match(runner, /20260520_rgy_system\.sql/);
  assert.match(runner, /20260520_rgy_chatrooms\.sql/);
});

test('Sprint 3 notifications expose dispatcher, CRUD routes, and preference-safe schema', () => {
  const dispatcher = read('src/lib/notifications/dispatcher.ts');
  const route = read('src/app/api/notifications/route.ts');
  const readRoute = read('src/app/api/notifications/[id]/read/route.ts');
  const prefs = read('src/app/api/notifications/preferences/route.ts');
  const migration = read('supabase/migrations/20260520_notifications_push.sql');

  assert.match(dispatcher, /\.from\('notification_preferences'\)/);
  assert.match(dispatcher, /\.from\('notifications'\)/);
  assert.match(dispatcher, /\.from\('push_notifications'\)/);
  assert.match(route, /dispatchNotification/);
  assert.match(route, /safeParse/);
  assert.match(readRoute, /dismissed_at/);
  assert.match(readRoute, /Promise<\{ id: string \}>/);
  assert.match(prefs, /\.from\('notification_preferences'\)/);
  assert.match(prefs, /safeParse/);
  assert.match(migration, /add column if not exists dismissed_at/);
  assert.match(migration, /add column if not exists metadata jsonb/);
});

test('Sprint 3 Duo fidelity uses DB-backed acceptance tests without live providers', () => {
  const checker = read('src/lib/duo/fidelity-checker.ts');
  const route = read('src/app/api/duo/projects/[id]/fidelity/route.ts');
  const migration = read('supabase/migrations/20260520_duomode_fidelity.sql');
  const runner = read('scripts/run-phase-ab-migrations.mjs');

  assert.match(checker, /\.from\('duo_acceptance_tests'\)/);
  assert.match(checker, /\.from\('duo_test_runs'\)/);
  assert.match(checker, /\.from\('duo_test_results'\)/);
  assert.doesNotMatch(checker, /openai|anthropic|claude|fetch\(/i);
  assert.match(route, /runFidelityCheck/);
  assert.match(route, /getFidelityReport/);
  assert.match(route, /\.eq\('user_id', auth\.user\.id\)/);
  assert.match(migration, /create table if not exists public\.duo_acceptance_tests/);
  assert.match(migration, /'AT-20'/);
  assert.match(migration, /create table if not exists public\.duo_test_runs/);
  assert.match(migration, /create table if not exists public\.duo_test_results/);
  assert.match(runner, /20260520_notifications_push\.sql/);
  assert.match(runner, /20260520_duomode_fidelity\.sql/);
});

test('Sprint 4 app and auth screens are present and bound to canonical APIs', () => {
  const layout = read('src/app/(app)/layout.tsx');
  const shell = read('src/app/(app)/_components/AppShell.tsx');
  const chat = read('src/app/(app)/chat/page.tsx');
  const duo = read('src/app/(app)/duo/page.tsx');
  const duoProject = read('src/app/(app)/duo/[id]/page.tsx');
  const profile = read('src/app/(app)/profile/page.tsx');
  const settings = read('src/app/(app)/settings/page.tsx');
  const onboarding = read('src/app/(app)/onboarding/page.tsx');
  const onboardingWizard = read('src/components/onboarding/OnboardingWizard.tsx');
  const login = read('src/app/(auth)/login/page.tsx');
  const register = read('src/app/(auth)/register/page.tsx');
  const profileApi = read('src/app/api/profile/route.ts');
  const supabaseBrowser = read('src/lib/supabase-browser.ts');

  assert.match(layout, /AppShell/);
  for (const href of ['/chat', '/duo', '/profile', '/settings']) {
    assert.match(shell, new RegExp(`href: '${href}'`));
  }
  assert.match(shell, /NotificationBell/);
  assert.match(chat, /\/api\/agent\/stream/);
  assert.match(chat, /parseSseChunk/);
  assert.match(duo, /\/api\/duo\/projects/);
  assert.match(duoProject, /\/api\/duo\/projects\/\$\{id\}\/fidelity/);
  assert.match(profile, /\/api\/profile/);
  assert.match(profile, /\/api\/memory\?per_page=10/);
  assert.match(settings, /\/api\/billing\/status/);
  assert.match(settings, /\/api\/duo\/connectors/);
  assert.match(settings, /\/api\/notifications\/preferences/);
  assert.match(onboarding, /OnboardingWizard/);
  assert.match(onboardingWizard, /\/api\/onboarding\/progress/);
  assert.match(onboardingWizard, /\/api\/onboarding\/complete/);
  assert.match(login, /AuthPanel mode="login"/);
  assert.match(register, /AuthPanel mode="register"/);
  assert.match(profileApi, /\.from\('profiles'\)/);
  assert.match(profileApi, /\.from\('user_ai_profile'\)/);
  assert.match(supabaseBrowser, /getBrowserSupabase/);
  assert.match(supabaseBrowser, /authHeaders\(\): Promise<Record<string, string>>/);
});

test('Sprint 5 shared components and Duo stream hook are present and API-bound', () => {
  // ApprovalGate/RGYBadge/ChatroomRGYBar/WaveformAnimator were removed as dead
  // code (zero importers) — CubiQoOverlays renders approvals inline and pages
  // render RGY tones inline. Only live components are asserted here.
  const wizard = read('src/components/onboarding/OnboardingWizard.tsx');
  const taskGraph = read('src/components/duo/TaskGraph.tsx');
  const fidelity = read('src/components/duo/FidelityReport.tsx');
  const artifact = read('src/components/duo/ArtifactPane.tsx');
  const bell = read('src/components/notifications/NotificationBell.tsx');
  const duoStream = read('src/hooks/useDuoStream.ts');
  const duoProject = read('src/app/(app)/duo/[id]/page.tsx');

  assert.match(wizard, /ONBOARDING_STEPS/);
  assert.match(wizard, /\/api\/onboarding\/progress/);
  assert.match(wizard, /\/api\/onboarding\/complete/);
  assert.match(taskGraph, /approval_required/);
  assert.match(taskGraph, /can_parallelize/);
  assert.match(fidelity, /score >= 80/);
  // Artifact iframe must be FULLY sandboxed: the sandbox attribute grants no
  // allow-* token (matches the empty attribute, not the explanatory comment).
  assert.match(artifact, /sandbox=""/);
  assert.doesNotMatch(artifact, /sandbox="[^"]*allow/);
  assert.match(artifact, /<code>\{content\}<\/code>/);
  assert.match(bell, /\/api\/notifications\?limit=/);
  assert.match(bell, /\/api\/notifications\/\$\{id\}\/read/);
  assert.match(duoStream, /\/api\/duo\/stream\/\$\{projectId\}/);
  assert.match(duoStream, /authHeaders/);
  assert.match(duoProject, /TaskGraph/);
  assert.match(duoProject, /FidelityReportPanel/);
  assert.match(duoProject, /useDuoStream/);
});

test('Sprint 6 BYOD, social, and media generation surfaces are migration-backed and provider-safe', () => {
  const runner = read('scripts/run-phase-ab-migrations.mjs');
  const encryption = read('src/lib/db/encryption.ts');
  const resolver = read('src/lib/db/client-resolver.ts');
  const byodConnect = read('src/app/api/byod/connect/route.ts');
  const byodHealth = read('src/app/api/byod/health/route.ts');
  const settings = read('src/app/(app)/settings/page.tsx');
  const socialFollow = read('src/app/api/social/follow/route.ts');
  const socialFeed = read('src/app/api/social/feed/route.ts');
  const socialReact = read('src/app/api/chatrooms/messages/[id]/react/route.ts');
  const mediaRouter = read('src/lib/media/model-router.ts');
  const mediaQueue = read('src/lib/media/generation-queue.ts');
  const mediaGenerate = read('src/app/api/media/generate/route.ts');
  const mediaStatus = read('src/app/api/media/status/route.ts');

  for (const migration of ['20260520_byod.sql', '20260520_social_layer_ext.sql', '20260520_media_gen.sql']) {
    assert.match(runner, new RegExp(migration.replace('.', '\\.')));
  }
  for (const table of ['byod_connections', 'byod_sync_log', 'social_connections', 'social_activity_feed', 'social_reactions', 'media_generations', 'media_generation_queue']) {
    assert.match(runner, new RegExp(`'${table}'`));
  }

  assert.match(encryption, /ALGORITHM = 'aes-256-gcm'/);
  assert.match(encryption, /createCipheriv\(ALGORITHM/);
  assert.match(encryption, /BYOD_ENCRYPTION_KEY/);
  assert.match(resolver, /\.from\('byod_connections'\)/);
  assert.match(resolver, /encrypted_service_role_key/);
  assert.doesNotMatch(byodConnect, /serviceRoleKey[^]*NextResponse\.json\(\{[^}]*serviceRoleKey/);
  assert.match(byodConnect, /isPro/);
  assert.match(byodConnect, /safeParse/);
  assert.match(byodHealth, /getSupabaseForUser/);
  assert.match(settings, /\/api\/byod\/health/);
  assert.match(settings, /\/api\/byod\/connect/);
  assert.match(settings, /\/api\/byod\/verify/);
  assert.match(settings, /\/api\/byod\/disconnect/);

  assert.match(socialFollow, /\.from\('social_connections'\)/);
  assert.match(socialFeed, /\.from\('social_activity_feed'\)/);
  assert.match(socialReact, /\.from\('cq_chatroom_reactions'\)/);
  assert.match(socialReact, /safeParse/);

  assert.match(mediaRouter, /TEST_ALLOW_LIVE_PROVIDERS/);
  assert.match(mediaRouter, /provider: 'mock'/);
  assert.match(mediaQueue, /\.from\('media_generations'\)/);
  assert.match(mediaQueue, /\.from\('media_generation_queue'\)/);
  assert.doesNotMatch(mediaQueue, /fetch\(/);
  assert.match(mediaGenerate, /isPro/);
  assert.match(mediaGenerate, /safeParse/);
  assert.match(mediaStatus, /let generationId/);
  assert.match(mediaStatus, /\.from\('media_generation_queue'\)/);
});

test('Sprint 7 proactive AI and cron layer are wired without live providers', () => {
  const evaluator = read('src/lib/proactive/trigger-evaluator.ts');
  const generator = read('src/lib/proactive/nudge-generator.ts');
  const nudges = read('src/app/api/nudges/route.ts');
  const dismiss = read('src/app/api/nudges/[id]/dismiss/route.ts');
  const proactiveCron = read('src/app/api/cron/proactive/route.ts');
  const rgyCron = read('src/app/api/cron/rgy-eval/route.ts');
  const briefingsCron = read('src/app/api/cron/briefings/route.ts');
  const vercel = read('vercel.json');

  for (const trigger of ['commitment_due', 'stale_capsule', 'rgy_drift', 'capsule_at_risk', 'win_detection', 'crisis_followup', 'social_nudge']) {
    assert.match(evaluator, new RegExp(trigger));
  }
  assert.match(evaluator, /\.from\('interventions_log'\)/);
  assert.match(evaluator, /\.from\('rgy_status'\)/);
  assert.match(evaluator, /\.from\('duo_projects'\)/);
  assert.match(evaluator, /\.from\('memory_events'\)/);
  assert.match(generator, /generateNudge/);
  assert.match(generator, /generateMorningBriefing/);

  assert.match(nudges, /\.from\('interventions_log'\)/);
  assert.match(nudges, /requireApiUser/);
  assert.match(dismiss, /safeParse/);
  assert.match(dismiss, /user_response: 'dismissed'/);

  assert.match(proactiveCron, /evaluateProactiveTriggers/);
  assert.match(proactiveCron, /dispatchNotification/);
  // Cron auth is centralized in isAuthorizedCron (accepts x-cubiqo-internal / Bearer).
  assert.match(proactiveCron, /isAuthorizedCron/);
  assert.match(proactiveCron, /\.from\('job_runs'\)/);
  assert.doesNotMatch(proactiveCron, /fetch\(/);
  assert.match(rgyCron, /updateRGYStatus/);
  // Cron auth centralized in isAuthorizedCron (accepts x-cron-secret / x-cubiqo-internal / Bearer).
  assert.match(rgyCron, /isAuthorizedCron/);
  assert.match(briefingsCron, /generateMorningBriefing/);
  assert.match(briefingsCron, /dispatchNotification/);

  for (const path of ['/api/cron/briefings', '/api/cron/rgy-eval', '/api/cron/proactive']) {
    assert.match(vercel, new RegExp(path));
  }
});

test('Platform Architecture SA-01 to SA-04 surface router stack is migration-backed', () => {
  const migration = read('supabase/migrations/20260516_platform_architecture.sql');
  const runner = read('scripts/run-phase-ab-migrations.mjs');
  const heartbeat = read('src/app/api/surfaces/heartbeat/route.ts');
  const active = read('src/app/api/surfaces/active/route.ts');
  const detector = read('src/lib/surfaces/capability-detector.ts');
  const client = read('src/lib/surfaces/heartbeat-client.ts');
  const router = read('src/lib/surfaces/surface-router.ts');
  const handoff = read('src/app/api/surfaces/handoff/route.ts');
  const handoffGet = read('src/app/api/surfaces/handoff/[id]/route.ts');
  const pending = read('src/app/api/surfaces/handoff/pending/route.ts');
  const poller = read('src/lib/surfaces/handoff-poller.ts');
  const queue = read('src/lib/surfaces/offline-queue.ts');
  const sync = read('src/app/api/surfaces/sync/route.ts');

  assert.match(migration, /create table if not exists public\.surface_sessions/);
  assert.match(migration, /surface_sessions_user_online_idx/);
  assert.match(migration, /add column if not exists assigned_surface/);
  assert.match(migration, /add column if not exists requires_capabilities/);
  assert.match(migration, /add column if not exists user_constraints/);
  assert.match(migration, /add column if not exists global_constraints/);
  assert.match(migration, /add column if not exists consumed_by text\[\]/);
  assert.match(runner, /20260516_platform_architecture\.sql/);
  assert.match(runner, /surface_sessions/);

  assert.match(heartbeat, /\.from\('surface_sessions'\)\.upsert/);
  assert.match(heartbeat, /onConflict: 'user_id,surface_type'/);
  assert.match(heartbeat, /safeParse/);
  assert.match(active, /\.gte\('last_heartbeat', thresholdIso\)/);
  assert.match(active, /\.eq\('is_online', true\)/);

  assert.match(detector, /detectCapabilities/);
  assert.match(detector, /capabilityManifestToPayload/);
  assert.match(client, /HEARTBEAT_INTERVAL_MS = 30_000/);
  assert.match(client, /visibilitychange/);
  assert.match(client, /cubiqo_surface_session_id/);

  assert.match(router, /SurfaceUnavailableError/);
  assert.match(router, /HARD_BLOCK_CAPABILITIES/);
  assert.match(router, /selectSurface/);
  assert.match(router, /assignSurfaceToTask/);
  assert.match(router, /\.from\('surface_sessions'\)/);

  assert.match(handoff, /\.from\('duo_artifacts'\)/);
  assert.match(handoff, /artifact_type: 'handoff'/);
  assert.match(handoff, /type: 'handoff'/);
  assert.match(handoffGet, /consumed_at/);
  assert.match(handoffGet, /status: 410/);
  assert.match(handoffGet, /status: 409/);
  assert.match(pending, /\/api\/surfaces\/handoff\/pending/);
  assert.match(pending, /\.contains\('consumed_by', \[surfaceType\]\)/);
  assert.match(poller, /cubiqo:handoff/);

  assert.match(queue, /cubiqo_offline_queue/);
  assert.match(queue, /drainQueue/);
  assert.match(queue, /registerOfflineListeners/);
  assert.match(sync, /idempotency_key/);
  assert.match(sync, /task_status_update/);
  assert.match(sync, /memory_write/);
  assert.match(sync, /artifact_write/);
  assert.match(sync, /safeParse/);
});

test('Apps Mapping connector framework is migration-backed and token-safe', () => {
  const registryMigration = read('supabase/migrations/20260515_connector_registry.sql');
  const connectorsMigration = read('supabase/migrations/20260515_user_connectors_extended.sql');
  const extensionMigration = read('supabase/migrations/20260515_extension_tables.sql');
  const runner = read('scripts/run-phase-ab-migrations.mjs');
  const oauth = read('src/lib/connectors/adapters/oauth2-adapter.ts');
  const apiKey = read('src/lib/connectors/adapters/api-key-adapter.ts');
  const registry = read('src/lib/connectors/registry.ts');

  assert.match(registryMigration, /create table if not exists public\.connector_registry/);
  for (const platform of ['google', 'microsoft', 'slack', 'github', 'shopify', 'plaid', 'linkedin_apply']) {
    assert.match(registryMigration, new RegExp(`'${platform}'`));
  }
  assert.match(connectorsMigration, /add column if not exists adapter_type/);
  assert.match(connectorsMigration, /access_token_encrypted/);
  assert.match(connectorsMigration, /create policy "No direct user access to connector secrets"/);
  assert.match(extensionMigration, /create table if not exists public\.extension_instructions/);
  assert.match(extensionMigration, /create table if not exists public\.extension_sessions/);
  assert.match(extensionMigration, /create table if not exists public\.oauth_states/);
  assert.match(runner, /20260515_connector_registry\.sql/);
  assert.match(runner, /20260515_user_connectors_extended\.sql/);
  assert.match(runner, /20260515_extension_tables\.sql/);

  assert.match(oauth, /\.from\('connector_secrets'\)\.upsert/);
  assert.match(oauth, /access_token_encrypted: encrypt/);
  assert.match(oauth, /shouldUseProviderMock/);
  assert.doesNotMatch(oauth, /access_token:\s*encrypt/);
  assert.match(apiKey, /api_key_encrypted: encrypt/);
  assert.match(registry, /buildOAuthAdapter/);
  assert.match(registry, /buildShopifyAdapter/);
});

test('Apps Mapping API routes validate input and never expose token material', () => {
  const list = read('src/app/api/connectors/route.ts');
  const oauthStart = read('src/app/api/connectors/oauth/start/route.ts');
  const oauthCallback = read('src/app/api/connectors/oauth/callback/route.ts');
  const plaidLink = read('src/app/api/connectors/plaid/link-token/route.ts');
  const plaidExchange = read('src/app/api/connectors/plaid/exchange/route.ts');
  const apiKey = read('src/app/api/connectors/api-key/save/route.ts');
  const instructions = read('src/app/api/connectors/extension/instructions/route.ts');
  const result = read('src/app/api/connectors/extension/result/route.ts');
  const enable = read('src/app/api/connectors/extension/enable/route.ts');
  const disconnect = read('src/app/api/connectors/[platform]/disconnect/route.ts');

  for (const source of [oauthStart, oauthCallback, plaidLink, plaidExchange, apiKey, result, enable]) {
    assert.match(source, /from 'zod'|from "zod"/);
    assert.match(source, /safeParse/);
  }
  assert.match(list, /connector_registry/);
  assert.doesNotMatch(list, /access_token|refresh_token|api_key_encrypted|connector_secrets/i);
  assert.match(apiKey, /ApiKeyAdapter/);
  assert.match(instructions, /\.eq\('status', 'queued'\)/);
  assert.match(instructions, /\.gt\('expires_at', now\)/);
  assert.match(result, /\.from\('extension_instructions'\)/);
  assert.match(enable, /TOS_CONSENT_REQUIRED/);
  assert.match(disconnect, /\.from\('connector_secrets'\)/);
  assert.doesNotMatch(disconnect, /NextResponse\.json\([^)]*token/i);
});

test('Connector Hub UI and extension executor are present', () => {
  const shell = read('src/app/(app)/_components/AppShell.tsx');
  const page = read('src/app/(app)/connectors/page.tsx');
  const hub = read('src/components/connectors/ConnectorHub.tsx');
  const card = read('src/components/connectors/ConnectorCard.tsx');
  const apiForm = read('src/components/connectors/ApiKeyForm.tsx');
  const hooks = [
    'src/hooks/connectors/useConnectors.ts',
    'src/hooks/connectors/useOAuthPopup.ts',
    'src/hooks/connectors/usePlaidLink.ts',
    'src/hooks/connectors/useExtensionHeartbeat.ts',
    'src/hooks/connectors/useApiKeySubmit.ts',
  ].map(read).join('\n');
  const manifest = read('chrome-extension/manifest.json');
  const worker = read('chrome-extension/background/service-worker.js');
  const detector = read('chrome-extension/content-scripts/cubiqo-detector.js');

  assert.match(shell, /href: '\/connectors'/);
  assert.match(page, /ConnectorHub/);
  assert.match(hub, /\/api\/connectors|useConnectors/);
  assert.match(card, /\/api\/connectors\/extension\/enable/);
  assert.match(apiForm, /encrypted before storage/);
  assert.match(hooks, /\/api\/connectors\/oauth\/start/);
  assert.match(hooks, /react-plaid-link/);
  assert.match(hooks, /data-cubiqo-ext/);
  assert.match(manifest, /"scripting"/);
  assert.match(manifest, /content-scripts\/cubiqo-detector\.js/);
  assert.match(worker, /pollForInstructions/);
  assert.match(worker, /\/api\/connectors\/extension\/result/);
  assert.match(detector, /data-cubiqo-ext/);
});

test('Focus runbook referenced implementation files are present', () => {
  for (const path of [
    'src/app/api/analytics/funnel/route.ts',
    'src/app/api/chatrooms/[id]/rgy/route.ts',
    'src/app/api/cron/proactive-daily/route.ts',
    'src/app/api/duo/artifacts/[taskId]/latest/route.ts',
    'src/app/api/duo/projects/[id]/approve/route.ts',
    'src/app/api/duo/projects/[id]/sse/route.ts',
    'src/app/api/duo/session/route.ts',
    'src/app/api/duo/tasks/[id]/answer/route.ts',
    'src/app/api/inngest/route.ts',
    'src/app/api/notifications/read-all/route.ts',
    'src/app/api/proactive/nudges/route.ts',
    'src/app/api/proactive/nudges/[id]/dismiss/route.ts',
    'src/app/api/tts/transcribe/route.ts',
    'src/components/duo/PlanReview.tsx',
    'src/hooks/useDuoBoardRealtime.ts',
    'src/lib/analytics/funnel-tracker.ts',
    'src/lib/crypto/generate-keys.ts',
    'src/lib/guardrails/action-guard.ts',
    'src/lib/guardrails/content-policy-checker.ts',
    'src/lib/guardrails/safety-pattern-cache.ts',
    'src/lib/inngest/client.ts',
    'src/lib/inngest/duo-agent.ts',
    'src/lib/rgy/cron-evaluator.ts',
    'src/types/api.ts',
    'src/types/commerce.ts',
    'src/types/proactive.ts',
    'src/types/ui.ts',
    'supabase/migrations/20260516_duo_mode_patch.sql',
  ]) {
    assert.doesNotThrow(() => read(path), path);
  }
});

test('DuoMode B4 compatibility routes and analytics funnel are validation-backed', () => {
  const patch = read('supabase/migrations/20260516_duo_mode_patch.sql');
  const funnel = read('src/app/api/analytics/funnel/route.ts');
  const tracker = read('src/lib/analytics/funnel-tracker.ts');
  const approve = read('src/app/api/duo/projects/[id]/approve/route.ts');
  const answer = read('src/app/api/duo/tasks/[id]/answer/route.ts');
  const session = read('src/app/api/duo/session/route.ts');
  const sse = read('src/app/api/duo/projects/[id]/sse/route.ts');
  const stream = read('src/app/api/duo/stream/[project_id]/route.ts');
  const legacyApp = read('frontend/src/App.js');
  const guard = read('src/lib/guardrails/action-guard.ts');

  assert.match(patch, /create table if not exists public\.analytics_events/);
  assert.match(patch, /alter publication supabase_realtime add table public\.duo_tasks/);
  assert.match(funnel, /safeParse/);
  assert.match(funnel, /analytics_events/);
  assert.match(tracker, /sessionStorage\['cq_anon_events'\]|EVENT_KEY = 'cq_anon_events'/);
  assert.match(approve, /ALREADY_APPROVED/);
  assert.match(answer, /question_answered/);
  assert.match(session, /board_snapshot/);
  assert.match(sse, /force-dynamic/);
  assert.match(sse, /maxDuration = 800/);
  assert.match(stream, /force-dynamic/);
  assert.match(guard, /FINAL_ACTION_RE/);
  assert.match(guard, /\.from\('duo_approvals'\)/);
  assert.doesNotMatch(legacyApp, /callBackend\(text,\s*\{\s*agentFirst:\s*true\s*\}\)/);
  assert.match(legacyApp, /const shouldUseAgenticFlow = Boolean\(options\.agentFirst\)/);
});
