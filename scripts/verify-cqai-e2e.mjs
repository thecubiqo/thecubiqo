import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function cleanEnvValue(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\\r\\n$/g, '')
    .replace(/\\n$/g, '')
    .trim();
}

function readLocalEnv() {
  const envPath = path.join(repoRoot, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = cleanEnvValue(match[2]);
  }
  return env;
}

function readAppSupabaseConfig() {
  const localEnv = readLocalEnv();
  const clientPath = path.join(repoRoot, 'frontend', 'src', 'lib', 'supabase.js');
  const source = fs.readFileSync(clientPath, 'utf8');
  const urlMatch = source.match(/SUPABASE_URL\s*=.*?\|\|\s*'([^']+)'/);
  const anonMatch = source.match(/SUPABASE_ANON_KEY\s*=.*?\|\|\s*'([^']+)'/);

  return {
    url: process.env.REACT_APP_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      localEnv.REACT_APP_SUPABASE_URL ||
      localEnv.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      localEnv.SUPABASE_URL ||
      urlMatch?.[1],
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      localEnv.REACT_APP_SUPABASE_ANON_KEY ||
      localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      localEnv.SUPABASE_ANON_KEY ||
      anonMatch?.[1],
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY || ''
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { response, body };
}

async function verifySignup({ url, anonKey, serviceRoleKey }) {
  const email = process.env.E2E_EMAIL || `codex-e2e-${Date.now()}@cubiqo.ai`;
  const password = process.env.E2E_PASSWORD || `Cqai-${Date.now()}-test!`;
  const { response, body } = await requestJson(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  let userId = body?.user?.id || body?.id || null;
  let ok = response.ok && Boolean(userId);
  let mode = 'public-signup';
  let error = ok ? null : (body?.msg || body?.message || body?.error_description || body?.error || body?.raw || 'unknown');

  if (!ok && serviceRoleKey && response.status === 429) {
    mode = 'admin-create-fallback-after-rate-limit';
    const fallback = await requestJson(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, email_confirm: true })
    });
    userId = fallback.body?.user?.id || fallback.body?.id || null;
    ok = fallback.response.ok && Boolean(userId);
    error = ok ? 'public signup rate-limited; admin user create succeeded' : (fallback.body?.message || fallback.body?.error || fallback.body?.raw || error);
  }

  let profileCreated = null;
  if (serviceRoleKey && userId) {
    const profile = await requestJson(`${url}/rest/v1/profiles?id=eq.${userId}&select=id&limit=1`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    });
    profileCreated = profile.response.ok && Array.isArray(profile.body) && profile.body.length === 1;
    ok = ok && profileCreated;
    if (!profileCreated) error = 'auth user was created, but matching profile row was not found';
  }

  if (serviceRoleKey && userId && !process.env.E2E_KEEP_USER) {
    await requestJson(`${url}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    });
  }

  return {
    ok,
    status: response.status,
    mode,
    email,
    userId,
    profileCreated,
    confirmedSessionReturned: Boolean(body?.session),
    cleanup: serviceRoleKey && userId && !process.env.E2E_KEEP_USER ? 'attempted' : 'not available',
    error
  };
}

async function verifyTable({ url, anonKey, serviceRoleKey }, table) {
  const key = serviceRoleKey || anonKey;
  const { response, body } = await requestJson(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });

  return {
    table,
    ok: response.ok,
    status: response.status,
    error: response.ok ? null : (body?.message || body?.hint || body?.raw || 'unknown')
  };
}

async function createConfirmedTestUser({ url, anonKey, serviceRoleKey }) {
  if (!serviceRoleKey) throw new Error('Service role key is required for CRUD verification');
  const email = `codex-crud-${Date.now()}@cubiqo.ai`;
  const password = `Cqai-${Date.now()}-crud!`;
  const created = await requestJson(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, email_confirm: true })
  });
  const userId = created.body?.user?.id || created.body?.id || null;
  if (!created.response.ok || !userId) {
    throw new Error(created.body?.message || created.body?.error || 'Could not create CRUD test user');
  }

  const signedIn = await requestJson(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  const accessToken = signedIn.body?.access_token || null;
  if (!signedIn.response.ok || !accessToken) {
    throw new Error(signedIn.body?.message || signedIn.body?.error || 'Could not sign in CRUD test user');
  }

  return { email, password, userId, accessToken };
}

async function deleteTestUser({ url, serviceRoleKey }, userId) {
  if (!serviceRoleKey || !userId) return;
  await requestJson(`${url}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  });
}

