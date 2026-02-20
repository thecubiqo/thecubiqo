// Redis client for caching and session management
// ioredis is loaded dynamically to avoid build failures when not installed
type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<string>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  incrby(key: string, increment: number): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  quit(): Promise<string>;
  on(event: string, listener: (...args: any[]) => void): void;
};

let redis: RedisClient | null = null;

/**
 * Get or create Redis client
 * Falls back to in-memory store if Redis is not available
 */
export function getRedisClient(): RedisClient | null {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  
  if (!redisUrl) {
    console.warn('Redis URL not configured. Session store will use in-memory fallback.');
    return null;
  }

  try {
    // Dynamic import to avoid build failure when ioredis is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IoRedis = require('ioredis');
    redis = new IoRedis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
    });

    redis!.on('error', (err: Error) => {
      console.error('Redis error:', err);
    });

    redis!.on('connect', () => {
      console.log('Redis connected successfully');
    });

    return redis;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

/**
 * Cache wrapper with automatic serialization
 */
export class RedisCache {
  private client: RedisClient | null;
  private prefix: string;

  constructor(prefix: string = 'cubiqo') {
    this.client = getRedisClient();
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const data = await this.client.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    if (!this.client) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(this.getKey(key), ttlSeconds, serialized);
      } else {
        await this.client.set(this.getKey(key), serialized);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.del(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) return [];

    try {
      const keys = await this.client.keys(this.getKey(pattern));
      return keys.map((k) => k.replace(`${this.prefix}:`, ''));
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.client) return 0;

    try {
      return await this.client.incrby(this.getKey(key), amount);
    } catch (error) {
      console.error('Redis increment error:', error);
      return 0;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.expire(this.getKey(key), ttlSeconds);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const keys = await this.client.keys(this.getKey('*'));
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      redis = null;
    }
  }
}

/**
 * Session-specific cache
 */
export class SessionCache extends RedisCache {
  constructor() {
    super('session');
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`data:${sessionId}`);
  }

  async setSession(sessionId: string, data: unknown, ttlSeconds: number = 3600): Promise<boolean> {
    return this.set(`data:${sessionId}`, data, ttlSeconds);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.delete(`data:${sessionId}`);
  }

  async getMessages(sessionId: string): Promise<any[]> {
    const messages = await this.get<any[]>(`messages:${sessionId}`);
    return messages || [];
  }

  async addMessage(sessionId: string, message: unknown): Promise<boolean> {
    const messages = await this.getMessages(sessionId);
    messages.push(message);
    return this.set(`messages:${sessionId}`, messages, 3600);
  }
}

/**
 * AI response cache for semantic caching
 */
export class AIResponseCache extends RedisCache {
  constructor() {
    super('ai');
  }

  async getCachedResponse(promptHash: string): Promise<any | null> {
    return this.get(`response:${promptHash}`);
  }

  async cacheResponse(promptHash: string, response: unknown, ttlSeconds: number = 1800): Promise<boolean> {
    return this.set(`response:${promptHash}`, response, ttlSeconds);
  }
}
