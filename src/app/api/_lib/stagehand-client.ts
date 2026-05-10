import { Stagehand } from '@browserbasehq/stagehand';
import type { ApiUserContext } from './supabase-admin';

type StagehandInstance = InstanceType<typeof Stagehand>;

export type BrowserSessionMode = 'disposable' | 'persistent';

export type StagehandOpenSessionInput = {
  browser_session_id: string;
  sessionMode?: BrowserSessionMode;
  url?: string;
};

export type StagehandActionInput = {
  browser_session_id: string;
  action: string;
};

export type StagehandExtractInput = {
  browser_session_id: string;
  instruction: string;
};

export type StagehandScreenshotInput = {
  auth: ApiUserContext;
  browser_session_id: string;
};

const activeSessions = new Map<string, StagehandInstance>();

function requireBrowserbaseEnv() {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  if (!apiKey || !projectId) {
    throw new Error('Browserbase credentials are not configured');
  }
  return { apiKey, projectId };
}

function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'browser-screenshots';
}

function getStagehand(browser_session_id: string) {
  const stagehand = activeSessions.get(browser_session_id);
  if (!stagehand) {
    const error = new Error('SESSION_EXPIRED');
    error.name = 'SESSION_EXPIRED';
    throw error;
  }
  return stagehand;
}

function getActivePage(stagehand: StagehandInstance) {
  const page = stagehand.context.activePage() || stagehand.context.pages()[0];
  if (!page) throw new Error('Stagehand session has no active page');
  return page;
}

export async function openSession(input: StagehandOpenSessionInput) {
  const { apiKey, projectId } = requireBrowserbaseEnv();
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey,
    projectId,
    sessionId: input.browser_session_id,
    keepAlive: input.sessionMode === 'persistent',
    browserbaseSessionCreateParams: {
      projectId
    },
    model: {
      modelName: 'openai/gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY
    },
    disablePino: true,
    verbose: 0
  });

  await stagehand.init();
  activeSessions.set(input.browser_session_id, stagehand);

  if (input.url) {
    const page = getActivePage(stagehand);
    await page.goto(input.url, { waitUntil: 'domcontentloaded', timeoutMs: 30000 });
  }

  return {
    browser_session_id: input.browser_session_id,
    provider_session_id: stagehand.browserbaseSessionID || null,
    debug_url: stagehand.browserbaseDebugURL || null
  };
}

export async function act(input: StagehandActionInput) {
  const stagehand = getStagehand(input.browser_session_id);
  return stagehand.act(input.action);
}

export async function extract(input: StagehandExtractInput) {
  const stagehand = getStagehand(input.browser_session_id);
  return stagehand.extract(input.instruction);
}

export async function screenshot(input: StagehandScreenshotInput) {
  const stagehand = getStagehand(input.browser_session_id);
  const page = getActivePage(stagehand);
  const buffer = await page.screenshot({ type: 'png', fullPage: true });
  const bucket = getStorageBucket();
  const path = `${input.browser_session_id}/${Date.now()}.png`;

  const { error: bucketError } = await input.auth.supabase.storage.createBucket(bucket, {
    public: false
  });
  if (bucketError && !/already exists/i.test(bucketError.message)) {
    throw new Error(`Browser screenshot bucket error: ${bucketError.message}`);
  }

  const { error: uploadError } = await input.auth.supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: 'image/png',
      upsert: true
    });
  if (uploadError) throw new Error(`Browser screenshot upload failed: ${uploadError.message}`);

  const { data, error: signedUrlError } = await input.auth.supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);
  if (signedUrlError || !data?.signedUrl) {
    throw new Error(`Browser screenshot signing failed: ${signedUrlError?.message || 'signed URL missing'}`);
  }

  return {
    browser_session_id: input.browser_session_id,
    storage_path: path,
    signed_url: data.signedUrl
  };
}

export async function accessibilitySnapshot(browser_session_id: string) {
  const stagehand = getStagehand(browser_session_id);
  const page = getActivePage(stagehand);
  const snapshot = await page.snapshot({ includeIframes: true });
  return snapshot;
}

export async function closeSession(input: { browser_session_id: string; force?: boolean }) {
  const stagehand = activeSessions.get(input.browser_session_id);
  if (!stagehand) {
    return { browser_session_id: input.browser_session_id, alreadyClosed: true };
  }
  activeSessions.delete(input.browser_session_id);
  await stagehand.close({ force: input.force ?? true });
  return { browser_session_id: input.browser_session_id, alreadyClosed: false };
}
