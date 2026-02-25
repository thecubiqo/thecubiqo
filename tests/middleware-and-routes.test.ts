/**
 * Tests for the domain-routing middleware and the independent
 * /coder and /marketing route existence.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mock Supabase middleware ─────────────────────────────────────────────────

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn((req: NextRequest) =>
    NextResponse.next({ request: req })
  ),
}));

import { middleware, config } from '../middleware';
import { updateSession } from '@/lib/supabase/middleware';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url: string, host: string): NextRequest {
  return new NextRequest(new URL(url), {
    headers: { host },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Domain-routing middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rewrites cubiqo.dev root to /coder', async () => {
    const req = makeRequest('http://cubiqo.dev/', 'cubiqo.dev');
    const res = await middleware(req);

    // Rewrite preserves 200 status
    expect(res.status).toBe(200);
    // The rewritten URL should contain /coder
    expect(res.headers.get('x-middleware-rewrite')).toContain('/coder');
  });

  it('rewrites cubiqo.marketing root to /marketing', async () => {
    const req = makeRequest('http://cubiqo.marketing/', 'cubiqo.marketing');
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-rewrite')).toContain('/marketing');
  });

  it('passes through API routes for mapped domains', async () => {
    const req = makeRequest(
      'http://cubiqo.dev/api/code/terminal',
      'cubiqo.dev'
    );
    const res = await middleware(req);

    // Should NOT rewrite — API routes pass through
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(updateSession).toHaveBeenCalledWith(req);
  });

  it('does not rewrite cubiqo.dev/coder (already correct prefix)', async () => {
    const req = makeRequest('http://cubiqo.dev/coder', 'cubiqo.dev');
    const res = await middleware(req);

    // Already on the right prefix — pass through
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(updateSession).toHaveBeenCalledWith(req);
  });

  it('passes through for unmapped domains (cubiqo.ai)', async () => {
    const req = makeRequest('http://cubiqo.ai/dashboard', 'cubiqo.ai');
    const res = await middleware(req);

    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(updateSession).toHaveBeenCalledWith(req);
  });

  it('handles www prefix for mapped domains', async () => {
    const req = makeRequest('http://www.cubiqo.dev/', 'www.cubiqo.dev');
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-rewrite')).toContain('/coder');
  });

  it('strips port from host for local dev', async () => {
    const req = makeRequest('http://cubiqo.dev:3000/', 'cubiqo.dev:3000');
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-rewrite')).toContain('/coder');
  });

  it('exports a matcher config', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
  });
});

// ─── Cron schedule ───────────────────────────────────────────────────────────

describe('Self-heal cron schedule (vercel.json)', () => {
  it('is set to 10 AM EST (15:00 UTC)', async () => {
    const fs = await import('fs');
    const vercelConfig = JSON.parse(
      fs.readFileSync(
        '/home/runner/work/thecubiqo/thecubiqo/vercel.json',
        'utf-8'
      )
    );
    const selfHealCron = vercelConfig.crons.find(
      (c: any) => c.path === '/api/cron/self-heal'
    );
    expect(selfHealCron).toBeDefined();
    // 0 15 * * * = daily at 15:00 UTC = 10:00 AM EST
    expect(selfHealCron.schedule).toBe('0 15 * * *');
  });
});

// ─── Self-heal email recipient ───────────────────────────────────────────────

describe('Self-heal email configuration', () => {
  it('defaults to aditya@cubiqo.ai', async () => {
    const fs = await import('fs');
    const emailCode = fs.readFileSync(
      '/home/runner/work/thecubiqo/thecubiqo/src/lib/self-heal/email.ts',
      'utf-8'
    );
    expect(emailCode).toContain('aditya@cubiqo.ai');
  });
});

// ─── Platform config ─────────────────────────────────────────────────────────

describe('Marketing platforms config', () => {
  it('defines exactly 10 platforms', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const platforms = require('../social-army/config/platforms.json');
    expect(platforms).toHaveLength(10);

    const names = platforms.map((p: { platform: string }) => p.platform);
    const expected = [
      'twitter',
      'linkedin',
      'instagram',
      'tiktok',
      'youtube',
      'reddit',
      'pinterest',
      'threads',
      'facebook',
      'discord',
    ];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });
});
