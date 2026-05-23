import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent } from '@/next/lib/security/event-logger';
import { checkRateLimit } from '@/next/lib/security/rate-limiter';
import { assessThreat } from '@/next/lib/security/threat-classifier';

const BODY_CHECK_METHODS = new Set(['POST', 'PUT', 'PATCH']);
const MIDDLEWARE_DB_TIMEOUT_MS = 350;

function allowByDefault() {
  return { allowed: true, remaining: 999, resetAt: Date.now() + 60_000 };
}

async function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = MIDDLEWARE_DB_TIMEOUT_MS): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function clientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function rateKey(pathname: string) {
  if (pathname.includes('/api/agent') || pathname.includes('/api/chat')) return 'api:chat';
  if (pathname.includes('/api/auth') || pathname.includes('/auth')) return 'api:auth';
  if (pathname.includes('/api/media')) return 'api:media';
  return 'api:default';
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = clientIp(request);
  const key = rateKey(path);
  const identifier = `ip:${ip}:${key}`;

  const rateResult = await withTimeout(checkRateLimit(identifier, key), allowByDefault());
  if (!rateResult.allowed) {
    logSecurityEvent({
      eventType: 'rate_limit_exceeded',
      severity: 'medium',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      actionTaken: 'rate_limited',
      payload: { path, method: request.method },
    }).catch(() => {});

    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(Math.ceil((rateResult.resetAt - Date.now()) / 1000), 1)),
      },
    });
  }

  if (BODY_CHECK_METHODS.has(request.method)) {
    const body = await request.clone().text().catch(() => '');
    if (body) {
      const threat = assessThreat(body);
      if (threat.isInjection) {
        logSecurityEvent({
          eventType: 'injection_attempt',
          severity: threat.severity,
          ipAddress: ip,
          userAgent: request.headers.get('user-agent'),
          actionTaken: threat.severity === 'critical' ? 'blocked' : 'logged_only',
          payload: { flags: threat.flags, path, method: request.method },
        }).catch(() => {});

        if (threat.severity === 'critical') {
          return new NextResponse('Forbidden', { status: 403 });
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