function userHeaders({ anonKey }, accessToken, extra = {}) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function verifyUserOwnedCrud(config) {
  const result = {
    ok: false,
    userCreated: false,
    journal: { inserted: false, read: false, deleted: false },
    signals: { inserted: false, read: false, deleted: false },
    rls: { anonJournalInsertDenied: false, anonSignalInsertDenied: false },
    error: null
  };

  let testUser = null;
  try {
    testUser = await createConfirmedTestUser(config);
    result.userCreated = true;
    const { userId, accessToken } = testUser;

    const anonJournal = await requestJson(`${config.url}/rest/v1/journal_entries`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        title: 'Anon should fail',
        content: 'RLS should reject this write.'
      })
    });
    result.rls.anonJournalInsertDenied = !anonJournal.response.ok;

    const journalInsert = await requestJson(`${config.url}/rest/v1/journal_entries?select=id,user_id,title,content`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        title: 'CubiQo E2E Journal',
        content: 'Quick intake and Core guided journal summary save/read test.',
        responses: ['intake', 'core answer'],
        rgy_color: 'green',
        mood: 'focused',
        tags: ['e2e', 'guided-journal'],
        word_count: 9
      })
    });
    const journalRow = Array.isArray(journalInsert.body) ? journalInsert.body[0] : null;
    result.journal.inserted = journalInsert.response.ok && journalRow?.id && journalRow.user_id === userId;

    const journalRead = journalRow?.id ? await requestJson(`${config.url}/rest/v1/journal_entries?id=eq.${journalRow.id}&select=id,user_id,title,content&limit=1`, {
      headers: userHeaders(config, accessToken)
    }) : null;
    result.journal.read = Boolean(journalRead?.response.ok && Array.isArray(journalRead.body) && journalRead.body[0]?.id === journalRow.id);

    const journalDelete = journalRow?.id ? await requestJson(`${config.url}/rest/v1/journal_entries?id=eq.${journalRow.id}`, {
      method: 'DELETE',
      headers: userHeaders(config, accessToken)
    }) : null;
    result.journal.deleted = Boolean(journalDelete?.response.ok);

    const anonSignal = await requestJson(`${config.url}/rest/v1/signals`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        color: 'yellow',
        keyword: 'anon should fail',
        normalized_keyword: 'anon-should-fail'
      })
    });
    result.rls.anonSignalInsertDenied = !anonSignal.response.ok;

    const signalInsert = await requestJson(`${config.url}/rest/v1/signals?select=id,user_id,color,keyword,confirmed_intents`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        color: 'green',
        keyword: 'career',
        normalized_keyword: 'career',
        intent_status: 'confirmed',
        suggested_intents: ['collaborate'],
        confirmed_intents: ['collaborate'],
        source: 'e2e'
      })
    });
    const signalRow = Array.isArray(signalInsert.body) ? signalInsert.body[0] : null;
    result.signals.inserted = signalInsert.response.ok && signalRow?.id && signalRow.user_id === userId;

    const signalRead = signalRow?.id ? await requestJson(`${config.url}/rest/v1/signals?id=eq.${signalRow.id}&select=id,user_id,color,keyword,confirmed_intents&limit=1`, {
      headers: userHeaders(config, accessToken)
    }) : null;
    result.signals.read = Boolean(signalRead?.response.ok && Array.isArray(signalRead.body) && signalRead.body[0]?.id === signalRow.id);

    const signalDelete = signalRow?.id ? await requestJson(`${config.url}/rest/v1/signals?id=eq.${signalRow.id}`, {
      method: 'DELETE',
      headers: userHeaders(config, accessToken)
    }) : null;
    result.signals.deleted = Boolean(signalDelete?.response.ok);
  } catch (error) {
    result.error = error.message || String(error);
  } finally {
    if (testUser?.userId) await deleteTestUser(config, testUser.userId);
  }

  result.ok = result.userCreated &&
    result.journal.inserted && result.journal.read && result.journal.deleted &&
    result.signals.inserted && result.signals.read && result.signals.deleted &&
    result.rls.anonJournalInsertDenied && result.rls.anonSignalInsertDenied;

  return result;
}

