import type { LocalSession, LocalSignal, PermissionState } from '@/next/types/cubiqo';

const KEY = 'cubiqo_session';
const TTL_MS = 72 * 60 * 60 * 1000;

export function getSession(): LocalSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as LocalSession;
    if (!session?.session_id || !session.last_seen_at) {
      clearSession();
      return null;
    }
    if (Date.now() - new Date(session.last_seen_at).getTime() > TTL_MS) {
      clearSession();
      return null;
    }
    return normalizeSession(session);
  } catch {
    clearSession();
    return null;
  }
}

export function initSession(): LocalSession {
  const now = new Date().toISOString();
  const session: LocalSession = {
    session_id: createId(),
    first_seen_at: now,
    last_seen_at: now,
    visit_count: 1,
    signals: [],
    last_summary: null,
    voice_preference: 'text',
    language_preference: detectLanguage(),
    conversion_nudge_sent: false,
    permissions: {
      mic: 'pending',
      camera: 'pending',
      memory: 'pending',
      location: 'pending',
      push: 'pending',
      tracking: 'pending'
    }
  };
  saveSession(session);
  return session;
}

export function getOrInitSession(): LocalSession {
  return getSession() || initSession();
}

export function touchSession(session: LocalSession): LocalSession {
  const updated = {
    ...normalizeSession(session),
    last_seen_at: new Date().toISOString(),
    visit_count: Number(session.visit_count || 0) + 1
  };
  saveSession(updated);
  return updated;
}

export function addSignal(session: LocalSession, signal: LocalSignal): LocalSession {
  const normalized = normalizeSession(session);
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  const existingIdx = normalized.signals.findIndex(
    item =>
      item.keyword.trim().toLowerCase() === signal.keyword.trim().toLowerCase() &&
      new Date(item.created_at).getTime() > thirtyMinAgo
  );

  let signals: LocalSignal[];
  if (existingIdx >= 0) {
    signals = [...normalized.signals];
    signals[existingIdx] = signal;
  } else {
    signals = [...normalized.signals, signal].slice(-5);
  }

  const updated = {
    ...normalized,
    signals,
    last_seen_at: new Date().toISOString()
  };
  saveSession(updated);
  return updated;
}

export function setPermission(
  session: LocalSession,
  key: keyof LocalSession['permissions'],
  state: PermissionState
): LocalSession {
  const normalized = normalizeSession(session);
  const updated = {
    ...normalized,
    permissions: { ...normalized.permissions, [key]: state },
    last_seen_at: new Date().toISOString()
  };
  saveSession(updated);
  return updated;
}

export function setSummary(session: LocalSession, summary: string): LocalSession {
  const normalized = normalizeSession(session);
  const updated = {
    ...normalized,
    last_summary: summary.trim().slice(0, 200) || null,
    last_seen_at: new Date().toISOString()
  };
  saveSession(updated);
  return updated;
}

export function markConversionNudgeSent(session: LocalSession): LocalSession {
  const normalized = normalizeSession(session);
  const updated = {
    ...normalized,
    conversion_nudge_sent: true,
    last_seen_at: new Date().toISOString()
  };
  saveSession(updated);
  return updated;
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}

function saveSession(session: LocalSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(normalizeSession(session)));
}

function detectLanguage(): string {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language || 'en';
  const [base, region] = lang.split('-');
  if (base === 'en' && region === 'IN') return 'en-IN';
  return base || 'en';
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function normalizeSession(session: LocalSession): LocalSession {
  return {
    session_id: String(session.session_id || createId()),
    first_seen_at: session.first_seen_at || new Date().toISOString(),
    last_seen_at: session.last_seen_at || new Date().toISOString(),
    visit_count: Number(session.visit_count || 1),
    signals: Array.isArray(session.signals) ? session.signals.slice(-5) : [],
    last_summary: session.last_summary ? String(session.last_summary).slice(0, 200) : null,
    voice_preference: session.voice_preference === 'voice' ? 'voice' : 'text',
    language_preference: session.language_preference || detectLanguage(),
    conversion_nudge_sent: Boolean(session.conversion_nudge_sent),
    permissions: {
      mic: normalizePermission(session.permissions?.mic),
      camera: normalizePermission(session.permissions?.camera),
      memory: normalizePermission(session.permissions?.memory),
      location: normalizePermission(session.permissions?.location),
      push: normalizePermission(session.permissions?.push),
      tracking: normalizePermission(session.permissions?.tracking)
    }
  };
}

function normalizePermission(value: unknown): PermissionState {
  return value === 'granted' || value === 'denied' ? value : 'pending';
}
