import { capabilityManifestToPayload, detectCapabilities } from './capability-detector';

const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_ENDPOINT = '/api/surfaces/heartbeat';

type SurfaceType = 'web' | 'desktop' | 'mobile' | 'extension' | 'cloud_browser';

interface HeartbeatClientOptions {
  surfaceType: SurfaceType;
  getToken: () => Promise<string | null>;
  deviceId?: string;
  appVersion?: string;
  osPlatform?: 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'web';
  getOllamaModels?: () => Promise<string[]>;
}

class HeartbeatClient {
  private timer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;
  private options: HeartbeatClientOptions | null = null;
  private running = false;

  constructor() {
    const stored =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('cubiqo_surface_session_id')
        : null;

    if (stored) {
      this.sessionId = stored;
    } else {
      this.sessionId = crypto.randomUUID();
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('cubiqo_surface_session_id', this.sessionId);
      }
    }
  }

  private async sendHeartbeat(): Promise<void> {
    if (!this.options) return;

    const token = await this.options.getToken();
    if (!token) return;

    let capabilityPayload: Record<string, boolean> = {};
    let ollamaModels: string[] | undefined;

    try {
      const manifest = await detectCapabilities();
      capabilityPayload = capabilityManifestToPayload(manifest);
      if (this.options.getOllamaModels) {
        ollamaModels = await this.options.getOllamaModels();
      }
    } catch (err) {
      console.warn('[heartbeat] capability detection failed:', err);
    }

    try {
      await fetch(HEARTBEAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          surface_type: this.options.surfaceType,
          session_id: this.sessionId,
          capabilities: capabilityPayload,
          device_id: this.options.deviceId,
          app_version: this.options.appVersion,
          os_platform: this.options.osPlatform,
          ollama_models: ollamaModels
        })
      });
    } catch (err) {
      console.warn('[heartbeat] send failed:', err);
    }
  }

  start(options: HeartbeatClientOptions): void {
    if (this.running) return;
    this.options = options;
    this.running = true;

    void this.sendHeartbeat();

    this.timer = setInterval(() => {
      void this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('focus', this.handleFocus);
    }
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('focus', this.handleFocus);
    }
  }

  async refresh(): Promise<void> {
    await this.sendHeartbeat();
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      return;
    }

    void this.sendHeartbeat();
    if (!this.timer) {
      this.timer = setInterval(() => {
        void this.sendHeartbeat();
      }, HEARTBEAT_INTERVAL_MS);
    }
  };

  private handleFocus = (): void => {
    void this.sendHeartbeat();
    if (!this.timer) {
      this.timer = setInterval(() => {
        void this.sendHeartbeat();
      }, HEARTBEAT_INTERVAL_MS);
    }
  };
}

export const heartbeatClient = new HeartbeatClient();
