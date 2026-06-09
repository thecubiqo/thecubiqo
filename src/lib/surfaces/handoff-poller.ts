const POLL_INTERVAL_MS = 3_000;
const POLL_ENDPOINT = '/api/surfaces/handoff/pending';
const HANDOFF_EVENT = 'cubiqo:handoff';

export interface HandoffPayload {
  handoff_id: string;
  task_id: string;
  project_id: string;
  from_surface: string;
  to_surface: string;
  artifact_payload: Record<string, unknown>;
  created_at: string;
  expires_at: string | null;
}

interface HandoffPollerOptions {
  surfaceType: string;
  getToken: () => Promise<string | null>;
  onHandoff?: (payload: HandoffPayload) => void;
}

class HandoffPoller {
  private timer: ReturnType<typeof setInterval> | null = null;
  private options: HandoffPollerOptions | null = null;
  private running = false;

  start(options: HandoffPollerOptions): void {
    if (this.running) return;
    this.options = options;
    this.running = true;

    this.timer = setInterval(() => {
      void this.poll();
    }, POLL_INTERVAL_MS);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async poll(): Promise<void> {
    if (!this.options) return;

    const token = await this.options.getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${POLL_ENDPOINT}?surface_type=${encodeURIComponent(this.options.surfaceType)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return;

      const data = (await response.json()) as { handoffs: HandoffPayload[] };
      for (const handoff of data.handoffs ?? []) {
        this.dispatch(handoff);
      }
    } catch {
      // Network failure: retry on next poll.
    }
  }

  private dispatch(payload: HandoffPayload): void {
    if (this.options?.onHandoff) {
      this.options.onHandoff(payload);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<HandoffPayload>(HANDOFF_EVENT, { detail: payload }));
    }
  }
}

export const handoffPoller = new HandoffPoller();

export function onHandoff(handler: (payload: HandoffPayload) => void): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<HandoffPayload>).detail);
  };
  window.addEventListener(HANDOFF_EVENT, listener);
  return () => window.removeEventListener(HANDOFF_EVENT, listener);
}