function makeMockResponse() {
  let resolveResult;
  const result = new Promise((resolve) => {
    resolveResult = resolve;
  });
  const res = {
    headers: {},
    code: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      resolveResult({ status: this.code, payload });
    },
    end() {
      resolveResult({ status: this.code, payload: null });
    }
  };
  return { res, result };
}

async function callLocalConverse(message) {
  const handler = require(path.join(repoRoot, 'api', 'converse.js'));
  const { res, result } = makeMockResponse();
  await handler(
    { method: 'POST', body: { message, model: 'local', diagnostics: true }, query: {} },
    res
  );
  return result;
}

function assertKeyword(payload, color, expected) {
  const haystack = new Set([...(payload.keywords?.[color] || []), ...(payload.rgy?.keywords?.[color] || [])]);
  return expected.some(word => haystack.has(word));
}

async function verifyRgy() {
  const cases = [
    {
      name: 'green help/activity',
      message: 'Help me build my LinkedIn career yoga wellness vibe.',
      color: 'green',
      expected: ['linkedin', 'career', 'yoga', 'wellness', 'vibe']
    },
    {
      name: 'yellow comfort/social',
      message: 'I want a laid back comfort chat about Instagram and Facebook posts.',
      color: 'yellow',
      expected: ['instagram', 'facebook', 'comfort']
    },
    {
      name: 'red adult-gated',
      message: 'Keep this private and classify Grindr Tinder hookup planning.',
      color: 'red',
      expected: ['grindr', 'tinder', 'hookup']
    }
  ];

  const results = [];
  for (const item of cases) {
    const { status, payload } = await callLocalConverse(item.message);
    results.push({
      name: item.name,
      ok: status === 200 &&
        payload?.rgy?.color === item.color &&
        assertKeyword(payload, item.color, item.expected),
      status,
      color: payload?.rgy?.color,
      ageGate: Boolean(payload?.rgy?.age_gate_required),
      keywords: payload?.keywords
    });
  }
  return results;
}

function verifyFrontendSecretBoundary() {
  const filesToCheck = [
    path.join(repoRoot, 'frontend', 'src', 'App.js'),
    path.join(repoRoot, 'frontend', 'src', 'lib', 'supabase.js'),
    path.join(repoRoot, 'src', 'components', 'CubiQoNextShell.tsx')
  ];
  const forbidden = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'service_role',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'ELEVENLABS_API_KEY'
  ];

  const hits = [];
  for (const file of filesToCheck) {
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    for (const token of forbidden) {
      if (source.includes(token)) {
        hits.push({ file: path.relative(repoRoot, file), token });
      }
    }
  }

  return {
    ok: hits.length === 0,
    hits
  };
}

async function main() {
  const config = readAppSupabaseConfig();
  if (!config.url || !config.anonKey) {
    throw new Error('Missing Supabase URL or anon key');
  }

  const signup = await verifySignup(config);
  const tables = [];
  for (const table of ['profiles', 'user_activity_keywords', 'conversation_events', 'journal_entries', 'signals']) {
    tables.push(await verifyTable(config, table));
  }
  const userOwnedCrud = await verifyUserOwnedCrud(config);
  const rgy = await verifyRgy();
  const frontendSecretBoundary = verifyFrontendSecretBoundary();

  const report = {
    supabaseProject: config.url,
    signup,
    tables,
    userOwnedCrud,
    rgy,
    frontendSecretBoundary,
    passed: signup.ok && tables.every(table => table.ok) && userOwnedCrud.ok && rgy.every(item => item.ok) && frontendSecretBoundary.ok
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
