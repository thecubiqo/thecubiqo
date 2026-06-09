import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { randomUUID } from 'crypto';

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

function isRequiredTableHealthy(tableResult) {
  return tableResult.ok || tableResult.optional === true;
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
      browserSessionServerInsertWithApproval: false,
      anonJobListingInsertDenied: false,
      jobListingDirectInsertDenied: false,
      jobListingServerInsertWithApproval: false,
      jobReviewDirectInsertDenied: false,
      jobReviewServerInsertWithApproval: false,
      jobReviewServerApproveWithSubmitApproval: false,
      anonJobApplicationInsertDenied: false,
      jobApplicationDirectInsertDenied: false,
      jobApplicationServerInsertWithApproval: false,
      anonJobProfileInsertDenied: false,
      jobProfileDirectUpsertDenied: false,
      jobProfileServerUpsertWithApproval: false,
      anonResumeVersionInsertDenied: false,
      resumeVersionDirectInsertDenied: false,
      resumeVersionServerAppendWithApproval: false,
      secondResumeVersionAppended: false,
      anonPodBriefInsertDenied: false,
      podBriefDirectInsertDenied: false,
      podBriefServerInsertWithApproval: false,
      anonGfxToolsJobInsertDenied: false,
      gfxToolsJobDirectInsertDenied: false,
      gfxToolsJobServerInsertWithApproval: false,
      anonGfxAssetInsertDenied: false,
      gfxAssetDirectInsertDenied: false,
      gfxAssetServerInsertWithApproval: false,
      assetReadyEventServerInsertWithApproval: false,
      shopifyPreparationDirectInsertDenied: false,
      shopifyPreparationServerInsertWithApproval: false,
      printifyPreparationDirectInsertDenied: false,
      printifyPreparationServerInsertWithApproval: false,
      anonSocialDraftInsertDenied: false,
      socialDraftDirectInsertDenied: false,
      socialDraftServerInsertWithApproval: false,
      anonSocialRuleInsertDenied: false,
      socialRuleDirectInsertDenied: false,
      socialRuleServerInsertWithApproval: false,
      socialScheduledPostServerInsertWithApproval: false,
      socialFireLogServerInsertWithApproval: false,
      anonSocialPostInsertDenied: false,
      socialPostDirectInsertDenied: false,
      socialPostServerInsertWithApproval: false,
      anonStoreConnectionInsertDenied: false,
      storeConnectionDirectInsertDenied: false,
      storeConnectionServerInsertWithToken: false,
      storeConnectionTokenHiddenFromUserRead: false,
      connectorOauthStateServerInsert: false,
      podProductDirectInsertDenied: false,
      podProductServerInsertWithApproval: false,
      podProductRead: false
    },
    rls: { anonJournalInsertDenied: false, anonSignalInsertDenied: false },
    error: null
  };

  let testUser = null;
  try {
    testUser = await createConfirmedTestUser(config);
    result.userCreated = true;
    const { userId, accessToken, email } = testUser;

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

    const directSignalInsert = await requestJson(`${config.url}/rest/v1/signals`, {
      method: 'POST',
      headers: userHeaders(config, accessToken),
      body: JSON.stringify({
        user_id: userId,
        color: 'green',
        keyword: 'direct should fail',
        normalized_keyword: 'direct-should-fail',
        intent_status: 'pending',
        source: 'e2e'
      })
    });
    result.rls.userSignalInsertDenied = !directSignalInsert.response.ok;

    const signalInsert = await requestJson(`${config.url}/rest/v1/signals?select=id,signal_id,user_id,color,keyword,confirmed_intents,matching_enabled`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        color: 'green',
        keyword: 'career',
        normalized_keyword: 'career',
        intent_status: 'confirmed',
        suggested_intents: ['collaborate'],
        confirmed_intents: ['collaborate'],
        source: 'taxonomy'
      })
    });
    const signalRow = Array.isArray(signalInsert.body) ? signalInsert.body[0] : null;
    result.signals.inserted = signalInsert.response.ok && signalRow?.id && signalRow?.signal_id && signalRow.user_id === userId && signalRow.matching_enabled === true;

    const signalRead = signalRow?.id ? await requestJson(`${config.url}/rest/v1/signals?id=eq.${signalRow.id}&select=id,user_id,color,keyword,confirmed_intents,matching_enabled&limit=1`, {
      headers: userHeaders(config, accessToken)
    }) : null;
    result.signals.read = Boolean(signalRead?.response.ok && Array.isArray(signalRead.body) && signalRead.body[0]?.id === signalRow.id && signalRead.body[0]?.matching_enabled === true);

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

    const anonJobListing = await requestJson(`${config.url}/rest/v1/job_listings`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        source_platform: 'linkedin',
        title: 'Anon blocked role',
        company: 'Blocked Co'
      })
    });
    result.v2.anonJobListingInsertDenied = !anonJobListing.response.ok;

    const jobSearchApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'job_search_save',
        tool_name: 'job_search_save',
        title: 'Save job search test',
        summary: 'Save extracted LinkedIn, Indeed, and Dice listings.',
        payload: { sourcePlatform: 'linkedin' },
        risk_level: 'medium'
      })
    });
    const jobSearchApproval = Array.isArray(jobSearchApprovalInsert.body) ? jobSearchApprovalInsert.body[0] : null;
    if (jobSearchApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${jobSearchApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directJobListing = jobSearchApproval?.id ? await requestJson(`${config.url}/rest/v1/job_listings?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: jobSearchApproval.id,
        browser_session_id: browserSessionRow?.id || null,
        source_platform: 'linkedin',
        title: 'Direct client should fail',
        company: 'Blocked Co',
        source_url: 'https://www.linkedin.com/jobs/view/direct-fail',
        apply_url: 'https://www.linkedin.com/jobs/view/direct-fail'
      })
    }) : null;
    result.v2.jobListingDirectInsertDenied = Boolean(directJobListing && !directJobListing.response.ok);

    const serverJobListing = jobSearchApproval?.id ? await requestJson(`${config.url}/rest/v1/job_listings?select=id,user_id,approval_id,source_platform,title,company`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: jobSearchApproval.id,
        browser_session_id: browserSessionRow?.id || null,
        source_platform: 'linkedin',
        title: 'E2E Product Manager',
        company: 'Example Jobs Co',
        location: 'Remote',
        source_url: 'https://www.linkedin.com/jobs/view/e2e-product-manager',
        apply_url: 'https://www.linkedin.com/jobs/view/e2e-product-manager',
        raw: { source: 'verify:cqai' }
      })
    }) : null;
    const jobListingRow = Array.isArray(serverJobListing?.body) ? serverJobListing.body[0] : null;
    result.v2.jobListingServerInsertWithApproval = Boolean(
      serverJobListing?.response.ok &&
      jobListingRow?.id &&
      jobListingRow.user_id === userId &&
      jobListingRow.approval_id === jobSearchApproval?.id &&
      jobListingRow.source_platform === 'linkedin'
    );

    const prepareApprovalInsert = jobListingRow?.id ? await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'job_application_prepare',
        tool_name: 'job_application_prepare',
        title: 'Prepare job application test',
        summary: 'Prepare a review card before submission.',
        payload: { job_listing_id: jobListingRow.id },
        risk_level: 'medium'
      })
    }) : null;
    const prepareApproval = Array.isArray(prepareApprovalInsert?.body) ? prepareApprovalInsert.body[0] : null;
    if (prepareApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${prepareApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directReview = prepareApproval?.id ? await requestJson(`${config.url}/rest/v1/job_application_reviews?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: prepareApproval.id,
        browser_session_id: browserSessionRow?.id || null,
        job_listing_id: jobListingRow.id,
        source_platform: 'linkedin',
        status: 'prepared',
        submission_payload: { job: { title: 'Direct client should fail' } }
      })
    }) : null;
    result.v2.jobReviewDirectInsertDenied = Boolean(directReview && !directReview.response.ok);

    const serverReview = prepareApproval?.id ? await requestJson(`${config.url}/rest/v1/job_application_reviews?select=id,user_id,approval_id,job_listing_id,status,external_submission_performed`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: prepareApproval.id,
        browser_session_id: browserSessionRow?.id || null,
        job_listing_id: jobListingRow.id,
        source_platform: 'linkedin',
        status: 'prepared',
        candidate_name: 'E2E Candidate',
        candidate_email: email,
        resume_summary: 'E2E resume summary',
        cover_letter: 'E2E cover letter',
        answers: [{ question: 'Why this role?', answer: 'E2E answer' }],
        submission_payload: {
          job: { title: jobListingRow.title, company: jobListingRow.company },
          candidate: { name: 'E2E Candidate', email },
          coverLetter: 'E2E cover letter'
        }
      })
    }) : null;
    const reviewRow = Array.isArray(serverReview?.body) ? serverReview.body[0] : null;
    result.v2.jobReviewServerInsertWithApproval = Boolean(
      serverReview?.response.ok &&
      reviewRow?.id &&
      reviewRow.user_id === userId &&
      reviewRow.approval_id === prepareApproval?.id &&
      reviewRow.status === 'prepared' &&
      reviewRow.external_submission_performed === false
    );

    const submitApprovalInsert = reviewRow?.id ? await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'job_application_submit_approved',
        tool_name: 'job_application_submit_approved',
        title: 'Approve prepared application test',
        summary: 'Approve a prepared application package without external auto-submit.',
        payload: { review_id: reviewRow.id },
        risk_level: 'high'
      })
    }) : null;
    const submitApproval = Array.isArray(submitApprovalInsert?.body) ? submitApprovalInsert.body[0] : null;
    if (submitApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${submitApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }
    const reviewApprove = submitApproval?.id ? await requestJson(`${config.url}/rest/v1/job_application_reviews?id=eq.${reviewRow.id}&user_id=eq.${userId}&select=id,status,submit_approval_id,external_submission_performed,approved_at`, {
      method: 'PATCH',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        status: 'approved_for_submission',
        submit_approval_id: submitApproval.id,
        approved_at: new Date().toISOString(),
        external_submission_performed: false
      })
    }) : null;
    const approvedReviewRow = Array.isArray(reviewApprove?.body) ? reviewApprove.body[0] : null;
    result.v2.jobReviewServerApproveWithSubmitApproval = Boolean(
      reviewApprove?.response.ok &&
      approvedReviewRow?.status === 'approved_for_submission' &&
      approvedReviewRow.submit_approval_id === submitApproval?.id &&
      approvedReviewRow.external_submission_performed === false
    );

    const anonJobApplication = await requestJson(`${config.url}/rest/v1/job_applications`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        browser_session_id: browserSessionRow?.id || crypto.randomUUID(),
        platform: 'linkedin',
        job_url: 'https://www.linkedin.com/jobs/view/anon-blocked',
        status: 'in_progress'
      })
    });
    result.v2.anonJobApplicationInsertDenied = !anonJobApplication.response.ok;

    const jobApplyApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type,browser_session_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'job_apply',
        tool_name: 'job_apply',
        title: 'Prepare job apply workflow test',
        summary: 'Open a persistent browser session and stop at the review screen before final submit.',
        payload: {
          job_url: 'https://www.linkedin.com/jobs/view/e2e-product-manager',
          platform: 'linkedin',
          stopBeforeSubmit: true
        },
        browser_session_id: crypto.randomUUID(),
        risk_level: 'high'
      })
    });
    const jobApplyApproval = Array.isArray(jobApplyApprovalInsert.body) ? jobApplyApprovalInsert.body[0] : null;
    if (jobApplyApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${jobApplyApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directJobApplication = jobApplyApproval?.id ? await requestJson(`${config.url}/rest/v1/job_applications?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: jobApplyApproval.id,
        browser_session_id: jobApplyApproval.browser_session_id || browserSessionRow?.id || crypto.randomUUID(),
        platform: 'linkedin',
        job_url: 'https://www.linkedin.com/jobs/view/direct-blocked',
        status: 'in_progress'
      })
    }) : null;
    result.v2.jobApplicationDirectInsertDenied = Boolean(directJobApplication && !directJobApplication.response.ok);

    const serverJobApplication = jobApplyApproval?.id ? await requestJson(`${config.url}/rest/v1/job_applications?select=id,user_id,approval_id,browser_session_id,platform,job_url,status,screenshot_url`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: jobApplyApproval.id,
        browser_session_id: jobApplyApproval.browser_session_id || browserSessionRow?.id || crypto.randomUUID(),
        platform: 'linkedin',
        job_url: 'https://www.linkedin.com/jobs/view/e2e-product-manager',
        job_title: 'E2E Product Manager',
        company: 'Example Jobs Co',
        status: 'ready_to_submit',
        screenshot_url: 'https://example.com/e2e-job-apply-review.png',
        metadata: { stop_before_submit: true, finalSubmitAutonomous: false }
      })
    }) : null;
    const jobApplicationRow = Array.isArray(serverJobApplication?.body) ? serverJobApplication.body[0] : null;
    result.v2.jobApplicationServerInsertWithApproval = Boolean(
      serverJobApplication?.response.ok &&
      jobApplicationRow?.id &&
      jobApplicationRow.user_id === userId &&
      jobApplicationRow.approval_id === jobApplyApproval?.id &&
      jobApplicationRow.status === 'ready_to_submit' &&
      jobApplicationRow.screenshot_url
    );

    const anonJobProfile = await requestJson(`${config.url}/rest/v1/job_profiles`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        target_roles: ['Anon should fail'],
        skills: ['blocked']
      })
    });
    result.v2.anonJobProfileInsertDenied = !anonJobProfile.response.ok;

    const profileApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'job_profile_write',
        tool_name: 'job_profile_write',
        title: 'Write job profile test',
        summary: 'Approve a job profile preview before saving.',
        payload: {
          previewCard: {
            before: null,
            after: { targetRoles: ['Product Manager'], skills: ['AI workflows'] },
            changes: ['Create first job profile']
          }
        },
        risk_level: 'medium'
      })
    });
    const profileApproval = Array.isArray(profileApprovalInsert.body) ? profileApprovalInsert.body[0] : null;
    if (profileApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${profileApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directProfileUpsert = profileApproval?.id ? await requestJson(`${config.url}/rest/v1/job_profiles?on_conflict=user_id&select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: profileApproval.id,
        target_roles: ['Direct client should fail'],
        skills: ['blocked'],
        preview_card: { after: { targetRoles: ['Direct client should fail'] } }
      })
    }) : null;
    result.v2.jobProfileDirectUpsertDenied = Boolean(directProfileUpsert && !directProfileUpsert.response.ok);

    const serverProfileUpsert = profileApproval?.id ? await requestJson(`${config.url}/rest/v1/job_profiles?on_conflict=user_id&select=id,user_id,approval_id,target_roles,skills`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: profileApproval.id,
        target_roles: ['Product Manager', 'AI Program Manager'],
        skills: ['AI workflows', 'product strategy'],
        experience_summary: 'E2E job profile summary',
        years_experience: 10,
        preferred_locations: ['Remote'],
        work_modes: ['remote'],
        salary_expectation: 'Review before sharing',
        profile_payload: { source: 'verify:cqai' },
        preview_card: { before: null, after: { targetRoles: ['Product Manager', 'AI Program Manager'] } }
      })
    }) : null;
    const profileRow = Array.isArray(serverProfileUpsert?.body) ? serverProfileUpsert.body[0] : null;
    result.v2.jobProfileServerUpsertWithApproval = Boolean(
      serverProfileUpsert?.response.ok &&
      profileRow?.id &&
      profileRow.user_id === userId &&
      profileRow.approval_id === profileApproval?.id &&
      Array.isArray(profileRow.target_roles) &&
      profileRow.target_roles.includes('Product Manager')
    );

    const anonResumeVersion = await requestJson(`${config.url}/rest/v1/resume_versions`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        name: 'Anon should fail',
        resume_content: 'RLS should reject this resume version.'
      })
    });
    result.v2.anonResumeVersionInsertDenied = !anonResumeVersion.response.ok;

    const resumeApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'resume_version_write',
        tool_name: 'resume_version_write',
        title: 'Write resume version test',
        summary: 'Approve a resume diff before appending a version.',
        payload: {
          previewCard: {
            before: null,
            after: { name: 'E2E Resume Version 1' },
            changes: ['Append first resume version']
          }
        },
        risk_level: 'medium'
      })
    });
    const resumeApproval = Array.isArray(resumeApprovalInsert.body) ? resumeApprovalInsert.body[0] : null;
    if (resumeApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${resumeApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directResumeVersion = resumeApproval?.id ? await requestJson(`${config.url}/rest/v1/resume_versions?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: resumeApproval.id,
        job_profile_id: profileRow?.id || null,
        name: 'Direct client should fail',
        resume_content: 'RLS should reject direct client resume writes.',
        diff_preview: { after: { name: 'Direct client should fail' } }
      })
    }) : null;
    result.v2.resumeVersionDirectInsertDenied = Boolean(directResumeVersion && !directResumeVersion.response.ok);

    const serverResumeVersion = resumeApproval?.id ? await requestJson(`${config.url}/rest/v1/resume_versions?select=id,user_id,approval_id,job_profile_id,name,resume_content`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: resumeApproval.id,
        job_profile_id: profileRow?.id || null,
        name: 'E2E Resume Version 1',
        resume_content: 'E2E resume content version one.',
        resume_format: 'plain_text',
        target_role: 'Product Manager',
        change_summary: 'Append first version.',
        diff_preview: { before: null, after: { name: 'E2E Resume Version 1' } },
        source_payload: { source: 'verify:cqai' }
      })
    }) : null;
    const resumeRow = Array.isArray(serverResumeVersion?.body) ? serverResumeVersion.body[0] : null;
    result.v2.resumeVersionServerAppendWithApproval = Boolean(
      serverResumeVersion?.response.ok &&
      resumeRow?.id &&
      resumeRow.user_id === userId &&
      resumeRow.approval_id === resumeApproval?.id &&
      resumeRow.name === 'E2E Resume Version 1'
    );

    const secondResumeVersion = resumeApproval?.id ? await requestJson(`${config.url}/rest/v1/resume_versions?select=id,user_id,approval_id,name`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: resumeApproval.id,
        job_profile_id: profileRow?.id || null,
        name: 'E2E Resume Version 2',
        resume_content: 'E2E resume content version two.',
        resume_format: 'plain_text',
        target_role: 'AI Program Manager',
        change_summary: 'Append second version.',
        diff_preview: { before: { name: 'E2E Resume Version 1' }, after: { name: 'E2E Resume Version 2' } },
        source_payload: { source: 'verify:cqai', appendOnly: true }
      })
    }) : null;
    const secondResumeRow = Array.isArray(secondResumeVersion?.body) ? secondResumeVersion.body[0] : null;
    const resumeRead = secondResumeRow?.id ? await requestJson(`${config.url}/rest/v1/resume_versions?user_id=eq.${userId}&select=id,name`, {
      headers: userHeaders(config, accessToken)
    }) : null;
    result.v2.secondResumeVersionAppended = Boolean(
      secondResumeVersion?.response.ok &&
      secondResumeRow?.id &&
      Array.isArray(resumeRead?.body) &&
      resumeRead.body.some(row => row.name === 'E2E Resume Version 1') &&
      resumeRead.body.some(row => row.name === 'E2E Resume Version 2')
    );

    const anonPodBrief = await requestJson(`${config.url}/rest/v1/pod_design_briefs`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        product_type: 'Anon blocked shirt',
        prompt: 'RLS should reject this POD brief.'
      })
    });
    result.v2.anonPodBriefInsertDenied = !anonPodBrief.response.ok;

    const podBriefApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'pod_design_brief_create',
        tool_name: 'pod_design_brief_create',
        title: 'Create POD brief test',
        summary: 'Approve a POD brief preview before saving.',
        payload: {
          previewCard: {
            before: null,
            after: { productType: 'premium t-shirt', prompt: 'E2E POD prompt' },
            changes: ['Create POD brief']
          }
        },
        risk_level: 'medium'
      })
    });
    const podBriefApproval = Array.isArray(podBriefApprovalInsert.body) ? podBriefApprovalInsert.body[0] : null;
    if (podBriefApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${podBriefApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directPodBrief = podBriefApproval?.id ? await requestJson(`${config.url}/rest/v1/pod_design_briefs?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: podBriefApproval.id,
        product_type: 'Direct client should fail',
        prompt: 'RLS should reject direct POD brief writes.',
        creative_brief: { source: 'direct-client' },
        preview_card: { after: { productType: 'Direct client should fail' } }
      })
    }) : null;
    result.v2.podBriefDirectInsertDenied = Boolean(directPodBrief && !directPodBrief.response.ok);

    const serverPodBrief = podBriefApproval?.id ? await requestJson(`${config.url}/rest/v1/pod_design_briefs?select=id,user_id,approval_id,product_type,prompt`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: podBriefApproval.id,
        brand_name: 'E2E Brand',
        product_type: 'premium t-shirt',
        target_audience: 'Founders',
        style_keywords: ['minimal', 'premium'],
        color_palette: ['black', 'teal'],
        placement: 'front chest',
        prompt: 'E2E POD prompt',
        negative_prompt: 'No clutter',
        fulfillment_targets: ['Printify'],
        marketing_angles: ['AI founder apparel'],
        creative_brief: { prompt: 'E2E POD prompt' },
        preview_card: { after: { productType: 'premium t-shirt' } }
      })
    }) : null;
    const podBriefRow = Array.isArray(serverPodBrief?.body) ? serverPodBrief.body[0] : null;
    result.v2.podBriefServerInsertWithApproval = Boolean(
      serverPodBrief?.response.ok &&
      podBriefRow?.id &&
      podBriefRow.user_id === userId &&
      podBriefRow.approval_id === podBriefApproval?.id &&
      podBriefRow.product_type === 'premium t-shirt'
    );

    const anonGfxToolsJob = await requestJson(`${config.url}/rest/v1/gfxtools_jobs`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        job_payload: { prompt: 'RLS should reject this GFXTools job.' }
      })
    });
    result.v2.anonGfxToolsJobInsertDenied = !anonGfxToolsJob.response.ok;

    const gfxApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'gfxtools_job_create',
        tool_name: 'gfxtools_job_create',
        title: 'Prepare GFXTools job test',
        summary: 'Approve a GFXTools job payload before saving.',
        payload: {
          previewCard: {
            before: null,
            after: { provider: 'GFXTools', prompt: 'E2E POD prompt' },
            changes: ['Prepare payload only']
          }
        },
        risk_level: 'high'
      })
    });
    const gfxApproval = Array.isArray(gfxApprovalInsert.body) ? gfxApprovalInsert.body[0] : null;
    if (gfxApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${gfxApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directGfxJob = gfxApproval?.id ? await requestJson(`${config.url}/rest/v1/gfxtools_jobs?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: gfxApproval.id,
        pod_design_brief_id: podBriefRow?.id || null,
        connector_state: 'disconnected',
        job_payload: { prompt: 'Direct client should fail' },
        preview_card: { after: { provider: 'GFXTools' } }
      })
    }) : null;
    result.v2.gfxToolsJobDirectInsertDenied = Boolean(directGfxJob && !directGfxJob.response.ok);

    const serverGfxJob = gfxApproval?.id ? await requestJson(`${config.url}/rest/v1/gfxtools_jobs?select=id,user_id,approval_id,pod_design_brief_id,status,connector_state,external_call_performed`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: gfxApproval.id,
        pod_design_brief_id: podBriefRow?.id || null,
        status: 'blocked_missing_credentials',
        connector_state: 'disconnected',
        job_payload: { provider: 'gfxtools', prompt: 'E2E POD prompt', externalCallPerformed: false },
        preview_card: { after: { provider: 'GFXTools', prompt: 'E2E POD prompt' } },
        external_call_performed: false
      })
    }) : null;
    const gfxJobRow = Array.isArray(serverGfxJob?.body) ? serverGfxJob.body[0] : null;
    result.v2.gfxToolsJobServerInsertWithApproval = Boolean(
      serverGfxJob?.response.ok &&
      gfxJobRow?.id &&
      gfxJobRow.user_id === userId &&
      gfxJobRow.approval_id === gfxApproval?.id &&
      gfxJobRow.external_call_performed === false
    );

    const anonGfxAsset = await requestJson(`${config.url}/rest/v1/gfx_assets`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        asset_url: 'https://example.com/anon-asset.png',
        asset_type: 'image',
        status: 'ready'
      })
    });
    result.v2.anonGfxAssetInsertDenied = !anonGfxAsset.response.ok;

    const directGfxAsset = gfxApproval?.id ? await requestJson(`${config.url}/rest/v1/gfx_assets?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: gfxApproval.id,
        gfxtools_job_id: gfxJobRow?.id || null,
        asset_url: 'https://example.com/direct-asset.png',
        asset_type: 'image',
        dimensions: { width: 1080, height: 1080 },
        status: 'ready'
      })
    }) : null;
    result.v2.gfxAssetDirectInsertDenied = Boolean(directGfxAsset && !directGfxAsset.response.ok);

    const serverGfxAsset = gfxApproval?.id ? await requestJson(`${config.url}/rest/v1/gfx_assets?select=id,user_id,approval_id,gfxtools_job_id,asset_url,asset_type,status,platform_variants`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: gfxApproval.id,
        pod_design_brief_id: podBriefRow?.id || null,
        gfxtools_job_id: gfxJobRow?.id || null,
        external_job_id: 'e2e-gfx-job',
        asset_url: 'https://example.com/e2e-ready-asset.png',
        asset_type: 'image',
        dimensions: { width: 1080, height: 1080 },
        platform_variants: [
          { platform: 'instagram', variant: 'square', width: 1080, height: 1080, assetUrl: 'https://example.com/e2e-ready-asset.png?w=1080&h=1080' },
          { platform: 'linkedin', variant: 'feed', width: 1200, height: 627, assetUrl: 'https://example.com/e2e-ready-asset.png?w=1200&h=627' }
        ],
        status: 'ready',
        connector_state: 'disconnected'
      })
    }) : null;
    const gfxAssetRow = Array.isArray(serverGfxAsset?.body) ? serverGfxAsset.body[0] : null;
    result.v2.gfxAssetServerInsertWithApproval = Boolean(
      serverGfxAsset?.response.ok &&
      gfxAssetRow?.id &&
      gfxAssetRow.user_id === userId &&
      gfxAssetRow.approval_id === gfxApproval?.id &&
      gfxAssetRow.status === 'ready' &&
      Array.isArray(gfxAssetRow.platform_variants) &&
      gfxAssetRow.platform_variants.length > 0
    );

    const resizeApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'gfxtools_asset_resize',
        tool_name: 'gfxtools_asset_resize',
        title: 'Resize GFX asset test',
        summary: 'Approve platform variants and asset-ready event.',
        payload: { previewCard: { assetId: gfxAssetRow?.id || null } },
        risk_level: 'medium'
      })
    });
    const resizeApproval = Array.isArray(resizeApprovalInsert.body) ? resizeApprovalInsert.body[0] : null;
    if (resizeApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${resizeApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const serverAssetReadyEvent = resizeApproval?.id && gfxAssetRow?.id ? await requestJson(`${config.url}/rest/v1/asset_ready_events?select=id,user_id,approval_id,asset_id,event_type`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: resizeApproval.id,
        asset_id: gfxAssetRow.id,
        event_type: 'asset_ready',
        payload: { source: 'verify:cqai' }
      })
    }) : null;
    const assetReadyEventRow = Array.isArray(serverAssetReadyEvent?.body) ? serverAssetReadyEvent.body[0] : null;
    result.v2.assetReadyEventServerInsertWithApproval = Boolean(
      serverAssetReadyEvent?.response.ok &&
      assetReadyEventRow?.id &&
      assetReadyEventRow.user_id === userId &&
      assetReadyEventRow.approval_id === resizeApproval?.id &&
      assetReadyEventRow.asset_id === gfxAssetRow?.id
    );

    const shopifyApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'shopify_product_prepare',
        tool_name: 'shopify_product_prepare',
        title: 'Prepare Shopify product test',
        summary: 'Approve Shopify product payload preparation.',
        payload: { previewCard: { assetId: gfxAssetRow?.id || null, service: 'shopify' } },
        risk_level: 'high'
      })
    });
    const shopifyApproval = Array.isArray(shopifyApprovalInsert.body) ? shopifyApprovalInsert.body[0] : null;
    if (shopifyApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${shopifyApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directShopifyPreparation = shopifyApproval?.id && gfxAssetRow?.id ? await requestJson(`${config.url}/rest/v1/shopify_product_preparations?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: shopifyApproval.id,
        asset_id: gfxAssetRow.id,
        product_payload: { title: 'Direct client should fail' },
        preview_card: { title: 'Direct client should fail' }
      })
    }) : null;
    result.v2.shopifyPreparationDirectInsertDenied = Boolean(directShopifyPreparation && !directShopifyPreparation.response.ok);

    const serverShopifyPreparation = shopifyApproval?.id && gfxAssetRow?.id ? await requestJson(`${config.url}/rest/v1/shopify_product_preparations?select=id,user_id,approval_id,asset_id,status,external_call_performed`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: shopifyApproval.id,
        asset_id: gfxAssetRow.id,
        connector_state: 'disconnected',
        product_payload: { title: 'E2E Shopify product', assetId: gfxAssetRow.id },
        preview_card: { service: 'shopify', assetId: gfxAssetRow.id },
        status: 'blocked_missing_credentials',
        external_call_performed: false
      })
    }) : null;
    const shopifyRow = Array.isArray(serverShopifyPreparation?.body) ? serverShopifyPreparation.body[0] : null;
    result.v2.shopifyPreparationServerInsertWithApproval = Boolean(
      serverShopifyPreparation?.response.ok &&
      shopifyRow?.id &&
      shopifyRow.user_id === userId &&
      shopifyRow.approval_id === shopifyApproval?.id &&
      shopifyRow.asset_id === gfxAssetRow?.id &&
      shopifyRow.external_call_performed === false
    );

    const printifyApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'printify_design_prepare',
        tool_name: 'printify_design_prepare',
        title: 'Prepare Printify design test',
        summary: 'Approve Printify design payload preparation.',
        payload: { previewCard: { assetId: gfxAssetRow?.id || null, service: 'printify' } },
        risk_level: 'high'
      })
    });
    const printifyApproval = Array.isArray(printifyApprovalInsert.body) ? printifyApprovalInsert.body[0] : null;
    if (printifyApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${printifyApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directPrintifyPreparation = printifyApproval?.id && gfxAssetRow?.id ? await requestJson(`${config.url}/rest/v1/printify_design_preparations?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: printifyApproval.id,
        asset_id: gfxAssetRow.id,
        design_payload: { productTemplate: 'Direct client should fail' },
        preview_card: { title: 'Direct client should fail' }
      })
    }) : null;
    result.v2.printifyPreparationDirectInsertDenied = Boolean(directPrintifyPreparation && !directPrintifyPreparation.response.ok);

    const serverPrintifyPreparation = printifyApproval?.id && gfxAssetRow?.id ? await requestJson(`${config.url}/rest/v1/printify_design_preparations?select=id,user_id,approval_id,asset_id,status,external_call_performed`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: printifyApproval.id,
        asset_id: gfxAssetRow.id,
        connector_state: 'disconnected',
        design_payload: { productTemplate: 'premium t-shirt', assetId: gfxAssetRow.id },
        preview_card: { service: 'printify', assetId: gfxAssetRow.id },
        status: 'blocked_missing_credentials',
        external_call_performed: false
      })
    }) : null;
    const printifyRow = Array.isArray(serverPrintifyPreparation?.body) ? serverPrintifyPreparation.body[0] : null;
    result.v2.printifyPreparationServerInsertWithApproval = Boolean(
      serverPrintifyPreparation?.response.ok &&
      printifyRow?.id &&
      printifyRow.user_id === userId &&
      printifyRow.approval_id === printifyApproval?.id &&
      printifyRow.asset_id === gfxAssetRow?.id &&
      printifyRow.external_call_performed === false
    );

    const anonSocialDraft = await requestJson(`${config.url}/rest/v1/social_content_drafts`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        asset_url: 'https://example.com/anon.png',
        platforms: ['linkedin'],
        variants: { linkedin: [{ caption: 'RLS should reject this.' }] }
      })
    });
    result.v2.anonSocialDraftInsertDenied = !anonSocialDraft.response.ok;

    const socialPrepareApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'social_post_prepare',
        tool_name: 'social_post_prepare',
        title: 'Prepare social draft test',
        summary: 'Approve platform-aware social draft preparation.',
        payload: {
          previewCard: {
            title: 'Social draft preparation preview',
            assetId: gfxAssetRow?.id || null,
            assetReadyEventId: assetReadyEventRow?.id || null,
            assetUrl: gfxAssetRow?.asset_url || 'https://example.com/e2e-ready-asset.png',
            platforms: ['linkedin', 'instagram', 'x']
          }
        },
        risk_level: 'medium'
      })
    });
    const socialPrepareApproval = Array.isArray(socialPrepareApprovalInsert.body) ? socialPrepareApprovalInsert.body[0] : null;
    if (socialPrepareApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${socialPrepareApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directSocialDraft = socialPrepareApproval?.id ? await requestJson(`${config.url}/rest/v1/social_content_drafts?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: socialPrepareApproval.id,
        asset_url: 'https://example.com/direct-social.png',
        asset_type: 'image',
        asset_source: 'url',
        platforms: ['linkedin'],
        variants: { linkedin: [{ caption: 'Direct client should fail' }] },
        preview_card: { title: 'Direct client should fail' }
      })
    }) : null;
    result.v2.socialDraftDirectInsertDenied = Boolean(directSocialDraft && !directSocialDraft.response.ok);

    const serverSocialDraft = socialPrepareApproval?.id ? await requestJson(`${config.url}/rest/v1/social_content_drafts?select=id,user_id,approval_id,asset_url,platforms,status`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: socialPrepareApproval.id,
        gfx_asset_id: gfxAssetRow?.id || null,
        asset_ready_event_id: assetReadyEventRow?.id || null,
        asset_url: gfxAssetRow?.asset_url || 'https://example.com/e2e-ready-asset.png',
        asset_type: 'image',
        asset_source: 'gfx_asset',
        platforms: ['linkedin', 'instagram', 'x'],
        variants: {
          linkedin: [{ platform: 'linkedin', variantIndex: 0, caption: 'E2E LinkedIn caption', hashtags: ['#AI'], cta: 'Review' }],
          instagram: [{ platform: 'instagram', variantIndex: 0, caption: 'E2E Instagram caption', hashtags: ['#POD'], cta: 'Save' }],
          x: [{ platform: 'x', variantIndex: 0, caption: 'E2E X caption', hashtags: ['#Build'], cta: 'Reply' }]
        },
        content_context: { source: 'verify:cqai' },
        preview_card: { title: 'Social draft preparation preview' }
      })
    }) : null;
    const socialDraftRow = Array.isArray(serverSocialDraft?.body) ? serverSocialDraft.body[0] : null;
    result.v2.socialDraftServerInsertWithApproval = Boolean(
      serverSocialDraft?.response.ok &&
      socialDraftRow?.id &&
      socialDraftRow.user_id === userId &&
      socialDraftRow.approval_id === socialPrepareApproval?.id &&
      Array.isArray(socialDraftRow.platforms) &&
      socialDraftRow.platforms.includes('linkedin')
    );

    const anonSocialPost = await requestJson(`${config.url}/rest/v1/social_posts`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        platform: 'linkedin',
        content: 'Anon social post should fail.'
      })
    });
    result.v2.anonSocialPostInsertDenied = !anonSocialPost.response.ok;

    const socialQueueApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type,browser_session_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'social_post_queue',
        tool_name: 'social_post_queue',
        title: 'Queue social post test',
        summary: 'Approve browser-based social post composition.',
        payload: {
          platform: 'linkedin',
          content: 'E2E social queue draft',
          previewCard: {
            title: 'Social queue preview',
            platform: 'linkedin',
            willNotDo: ['No autonomous publish']
          }
        },
        browser_session_id: randomUUID(),
        risk_level: 'high'
      })
    });
    const socialQueueApproval = Array.isArray(socialQueueApprovalInsert.body) ? socialQueueApprovalInsert.body[0] : null;
    if (socialQueueApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${socialQueueApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directSocialPost = socialQueueApproval?.id ? await requestJson(`${config.url}/rest/v1/social_posts?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: socialQueueApproval.id,
        browser_session_id: socialQueueApproval.browser_session_id,
        platform: 'linkedin',
        content: 'Direct client social queue insert should fail.'
      })
    }) : null;
    result.v2.socialPostDirectInsertDenied = Boolean(directSocialPost && !directSocialPost.response.ok);

    const serverSocialPost = socialQueueApproval?.id ? await requestJson(`${config.url}/rest/v1/social_posts?select=id,user_id,approval_id,browser_session_id,platform,content,status,preview_screenshot_url`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: socialQueueApproval.id,
        browser_session_id: socialQueueApproval.browser_session_id,
        platform: 'linkedin',
        content: 'E2E queued LinkedIn post',
        status: 'ready',
        preview_screenshot_url: 'https://example.com/social-preview.png',
        metadata: { finalPublishAutonomous: false, source: 'verify:cqai' }
      })
    }) : null;
    const socialPostRow = Array.isArray(serverSocialPost?.body) ? serverSocialPost.body[0] : null;
    result.v2.socialPostServerInsertWithApproval = Boolean(
      serverSocialPost?.response.ok &&
      socialPostRow?.id &&
      socialPostRow.user_id === userId &&
      socialPostRow.approval_id === socialQueueApproval?.id &&
      socialPostRow.status === 'ready' &&
      socialPostRow.platform === 'linkedin'
    );

    const anonSocialRule = await requestJson(`${config.url}/rest/v1/social_distribution_rules`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        name: 'Anon social rule should fail',
        interval_minutes: 10,
        platforms: ['linkedin']
      })
    });
    result.v2.anonSocialRuleInsertDenied = !anonSocialRule.response.ok;

    const socialScheduleApprovalInsert = socialDraftRow?.id ? await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'social_post_schedule_approved',
        tool_name: 'social_post_schedule_approved',
        title: 'Schedule social cadence test',
        summary: 'Approve a user-configurable social distribution rule.',
        payload: {
          previewCard: {
            title: 'Social distribution approval preview',
            draftId: socialDraftRow.id,
            platforms: ['linkedin', 'instagram', 'x'],
            cadence: { intervalMinutes: 10, variantRotationCount: 1 }
          }
        },
        risk_level: 'high'
      })
    }) : null;
    const socialScheduleApproval = Array.isArray(socialScheduleApprovalInsert?.body) ? socialScheduleApprovalInsert.body[0] : null;
    if (socialScheduleApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${socialScheduleApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directSocialRule = socialScheduleApproval?.id ? await requestJson(`${config.url}/rest/v1/social_distribution_rules?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: socialScheduleApproval.id,
        social_content_draft_id: socialDraftRow.id,
        name: 'Direct client should fail',
        interval_minutes: 10,
        platforms: ['linkedin'],
        variant_rotation_count: 1,
        preview_card: { title: 'Direct client should fail' }
      })
    }) : null;
    result.v2.socialRuleDirectInsertDenied = Boolean(directSocialRule && !directSocialRule.response.ok);

    const serverSocialRule = socialScheduleApproval?.id ? await requestJson(`${config.url}/rest/v1/social_distribution_rules?select=id,user_id,approval_id,social_content_draft_id,interval_minutes,platforms,status`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: socialScheduleApproval.id,
        social_content_draft_id: socialDraftRow.id,
        name: 'E2E social cadence',
        interval_minutes: 10,
        platforms: ['linkedin', 'instagram', 'x'],
        variant_rotation_count: 1,
        timezone: 'UTC',
        start_at: new Date().toISOString(),
        status: 'paused_missing_credentials',
        rule_payload: { source: 'verify:cqai', externalCallsPerformed: false },
        preview_card: { title: 'Social distribution approval preview' }
      })
    }) : null;
    const socialRuleRow = Array.isArray(serverSocialRule?.body) ? serverSocialRule.body[0] : null;
    result.v2.socialRuleServerInsertWithApproval = Boolean(
      serverSocialRule?.response.ok &&
      socialRuleRow?.id &&
      socialRuleRow.user_id === userId &&
      socialRuleRow.approval_id === socialScheduleApproval?.id &&
      socialRuleRow.interval_minutes === 10
    );

    const serverSocialScheduledPost = socialRuleRow?.id ? await requestJson(`${config.url}/rest/v1/social_scheduled_posts?select=id,user_id,approval_id,distribution_rule_id,platform,status,connector_state`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: socialScheduleApproval.id,
        distribution_rule_id: socialRuleRow.id,
        social_content_draft_id: socialDraftRow.id,
        platform: 'linkedin',
        variant_index: 0,
        scheduled_for: new Date().toISOString(),
        status: 'blocked_missing_credentials',
        connector_state: 'disconnected',
        asset_url: socialDraftRow.asset_url,
        content_payload: { caption: 'E2E LinkedIn caption', externalCallPerformed: false }
      })
    }) : null;
    const socialScheduledRow = Array.isArray(serverSocialScheduledPost?.body) ? serverSocialScheduledPost.body[0] : null;
    result.v2.socialScheduledPostServerInsertWithApproval = Boolean(
      serverSocialScheduledPost?.response.ok &&
      socialScheduledRow?.id &&
      socialScheduledRow.user_id === userId &&
      socialScheduledRow.approval_id === socialScheduleApproval?.id &&
      socialScheduledRow.status === 'blocked_missing_credentials'
    );

    const serverSocialFireLog = socialScheduledRow?.id ? await requestJson(`${config.url}/rest/v1/social_post_fire_logs?select=id,user_id,approval_id,scheduled_post_id,platform,status`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: socialScheduleApproval.id,
        scheduled_post_id: socialScheduledRow.id,
        platform: 'linkedin',
        asset_url: socialDraftRow.asset_url,
        status: 'blocked',
        message: 'E2E social post blocked because connector credentials are missing.',
        result: { connectorState: 'disconnected', externalCallPerformed: false }
      })
    }) : null;
    const socialFireLogRow = Array.isArray(serverSocialFireLog?.body) ? serverSocialFireLog.body[0] : null;
    result.v2.socialFireLogServerInsertWithApproval = Boolean(
      serverSocialFireLog?.response.ok &&
      socialFireLogRow?.id &&
      socialFireLogRow.user_id === userId &&
      socialFireLogRow.approval_id === socialScheduleApproval?.id &&
      socialFireLogRow.status === 'blocked'
    );

    const anonStoreConnection = await requestJson(`${config.url}/rest/v1/store_connections`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        platform: 'shopify',
        shop_domain: 'anon-should-fail.myshopify.com',
        access_token: 'anon-token-should-fail',
        scope: 'read_products'
      })
    });
    result.v2.anonStoreConnectionInsertDenied = !anonStoreConnection.response.ok;

    const directStoreConnection = await requestJson(`${config.url}/rest/v1/store_connections`, {
      method: 'POST',
      headers: userHeaders(config, accessToken),
      body: JSON.stringify({
        user_id: userId,
        platform: 'shopify',
        shop_domain: 'direct-should-fail.myshopify.com',
        access_token: 'direct-token-should-fail',
        scope: 'read_products'
      })
    });
    result.v2.storeConnectionDirectInsertDenied = !directStoreConnection.response.ok;

    const serverStoreConnection = await requestJson(`${config.url}/rest/v1/store_connections?select=id,user_id,platform,shop_domain,access_token,status`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        platform: 'shopify',
        shop_domain: 'verify-cqai.myshopify.com',
        access_token: 'v1:verify-cqai-encrypted-placeholder',
        scope: 'read_products,write_products',
        metadata: { token_hint: 'v1:...', source: 'verify:cqai' }
      })
    });
    const storeConnectionRow = Array.isArray(serverStoreConnection.body) ? serverStoreConnection.body[0] : null;
    result.v2.storeConnectionServerInsertWithToken = Boolean(
      serverStoreConnection.response.ok &&
      storeConnectionRow?.id &&
      storeConnectionRow.user_id === userId &&
      storeConnectionRow.platform === 'shopify' &&
      typeof storeConnectionRow.access_token === 'string' &&
      storeConnectionRow.access_token !== 'direct-token-should-fail'
    );

    const userStoreConnectionRead = storeConnectionRow?.id ? await requestJson(`${config.url}/rest/v1/store_connections?id=eq.${storeConnectionRow.id}&select=id,platform,shop_domain,access_token`, {
      headers: userHeaders(config, accessToken)
    }) : null;
    result.v2.storeConnectionTokenHiddenFromUserRead = Boolean(
      userStoreConnectionRead?.response.ok &&
      Array.isArray(userStoreConnectionRead.body) &&
      userStoreConnectionRead.body.length === 0
    );

    const serverOauthState = await requestJson(`${config.url}/rest/v1/connector_oauth_states?select=id,user_id,platform,state,shop_domain`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        platform: 'shopify',
        state: `verify-${randomUUID()}`,
        shop_domain: 'verify-cqai.myshopify.com',
        redirect_uri: 'http://localhost:3000/api/connectors/shopify/callback',
        expires_at: new Date(Date.now() + 300000).toISOString()
      })
    });
    const oauthStateRow = Array.isArray(serverOauthState.body) ? serverOauthState.body[0] : null;
    result.v2.connectorOauthStateServerInsert = Boolean(
      serverOauthState.response.ok &&
      oauthStateRow?.id &&
      oauthStateRow.user_id === userId &&
      oauthStateRow.platform === 'shopify'
    );

    const podProductApprovalInsert = await requestJson(`${config.url}/rest/v1/action_approvals?select=id,user_id,status,action_type`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        action_type: 'pod_product_create',
        tool_name: 'pod_product_create',
        title: 'POD product API connector test',
        summary: 'Create a POD product only after explicit approval.',
        payload: {
          previewCard: {
            title: 'Verify POD product preview',
            willCreate: ['Printify product draft', 'Shopify product draft']
          }
        },
        risk_level: 'high'
      })
    });
    const podProductApproval = Array.isArray(podProductApprovalInsert.body) ? podProductApprovalInsert.body[0] : null;
    if (podProductApproval?.id) {
      await requestJson(`${config.url}/rest/v1/action_approvals?id=eq.${podProductApproval.id}&user_id=eq.${userId}&status=eq.requested`, {
        method: 'PATCH',
        headers: userHeaders(config, accessToken),
        body: JSON.stringify({ status: 'approved', decided_at: new Date().toISOString() })
      });
    }

    const directPodProduct = podProductApproval?.id ? await requestJson(`${config.url}/rest/v1/pod_products?select=id,user_id,approval_id`, {
      method: 'POST',
      headers: userHeaders(config, accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId,
        approval_id: podProductApproval.id,
        title: 'Direct client should fail',
        description: 'Client-side POD writes are blocked.',
        status: 'ready'
      })
    }) : null;
    result.v2.podProductDirectInsertDenied = Boolean(directPodProduct && !directPodProduct.response.ok);

    const serverPodProduct = podProductApproval?.id ? await requestJson(`${config.url}/rest/v1/pod_products?select=id,user_id,approval_id,title,status,shopify_product_id,printify_product_id`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        approval_id: podProductApproval.id,
        title: 'E2E POD product',
        description: 'Server-boundary POD product connector test.',
        print_provider_id: '29',
        blueprint_id: '12',
        media_assets: ['https://example.com/e2e-pod.png'],
        shop_domain: 'verify-cqai.myshopify.com',
        shopify_product_id: 'shopify-verify-product',
        printify_product_id: 'printify-verify-product',
        status: 'ready',
        preview_payload: { source: 'verify:cqai', publishRequiresUser: true }
      })
    }) : null;
    const podProductRow = Array.isArray(serverPodProduct?.body) ? serverPodProduct.body[0] : null;
    result.v2.podProductServerInsertWithApproval = Boolean(
      serverPodProduct?.response.ok &&
      podProductRow?.id &&
      podProductRow.user_id === userId &&
      podProductRow.approval_id === podProductApproval?.id &&
      podProductRow.status === 'ready'
    );

    const podProductRead = podProductRow?.id ? await requestJson(`${config.url}/rest/v1/pod_products?id=eq.${podProductRow.id}&select=id,user_id,title,status&limit=1`, {
      headers: userHeaders(config, accessToken)
    }) : null;
    result.v2.podProductRead = Boolean(
      podProductRead?.response.ok &&
      Array.isArray(podProductRead.body) &&
      podProductRead.body[0]?.id === podProductRow.id
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
  const handler = require(path.join(repoRoot, 'src', 'server', 'legacy', 'converse.cjs'));
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

function verifyJobApplicationPacketContract() {
  const workflowPath = path.join(repoRoot, 'src', 'app', 'api', '_lib', 'job-workflows.ts');
  const appPath = path.join(repoRoot, 'frontend', 'src', 'App.js');
  const workflow = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : '';
  const app = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';
  const checks = [
    { name: 'reads_resume_content_column', ok: workflow.includes(".select('resume_content')") },
    { name: 'builds_application_packet', ok: workflow.includes('function buildApplicationPacket') },
    { name: 'includes_recruiter_message', ok: workflow.includes('recruiterMessage') },
    { name: 'includes_missing_answer_prompts', ok: workflow.includes('missingAnswerPrompts') },
    { name: 'requires_final_user_submit', ok: workflow.includes('finalSubmitRequiresUser: true') },
    { name: 'ui_shows_recruiter_note', ok: app.includes('Recruiter note:') },
    { name: 'ui_shows_missing_prompt', ok: app.includes('Needs user answer:') }
  ];

  return {
    ok: checks.every(item => item.ok),
    checks
  };
}

function verifyJobTrackerContract() {
  const routePath = path.join(repoRoot, 'src', 'app', 'api', 'jobs', 'pipeline', 'route.ts');
  const appPath = path.join(repoRoot, 'frontend', 'src', 'App.js');
  const jobPipelinePath = path.join(repoRoot, 'frontend', 'src', 'components', 'JobPipeline.js');
  const migrationPath = path.join(repoRoot, 'supabase', 'migrations', '20260511000000_job_application_tracker_statuses.sql');
  const closureMigrationPath = path.join(repoRoot, 'supabase', 'migrations', '20260511010000_resume_tracker_closure.sql');
  const route = fs.existsSync(routePath) ? fs.readFileSync(routePath, 'utf8') : '';
  const app = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';
  const jobPipeline = fs.existsSync(jobPipelinePath) ? fs.readFileSync(jobPipelinePath, 'utf8') : '';
  const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';
  const closureMigration = fs.existsSync(closureMigrationPath) ? fs.readFileSync(closureMigrationPath, 'utf8') : '';
  const requiredStatuses = [
    'discovered', 'matched', 'saved', 'drafted', 'tailoring', 'questions_needed',
    'ready', 'ready_to_apply', 'applying', 'ready_to_submit', 'submitted',
    'applied', 'response', 'interview', 'offer', 'failed', 'cancelled',
    'rejected', 'withdrawn'
  ];
  const checks = [
    { name: 'pipeline_patch_exists', ok: route.includes('export async function PATCH') },
    { name: 'tracker_statuses_cover_full_lifecycle', ok: requiredStatuses.every(status => route.includes(`'${status}'`)) },
    { name: 'stores_tracker_status_metadata', ok: route.includes('tracker_status') && route.includes('tracker_updated_at') },
    { name: 'legacy_db_status_compatible', ok: route.includes("if (status === 'applied' || status === 'response') return 'submitted'") },
    { name: 'ui_has_tracker_status_controls', ok: app.includes('updateJobTrackerStatus') && app.includes('trackerStatuses') },
    { name: 'job_pipeline_uses_tracker_status_as_display_status', ok: route.includes('rawStatus') && route.includes('status: trackerStatus') },
    { name: 'job_pipeline_renders_tailored_resume_badge', ok: jobPipeline.includes('Tailored resume saved') && jobPipeline.includes('tailoredResumeId') },
    { name: 'migration_extends_status_constraints', ok: migration.includes('job_applications_status_check') && closureMigration.includes("'questions_needed'") && closureMigration.includes("'ready_to_apply'") }
  ];

  return {
    ok: checks.every(item => item.ok),
    checks
  };
}

function verifyResumeTailoringContract() {
  const migrationPath = path.join(repoRoot, 'supabase', 'migrations', '20260511010000_resume_tracker_closure.sql');
  const easyApplyPath = path.join(repoRoot, 'src', 'app', 'api', 'jobs', 'easy-apply', 'route.ts');
  const profileWorkflowPath = path.join(repoRoot, 'src', 'app', 'api', '_lib', 'job-profile-workflows.ts');
  const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';
  const easyApply = fs.existsSync(easyApplyPath) ? fs.readFileSync(easyApplyPath, 'utf8') : '';
  const profileWorkflow = fs.existsSync(profileWorkflowPath) ? fs.readFileSync(profileWorkflowPath, 'utf8') : '';
  const checks = [
    { name: 'resume_versions_has_company', ok: migration.includes('company text') },
    { name: 'resume_versions_has_match_score', ok: migration.includes('match_score integer') },
    { name: 'resume_versions_has_jd_keywords', ok: migration.includes('jd_keywords text[]') },
    { name: 'resume_versions_has_cover_letter_content', ok: migration.includes('cover_letter_content text') },
    { name: 'approved_resume_write_persists_tailoring_fields', ok: ['company', 'match_score', 'jd_keywords', 'cover_letter_content'].every(token => profileWorkflow.includes(token)) },
    { name: 'easy_apply_appends_tailored_resume_version', ok: easyApply.includes(".from('resume_versions')") && easyApply.includes('tailoredResumeVersionId') },
    { name: 'base_resume_not_updated', ok: !easyApply.includes(".from('resume_versions')\n        .update") && profileWorkflow.includes('insert({') }
  ];

  return {
    ok: checks.every(item => item.ok),
    checks
  };
}

function verifyJobHandoffChecklistContract() {
  const handoffPath = path.join(repoRoot, 'src', 'lib', 'jobs', 'application-handoff.ts');
  const checklistRoutePath = path.join(repoRoot, 'src', 'app', 'api', 'actions', 'job-apply', 'checklist', 'route.ts');
  const jobApplyRoutePath = path.join(repoRoot, 'src', 'app', 'api', 'actions', 'job-apply', 'route.ts');
  const appPath = path.join(repoRoot, 'frontend', 'src', 'App.js');
  const handoff = fs.existsSync(handoffPath) ? fs.readFileSync(handoffPath, 'utf8') : '';
  const checklistRoute = fs.existsSync(checklistRoutePath) ? fs.readFileSync(checklistRoutePath, 'utf8') : '';
  const jobApplyRoute = fs.existsSync(jobApplyRoutePath) ? fs.readFileSync(jobApplyRoutePath, 'utf8') : '';
  const app = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';
  const checks = [
    { name: 'handoff_builder_exists', ok: handoff.includes('buildJobApplicationHandoffChecklist') },
    { name: 'covers_final_user_cta', ok: handoff.includes('finalSubmitAutonomous: false') && handoff.includes('User presses final CTA') },
    { name: 'flags_missing_sensitive_fields', ok: handoff.includes('custom essay answers') && handoff.includes('salary and work-authorization confirmations') },
    { name: 'authenticated_checklist_endpoint', ok: checklistRoute.includes('requireApiUser') && checklistRoute.includes('job_apply_handoff_checklist') },
    { name: 'job_apply_persists_handoff', ok: jobApplyRoute.includes('handoff_checklist') && jobApplyRoute.includes('handoffChecklist') },
    { name: 'ui_can_open_checklist', ok: app.includes('loadJobHandoffChecklist') && app.includes('Open checklist') },
    { name: 'ui_displays_tracker_handoff', ok: app.includes('Handoff checklist') && app.includes('providerLabel') }
  ];

  return {
    ok: checks.every(item => item.ok),
    checks
  };
}

function verifyJobComplexFormContract() {
  const sharedPath = path.join(repoRoot, 'src', 'app', 'api', 'actions', 'job-apply', 'platforms', 'shared.ts');
  const routePath = path.join(repoRoot, 'src', 'app', 'api', 'actions', 'job-apply', 'route.ts');
  const appPath = path.join(repoRoot, 'frontend', 'src', 'App.js');
  const platformFiles = ['linkedin.ts', 'indeed.ts', 'dice.ts', 'ats.ts', 'generic.ts']
    .map(file => path.join(repoRoot, 'src', 'app', 'api', 'actions', 'job-apply', 'platforms', file));
  const shared = fs.existsSync(sharedPath) ? fs.readFileSync(sharedPath, 'utf8') : '';
  const route = fs.existsSync(routePath) ? fs.readFileSync(routePath, 'utf8') : '';
  const app = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';
  const platformSources = platformFiles.map(file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '').join('\n');
  const checks = [
    { name: 'audited_step_receipts_exist', ok: shared.includes('auditedBrowserStep') && shared.includes('job_apply_step_receipt') },
    { name: 'step_screenshots_audited', ok: shared.includes('screenshotUrl: receipt.screenshot') && shared.includes('captureReviewReceipt(input)') },
    { name: 'user_input_prompts_flag_sensitive_fields', ok: shared.includes('Salary expectation') && shared.includes('Work authorization') && shared.includes('Custom essay questions') },
    { name: 'platforms_use_audited_browser_step', ok: ['linkedin-open-easy-apply', 'indeed-start-apply', 'dice-start-apply', 'company-site-field-audit', 'start-ats-form'].every(token => platformSources.includes(token)) },
    { name: 'job_apply_persists_step_receipts', ok: route.includes('step_receipts') && route.includes('user_input_prompts') },
    { name: 'ui_displays_step_receipts_and_prompts', ok: app.includes('Step receipts') && app.includes('Needs user confirmation:') }
  ];

  return {
    ok: checks.every(item => item.ok),
    checks
  };
}

async function main() {
  const config = readAppSupabaseConfig();
  if (!config.url || !config.anonKey) {
    throw new Error('Missing Supabase URL or anon key');
  }

  const signup = await verifySignup(config);
  const tables = [];
  const optionalTables = new Set([
    // Phase 8 code tolerates this table missing until the live Supabase
    // project receives the job scan reporting migration.
    'job_scan_runs',
    // Commerce hardcoding Sprint 2 tables are runtime-migration dependent.
    // They become required once the Sprint 2 migration is applied.
    'social_accounts',
    'pod_providers',
    'platform_settings'
  ]);
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
    'browser_sessions',
    'job_listings',
    'job_application_reviews',
    'job_applications',
    'job_profiles',
    'resume_versions',
    'job_scan_runs',
    'social_accounts',
    'pod_design_briefs',
    'gfxtools_jobs',
    'gfx_assets',
    'asset_ready_events',
    'shopify_product_preparations',
    'printify_design_preparations',
    'commerce_connector_secrets',
    'shopify_store_connections',
    'fulfillment_provider_statuses',
    'shopify_products',
    'provider_designs',
    'provider_product_syncs',
    'shopify_collections',
    'shopify_collection_assignments',
    'shopify_inventory_levels',
    'shopify_inventory_adjustments',
    'shopify_order_summaries',
    'aftership_connections',
    'aftership_tracking_snapshots',
    'aftership_return_snapshots',
    'shopify_analytics_snapshots',
    'shopify_bundles',
    'marketplace_status_snapshots',
    'commerce_events',
    'social_content_drafts',
    'social_distribution_rules',
    'social_scheduled_posts',
    'social_post_fire_logs',
    'social_posts',
    'store_connections',
    'connector_oauth_states',
    'pod_products',
    'pod_providers',
    'platform_settings'
  ]) {
    const result = await verifyTable(config, table);
    if (optionalTables.has(table) && !result.ok) {
      result.optional = true;
      result.needsMigration = true;
    }
    tables.push(result);
  }
  const userOwnedCrud = await verifyUserOwnedCrud(config);
  const rgy = await verifyRgy();
  const frontendSecretBoundary = verifyFrontendSecretBoundary();
  const jobApplicationPacketContract = verifyJobApplicationPacketContract();
  const jobTrackerContract = verifyJobTrackerContract();
  const resumeTailoringContract = verifyResumeTailoringContract();
  const jobHandoffChecklistContract = verifyJobHandoffChecklistContract();
  const jobComplexFormContract = verifyJobComplexFormContract();

  const report = {
    supabaseProject: config.url,
    signup,
    tables,
    userOwnedCrud,
    rgy,
    frontendSecretBoundary,
    jobApplicationPacketContract,
    jobTrackerContract,
    resumeTailoringContract,
    jobHandoffChecklistContract,
    jobComplexFormContract,
    passed: signup.ok && tables.every(isRequiredTableHealthy) && userOwnedCrud.ok && rgy.every(item => item.ok) && frontendSecretBoundary.ok && jobApplicationPacketContract.ok && jobTrackerContract.ok && resumeTailoringContract.ok && jobHandoffChecklistContract.ok && jobComplexFormContract.ok
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
