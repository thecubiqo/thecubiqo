import { Redis } from '@upstash/redis';

// Lazy singleton — only instantiated when first accessed
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
    }
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// Session helpers
export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  try {
    return await getRedis().get<Record<string, unknown>>(`session:${sessionId}`);
  } catch {
    return null;
  }
}

export async function setSession(
  sessionId: string,
  data: Record<string, unknown>,
  ttlSeconds = 3600
): Promise<void> {
  try {
    await getRedis().set(`session:${sessionId}`, data, { ex: ttlSeconds });
  } catch {
    // Non-fatal — session cache miss is acceptable
  }
}

export async function appendMessage(
  sessionId: string,
  message: { role: string; content: string },
  maxMessages = 50
): Promise<void> {
  try {
    const redis = getRedis();
    const key = `messages:${sessionId}`;
    await redis.rpush(key, JSON.stringify(message));
    await redis.ltrim(key, -maxMessages, -1);
    await redis.expire(key, 86400); // 24h TTL
  } catch {
    // Non-fatal
  }
}

export async function getMessages(sessionId: string): Promise<{ role: string; content: string }[]> {
  try {
    const raw = await getRedis().lrange(`messages:${sessionId}`, 0, -1);
    return raw.map(r => (typeof r === 'string' ? JSON.parse(r) : r));
  } catch {
    return [];
  }
}
