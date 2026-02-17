/**
 * Browser Pool System
 * 
 * Manages browser instance pooling for efficiency:
 * - Reuse browser instances across sessions
 * - Session timeout (5 min max)
 * - Health checks and cleanup
 * - Automatic resource management
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Days 3-4: Browser Queue & Pool
 */

export interface BrowserInstance {
  id: string;
  pid?: number;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
  healthy: boolean;
  sessionCount: number;
}

export interface BrowserPoolOptions {
  maxInstances?: number;
  maxSessionsPerInstance?: number;
  instanceTimeout?: number; // In milliseconds
  healthCheckInterval?: number; // In milliseconds
}

export class BrowserPool {
  private instances: Map<string, BrowserInstance> = new Map();
  private readonly maxInstances: number;
  private readonly maxSessionsPerInstance: number;
  private readonly instanceTimeout: number;
  private readonly healthCheckInterval: number;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(options: BrowserPoolOptions = {}) {
    this.maxInstances = options.maxInstances || 5;
    this.maxSessionsPerInstance = options.maxSessionsPerInstance || 10;
    this.instanceTimeout = options.instanceTimeout || 5 * 60 * 1000; // 5 minutes
    this.healthCheckInterval = options.healthCheckInterval || 30 * 1000; // 30 seconds

    // Start health check loop
    this.startHealthChecks();
  }

  /**
   * Acquire a browser instance from the pool
   * Returns an existing healthy instance or creates a new one
   */
  async acquire(): Promise<BrowserInstance> {
    // Try to find an available healthy instance
    const available = Array.from(this.instances.values()).find(
      (instance) =>
        !instance.inUse &&
        instance.healthy &&
        instance.sessionCount < this.maxSessionsPerInstance
    );

    if (available) {
      available.inUse = true;
      available.lastUsedAt = Date.now();
      console.log('[BrowserPool] Reusing instance:', available.id);
      return available;
    }

    // Create new instance if under limit
    if (this.instances.size < this.maxInstances) {
      const instance = await this.createInstance();
      console.log('[BrowserPool] Created new instance:', instance.id);
      return instance;
    }

    // Wait for an instance to become available
    console.log('[BrowserPool] Pool full, waiting for available instance...');
    return await this.waitForAvailableInstance();
  }

  /**
   * Release a browser instance back to the pool
   */
  release(instanceId: string): void {
    const instance = this.instances.get(instanceId);

    if (!instance) {
      console.warn('[BrowserPool] Attempted to release unknown instance:', instanceId);
      return;
    }

    instance.inUse = false;
    instance.lastUsedAt = Date.now();
    instance.sessionCount++;

    console.log('[BrowserPool] Released instance:', instanceId, {
      sessionCount: instance.sessionCount,
    });

    // Retire instance if it's been used too many times
    if (instance.sessionCount >= this.maxSessionsPerInstance) {
      console.log('[BrowserPool] Retiring instance (max sessions reached):', instanceId);
      this.destroyInstance(instanceId);
    }
  }

  /**
   * Create a new browser instance
   */
  private async createInstance(): Promise<BrowserInstance> {
    const instance: BrowserInstance = {
      id: `browser-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      inUse: true,
      healthy: true,
      sessionCount: 0,
    };

    // TODO: Launch actual browser instance (Playwright/Puppeteer)
    // For now, just track metadata
    // Example:
    // const browser = await playwright.chromium.launch({
    //   headless: true,
    //   args: ['--no-sandbox', '--disable-setuid-sandbox']
    // });
    // instance.pid = browser.pid;

    this.instances.set(instance.id, instance);

    return instance;
  }

  /**
   * Destroy a browser instance
   */
  private async destroyInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);

    if (!instance) {
      return;
    }

    try {
      // TODO: Close actual browser instance
      // Example:
      // await browser.close();

      this.instances.delete(instanceId);
      console.log('[BrowserPool] Destroyed instance:', instanceId);
    } catch (error) {
      console.error('[BrowserPool] Error destroying instance:', instanceId, error);
    }
  }

  /**
   * Wait for an available instance
   */
  private async waitForAvailableInstance(): Promise<BrowserInstance> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // Try to acquire again
        const available = Array.from(this.instances.values()).find(
          (instance) =>
            !instance.inUse &&
            instance.healthy &&
            instance.sessionCount < this.maxSessionsPerInstance
        );

        if (available) {
          clearInterval(checkInterval);
          available.inUse = true;
          available.lastUsedAt = Date.now();
          resolve(available);
        }
      }, 1000); // Check every second
    });
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  /**
   * Perform health checks on all instances
   */
  private async performHealthChecks(): Promise<void> {
    const now = Date.now();

    for (const [instanceId, instance] of this.instances.entries()) {
      // Check if instance has timed out
      if (now - instance.lastUsedAt > this.instanceTimeout) {
        console.log('[BrowserPool] Instance timed out:', instanceId);
        await this.destroyInstance(instanceId);
        continue;
      }

      // Check if instance is still healthy
      // TODO: Implement actual health check (e.g., ping browser)
      // For now, assume healthy if not timed out
      instance.healthy = true;
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    inUse: number;
    available: number;
    healthy: number;
    unhealthy: number;
  } {
    const instances = Array.from(this.instances.values());

    return {
      total: instances.length,
      inUse: instances.filter((i) => i.inUse).length,
      available: instances.filter((i) => !i.inUse && i.healthy).length,
      healthy: instances.filter((i) => i.healthy).length,
      unhealthy: instances.filter((i) => !i.healthy).length,
    };
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): BrowserInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Force destroy all instances (cleanup)
   */
  async destroyAll(): Promise<void> {
    console.log('[BrowserPool] Destroying all instances...');

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    const destroyPromises = Array.from(this.instances.keys()).map((id) =>
      this.destroyInstance(id)
    );

    await Promise.all(destroyPromises);

    console.log('[BrowserPool] All instances destroyed');
  }

  /**
   * Mark instance as unhealthy
   */
  markUnhealthy(instanceId: string): void {
    const instance = this.instances.get(instanceId);

    if (instance) {
      instance.healthy = false;
      console.log('[BrowserPool] Marked instance as unhealthy:', instanceId);

      // Destroy unhealthy instances immediately if not in use
      if (!instance.inUse) {
        this.destroyInstance(instanceId);
      }
    }
  }
}

// Singleton instance
let poolInstance: BrowserPool | null = null;

/**
 * Get singleton pool instance
 */
export function getBrowserPool(): BrowserPool {
  if (!poolInstance) {
    poolInstance = new BrowserPool();
  }

  return poolInstance;
}

/**
 * Cleanup browser pool (for graceful shutdown)
 */
export async function cleanupBrowserPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.destroyAll();
    poolInstance = null;
  }
}
