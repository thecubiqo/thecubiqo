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
  if (!serviceRoleKey) {
    return {
      ok: false,
      status: 0,
      mode: 'admin-confirmed-user-required',
      email: null,
      userId: null,
      profileCreated: null,
      confirmedSessionReturned: false,
      cleanup: 'not available',
      error: 'Service role key is required for auth/profile verification without sending email'
    };
  }

  const email = process.env.E2E_EMAIL || `codex-e2e-${Date.now()}@example.invalid`;
  const password = process.env.E2E_PASSWORD || `Cqai-${Date.now()}-test!`;
  const { response, body } = await requestJson(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, email_confirm: true })
  });

  let userId = body?.user?.id || body?.id || null;
  let ok = response.ok && Boolean(userId);
  let mode = 'admin-confirmed-no-email';
  let error = ok ? null : (body?.msg || body?.message || body?.error_description || body?.error || body?.raw || 'unknown');

  let profileCreated = null;
  if (userId) {
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

  if (userId && !process.env.E2E_KEEP_USER) {
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
    confirmedSessionReturned: false,
    cleanup: userId && !process.env.E2E_KEEP_USER ? 'attempted' : 'not available',
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
  const email = `codex-crud-${Date.now()}@example.invalid`;
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
    v2: {
      anonApprovalInsertDenied: false,
      approvalRequested: false,
      approvalDenied: false,
      deniedActionDidNotExecute: false,
      approvalApproved: false,
      taskBlockedWithoutApproval: false,
      taskInserted: false,
      taskRead: false,
      taskUpdated: false,
      userAuditInsertDenied: false,
      scheduleInserted: false,
      reportInserted: false,
      anonBrowserSessionInsertDenied: false,
      browserBlockedWithoutApproval: false,
      browserApprovalApproved: false,
      browserDirectInsertDeniedAfterApproval: false,
      browserSessionServerInsertWithApproval: false
    },
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

    const anonApproval = await requestJson(`${config.url}/rest/v1/action_approvals`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        action_type: 'task_write',
        tool_name: 'task_write',
        title: 'Anon should fail',
        summary: 'RLS should reject this approval.'
      })
    });
    result.v2.anonApprovalInsertDenied = !anonApproval.response.ok;

    const deniedApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'task_write',
        tool_name: 'task_write',
        title: 'Denied task test',
        summary: 'This approval will be denied to verify no action executes.',
        payload: { title: 'Should not exist' }
      })
    });
    const deniedApproval = Array.isArray(deniedApprovalInsert.body) ? deniedApprovalInsert.body[0] : null;
    result.v2.approvalRequested = deniedApprovalInsert.response.ok && deniedApproval?.id && deniedApproval.user_id === userId;

    const deniedApprovalUpdate = deniedApproval?.id ? await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${deniedApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
      method: 'PATCH',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({ status: 'denied', decided_at: new Date().toISOString() })
    }) : null;
    result.v2.approvalDenied = Boolean(deniedApprovalUpdate?.response.ok);

    const deniedTaskAttempt = deniedApproval?.id ? await requestJson(`${config.url}/rest/v1/user_tasks`, {
      method: 'POST',
      headers: userHeaders(config, accessToken),
      body: JSON.stringify({
        user_id: userId,
        approval_id: deniedApproval.id,
        title: 'Denied approval should not allow task',
        source: 'e2e_denied'
      })
    }) : null;
    result.v2.deniedActionDidNotExecute = Boolean(deniedTaskAttempt && !deniedTaskAttempt.response.ok);

    const approvedTaskApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'task_write',
        tool_name: 'task_write',
        title: 'Approved task test',
        summary: 'Create one task after explicit approval.',
        payload: { title: 'CubiQo V2 approved task' }
      })
    });
    const approvedTaskApproval = Array.isArray(approvedTaskApprovalInsert.body) ? approvedTaskApprovalInsert.body[0] : null;
    const approvedTaskUpdate = approvedTaskApproval?.id ? await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${approvedTaskApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
      method: 'PATCH',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
    }) : null;
    result.v2.approvalApproved = Boolean(approvedTaskUpdate?.response.ok);

    const taskBlocked = await requestJson(`${config.url}/rest/v1/user_tasks`, {
      method: 'POST',
      headers: userHeaders(config, accessToken),
      body: JSON.stringify({
        user_id: userId,
        title: 'Missing approval should fail',
        source: 'e2e_missing_approval'
      })
    });
    result.v2.taskBlockedWithoutApproval = !taskBlocked.response.ok;

    const taskInsert = approvedTaskApproval?.id ? await requestJson(`${config.url}/rest/v1/user_tasks?select=id,user_id,title,status`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: approvedTaskApproval.id,
        title: 'CubiQo V2 approved task',
        status: 'open',
        source: 'e2e'
      })
    }) : null;
    const taskRow = Array.isArray(taskInsert?.body) ? taskInsert.body[0] : null;
    result.v2.taskInserted = Boolean(taskInsert?.response.ok && taskRow?.id && taskRow.user_id === userId);

    const taskRead = taskRow?.id ? await requestJson(`${config.url}/rest/v1/user_tasks?id=eq.${taskRow.id}&select=id,user_id,title,status&limit=1`, {
      headers: userHeaders(config, accessToken)
    }) : null;
    result.v2.taskRead = Boolean(taskRead?.response.ok && Array.isArray(taskRead.body) && taskRead.body[0]?.id === taskRow.id);

    const taskUpdate = taskRow?.id ? await requestJson(`${config.url}/rest/v1/user_tasks?id=eq.${taskRow.id}&user_id=eq.${userId}&select=id,status`, {
      method: 'PATCH',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({ status: 'done' })
    }) : null;
    result.v2.taskUpdated = Boolean(taskUpdate?.response.ok && Array.isArray(taskUpdate.body) && taskUpdate.body[0]?.status === 'done');

    const auditInsert = approvedTaskApproval?.id ? await requestJson(`${config.url}/rest/v1/action_audit_logs?select=id,user_id,status`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: approvedTaskApproval.id,
        action_type: 'task_write',
        tool_name: 'task_write',
        status: 'completed',
        message: 'E2E task write completed',
        result: { task_id: taskRow?.id || null }
      })
    }) : null;
    result.v2.userAuditInsertDenied = Boolean(auditInsert && !auditInsert.response.ok);

    const scheduleApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'cron_schedule_create',
        tool_name: 'cron_schedule_create',
        title: 'Report schedule test',
        summary: 'Create an in-app report schedule.',
        payload: { cadence: 'daily' }
      })
    });
    const scheduleApproval = Array.isArray(scheduleApprovalInsert.body) ? scheduleApprovalInsert.body[0] : null;
    if (scheduleApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${scheduleApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }
    const scheduleInsert = scheduleApproval?.id ? await requestJson(`${config.url}/rest/v1/report_schedules?select=id,user_id,name,cadence,delivery_method`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: scheduleApproval.id,
        name: 'E2E in-app report',
        cadence: 'daily',
        delivery_method: 'in_app',
        status: 'active'
      })
    }) : null;
    const scheduleRow = Array.isArray(scheduleInsert?.body) ? scheduleInsert.body[0] : null;
    result.v2.scheduleInserted = Boolean(scheduleInsert?.response.ok && scheduleRow?.id && scheduleRow.user_id === userId && scheduleRow.delivery_method === 'in_app');

    const reportApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'self_report_create',
        tool_name: 'self_report_create',
        title: 'Self report test',
        summary: 'Create an in-app self report.',
        payload: { delivery_method: 'in_app' }
      })
    });
    const reportApproval = Array.isArray(reportApprovalInsert.body) ? reportApprovalInsert.body[0] : null;
    if (reportApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${reportApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }
    const reportInsert = reportApproval?.id ? await requestJson(`${config.url}/rest/v1/daily_reports?select=id,user_id,status,content`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: reportApproval.id,
        schedule_id: scheduleRow?.id || null,
        title: 'E2E self report',
        content: 'Truthful in-app report. No external delivery was attempted.',
        status: 'ready'
      })
    }) : null;
    const reportRow = Array.isArray(reportInsert?.body) ? reportInsert.body[0] : null;
    result.v2.reportInserted = Boolean(reportInsert?.response.ok && reportRow?.id && reportRow.user_id === userId);

    const anonBrowserSession = await requestJson(`${config.url}/rest/v1/browser_sessions`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        target_url: 'https://example.com/',
        current_url: 'https://example.com/',
        allowed_origin: 'https://example.com'
      })
    });
    result.v2.anonBrowserSessionInsertDenied = !anonBrowserSession.response.ok;

    const browserBlocked = await requestJson(`${config.url}/rest/v1/browser_sessions`, {
      method: 'POST',
      headers: userHeaders(config, accessToken),
      body: JSON.stringify({
        user_id: userId,
        target_url: 'https://example.com/',
        current_url: 'https://example.com/',
        allowed_origin: 'https://example.com'
      })
    });
    result.v2.browserBlockedWithoutApproval = !browserBlocked.response.ok;

    const browserApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'browser_open',
        tool_name: 'browser_open',
        title: 'Browser session test',
        summary: 'Open an isolated browser-control session container.',
        payload: { url: 'https://example.com/' },
        risk_level: 'medium'
      })
    });
    const browserApproval = Array.isArray(browserApprovalInsert.body) ? browserApprovalInsert.body[0] : null;
    const browserApprovalUpdate = browserApproval?.id ? await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${browserApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
      method: 'PATCH',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
    }) : null;
    result.v2.browserApprovalApproved = Boolean(browserApprovalUpdate?.response.ok);

    const browserDirectInsertAfterApproval = browserApproval?.id ? await requestJson(`${config.url}/rest/v1/browser_sessions?select=id,user_id,approval_id,status,target_url,allowed_origin`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: browserApproval.id,
        status: 'active',
        target_url: 'https://example.com/',
        current_url: 'https://example.com/',
        allowed_origin: 'https://example.com',
        metadata: { source: 'e2e' }
      })
    }) : null;
    result.v2.browserDirectInsertDeniedAfterApproval = Boolean(browserDirectInsertAfterApproval && !browserDirectInsertAfterApproval.response.ok);

    const browserServerInsert = browserApproval?.id ? await requestJson(`${config.url}/rest/v1/browser_sessions?select=id,user_id,approval_id,status,target_url,allowed_origin`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: browserApproval.id,
        status: 'active',
        target_url: 'https://example.com/',
        current_url: 'https://example.com/',
        allowed_origin: 'https://example.com',
        metadata: { source: 'e2e-server-boundary' }
      })
    }) : null;
    const browserSessionRow = Array.isArray(browserServerInsert?.body) ? browserServerInsert.body[0] : null;
    result.v2.browserSessionServerInsertWithApproval = Boolean(
      browserServerInsert?.response.ok &&
      browserSessionRow?.id &&
      browserSessionRow.user_id === userId &&
      browserSessionRow.approval_id === browserApproval.id
    );
  } catch (error) {
    result.error = error.message || String(error);
  } finally {
    if (testUser?.userId) await deleteTestUser(config, testUser.userId);
  }

  result.ok = result.userCreated &&
    result.journal.inserted && result.journal.read && result.journal.deleted &&
    result.signals.inserted && result.signals.read && result.signals.deleted &&
    result.rls.anonJournalInsertDenied && result.rls.anonSignalInsertDenied &&
    Object.values(result.v2).every(Boolean);

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
  for (const table of [
    'profiles',
    'user_activity_keywords',
    'conversation_events',
    'journal_entries',
    'signals',
    'action_approvals',
    'action_audit_logs',
    'user_tool_settings',
    'user_tasks',
    'report_schedules',
    'daily_reports',
    'browser_sessions'
  ]) {
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
