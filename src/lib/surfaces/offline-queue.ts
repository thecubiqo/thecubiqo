const STORAGE_KEY = 'cubiqo_offline_queue';
const MAX_QUEUE_SIZE = 100;

export interface QueuedAction {
  idempotency_key: string;
  action_type: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  payload: Record<string, unknown>;
  queued_at: string;
  attempt_count: number;
  last_error: string | null;
}

export interface DrainResult {
  processed: number;
  failed: number;
  remaining: number;
  errors: Array<{ idempotency_key: string; error: string }>;
}

function readQueue(): QueuedAction[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAction[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[offline-queue] localStorage write failed:', err);
  }
}

export function pushToQueue(
  action: Omit<QueuedAction, 'idempotency_key' | 'queued_at' | 'attempt_count' | 'last_error'> & {
    idempotency_key?: string;
  }
): void {
  const queue = readQueue();
  queue.push({
    ...action,
    idempotency_key: action.idempotency_key ?? crypto.randomUUID(),
    queued_at: new Date().toISOString(),
    attempt_count: 0,
    last_error: null
  });

  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
  }

  writeQueue(queue);
}

export function peekQueue(): QueuedAction[] {
  return [...readQueue()].sort(
    (a, b) => new Date(a.queued_at).getTime() - new Date(b.queued_at).getTime()
  );
}

export function queueDepth(): number {
  return readQueue().length;
}

export function clearQueue(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function drainQueue(
  getToken: () => Promise<string | null>,
  batchSize = 20
): Promise<DrainResult> {
  const token = await getToken();
  if (!token) {
    return { processed: 0, failed: 0, remaining: queueDepth(), errors: [] };
  }

  const queue = peekQueue();
  if (queue.length === 0) {
    return { processed: 0, failed: 0, remaining: 0, errors: [] };
  }

  const batch = queue.slice(0, batchSize);
  const result: DrainResult = { processed: 0, failed: 0, remaining: 0, errors: [] };

  try {
    const response = await fetch('/api/surfaces/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ actions: batch })
    });

    if (!response.ok) {
      throw new Error(`Sync endpoint returned ${response.status}`);
    }

    const data = (await response.json()) as {
      processed: number;
      failed: number;
      errors?: Array<{ idempotency_key: string; error: string }>;
    };

    result.processed = data.processed;
    result.failed = data.failed;
    result.errors = data.errors ?? [];

    const successKeys = new Set(
      batch
        .map((action) => action.idempotency_key)
        .filter((key) => !result.errors.some((error) => error.idempotency_key === key))
    );

    const failedKeys = new Set(result.errors.map((error) => error.idempotency_key));
    const updated = readQueue()
      .filter((action) => !successKeys.has(action.idempotency_key))
      .map((action) => {
        if (!failedKeys.has(action.idempotency_key)) return action;
        const errEntry = result.errors.find((error) => error.idempotency_key === action.idempotency_key);
        return {
          ...action,
          attempt_count: action.attempt_count + 1,
          last_error: errEntry?.error ?? 'unknown'
        };
      });

    writeQueue(updated);
    result.remaining = updated.length;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const batchKeys = new Set(batch.map((action) => action.idempotency_key));
    const updated = readQueue().map((action) =>
      batchKeys.has(action.idempotency_key)
        ? { ...action, attempt_count: action.attempt_count + 1, last_error: errMsg }
        : action
    );
    writeQueue(updated);
    result.failed = batch.length;
    result.remaining = updated.length;
    result.errors = batch.map((action) => ({
      idempotency_key: action.idempotency_key,
      error: errMsg
    }));
  }

  return result;
}

export function registerOfflineListeners(getToken: () => Promise<string | null>): () => void {
  const handleOnline = () => {
    if (queueDepth() > 0) {
      console.info(`[offline-queue] reconnected - draining ${queueDepth()} queued actions`);
      void drainQueue(getToken);
    }
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}
