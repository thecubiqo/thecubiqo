// Performance monitoring and metrics tracking
import { RedisCache } from './redis';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface ResponseTimeMetrics {
  count: number;
  total: number;
  average: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private cache: RedisCache;
  private readonly MAX_METRICS = 1000;
  private readonly ALERT_THRESHOLD_MS = 200; // Alert if response > 200ms

  constructor() {
    this.cache = new RedisCache('metrics');
  }

  /**
   * Start timing a performance metric
   */
  startTimer(name: string): () => Promise<number> {
    const startTime = performance.now();

    return async () => {
      const duration = performance.now() - startTime;
      await this.recordMetric(name, duration);
      
      // Alert if exceeds threshold
      if (duration > this.ALERT_THRESHOLD_MS) {
        console.warn(`Performance alert: ${name} took ${duration.toFixed(2)}ms (threshold: ${this.ALERT_THRESHOLD_MS}ms)`);
      }

      return duration;
    };
  }

  /**
   * Record a performance metric
   */
  async recordMetric(name: string, duration: number, metadata?: Record<string, unknown>): Promise<void> {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      metadata,
    };

    // Add to in-memory array
    this.metrics.push(metric);
    
    // Keep only last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Store in Redis for aggregation
    try {
      const key = `${name}:${Date.now()}`;
      await this.cache.set(key, metric, 86400); // 24 hour TTL
      
      // Increment counter
      await this.cache.increment(`count:${name}`);
    } catch (error) {
      console.error('Failed to record metric in Redis:', error);
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Calculate response time statistics
   */
  getResponseTimeMetrics(name: string): ResponseTimeMetrics | null {
    const metrics = this.getMetrics(name);
    
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const count = durations.length;

    return {
      count,
      total,
      average: total / count,
      min: durations[0],
      max: durations[count - 1],
      p50: durations[Math.floor(count * 0.5)],
      p95: durations[Math.floor(count * 0.95)],
      p99: durations[Math.floor(count * 0.99)],
    };
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    const names = new Set<string>();
    this.metrics.forEach((m) => names.add(m.name));
    return Array.from(names);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, ResponseTimeMetrics | null> {
    const summary: Record<string, ResponseTimeMetrics | null> = {};
    
    for (const name of this.getMetricNames()) {
      summary[name] = this.getResponseTimeMetrics(name);
    }

    return summary;
  }

  /**
   * Check if any metric exceeds the threshold
   */
  hasPerformanceIssues(): boolean {
    return this.metrics.some((m) => m.duration > this.ALERT_THRESHOLD_MS);
  }

  /**
   * Get slow operations (> threshold)
   */
  getSlowOperations(): PerformanceMetric[] {
    return this.metrics
      .filter((m) => m.duration > this.ALERT_THRESHOLD_MS)
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// Singleton instance
let monitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitor) {
    monitor = new PerformanceMonitor();
  }
  return monitor;
}

/**
 * Decorator to measure function performance
 */
export function measurePerformance(metricName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const monitor = getPerformanceMonitor();
      const endTimer = monitor.startTimer(name);

      try {
        const result = await originalMethod.apply(this, args);
        await endTimer();
        return result;
      } catch (error) {
        await endTimer();
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper to measure async operations
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const monitor = getPerformanceMonitor();
  const endTimer = monitor.startTimer(name);

  try {
    const result = await fn();
    await endTimer();
    return result;
  } catch (error) {
    await endTimer();
    throw error;
  }
}

/**
 * Helper to measure sync operations
 */
export function measure<T>(name: string, fn: () => T): T {
  const monitor = getPerformanceMonitor();
  const startTime = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - startTime;
    monitor.recordMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    monitor.recordMetric(name, duration);
    throw error;
  }
}

export { PerformanceMonitor };
export type { PerformanceMetric, ResponseTimeMetrics };
