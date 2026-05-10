export const WHITELIST_DOMAINS = [
  'linkedin.com',
  'indeed.com',
  'dice.com',
  'wellfound.com',
  'greenhouse.io',
  'lever.co',
  'example.com'
] as const;

export const HARD_STOP_ACTION_TYPES: Record<string, string> = {
  send_email: 'blocked_email_send',
  social_post_publish: 'blocked_social_publish',
  deploy: 'blocked_deploy',
  job_apply: 'blocked_job_apply'
};

export const SOFT_CONFIRMATION_ACTION_TYPES = new Set([
  'social_post_queue',
  'email_draft'
]);

const PROD_QA_HOSTS = new Set([
  'cubiqo.ai',
  'www.cubiqo.ai',
  'qa.cubiqo.ai',
  'www.qa.cubiqo.ai'
]);

export function extractUrlFromPayload(payload: Record<string, unknown>) {
  const candidates = [
    payload.url,
    payload.targetUrl,
    payload.target_url,
    payload.href,
    payload.destinationUrl,
    payload.destination_url
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }

  return null;
}

export function parseHttpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

export function isWhitelistedDomain(hostname: string) {
  const normalized = hostname.toLowerCase();
  return WHITELIST_DOMAINS.some(domain => normalized === domain || normalized.endsWith(`.${domain}`));
}

export function isProdOrQaTarget(url: URL | null) {
  return Boolean(url && PROD_QA_HOSTS.has(url.hostname.toLowerCase()));
}

export function getHardStopReason(actionType: string, payload: Record<string, unknown>) {
  const url = parseHttpUrl(extractUrlFromPayload(payload));
  if (isProdOrQaTarget(url)) return 'blocked_prod_target';

  const normalized = actionType.toLowerCase();
  if (HARD_STOP_ACTION_TYPES[normalized]) return HARD_STOP_ACTION_TYPES[normalized];
  if (/(payment|billing|checkout)/i.test(normalized)) return 'blocked_payment_action';

  const payloadText = JSON.stringify(payload).toLowerCase();
  if (/(payment|billing|checkout)/i.test(payloadText)) return 'blocked_payment_action';

  return null;
}

export function getUrlAllowlistDecision(payload: Record<string, unknown>) {
  const rawUrl = extractUrlFromPayload(payload);
  const url = parseHttpUrl(rawUrl);
  if (!url) {
    return {
      ok: false,
      rawUrl,
      hostname: null,
      reason: 'invalid_url'
    };
  }

  const allowed = isWhitelistedDomain(url.hostname);
  return {
    ok: allowed,
    rawUrl: url.toString(),
    hostname: url.hostname,
    reason: allowed ? null : 'suspicious_url'
  };
}

export function requiresSoftConfirmation(actionType: string, payload: Record<string, unknown>) {
  if (SOFT_CONFIRMATION_ACTION_TYPES.has(actionType)) return true;
  return Boolean(payload.irreversible || payload.publicAction || payload.public_action);
}

