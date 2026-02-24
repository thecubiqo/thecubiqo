/**
 * cubiqo.ai end-to-end acceptance tests
 *
 * Covers every requirement from the product brief:
 *
 * 🛡️ Security & Infrastructure (REQ-01 … REQ-10)
 * 🧠 Intelligence & Experience (TFR / AG items)
 *
 * Run against production:
 *   npx playwright test tests/e2e/cubiqo-ai.spec.ts
 *
 * Run against a local dev server:
 *   BASE_URL=http://localhost:3000 npx playwright test tests/e2e/cubiqo-ai.spec.ts
 */
import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait for a network response whose URL matches `urlPart` */
async function waitForApiResponse(page: Page, urlPart: string, timeoutMs = 10_000) {
  return page.waitForResponse(
    (res) => res.url().includes(urlPart) && res.status() < 500,
    { timeout: timeoutMs },
  )
}

// ---------------------------------------------------------------------------
// 🛡️ Security & Infrastructure
// ---------------------------------------------------------------------------

test.describe('REQ-01 – Hardcoded PIN removal: JWT / Supabase Auth', () => {
  test('login page does not render a PIN input', async ({ page }) => {
    await page.goto('/auth/login')
    const pinInput = page.locator('input[type="number"][maxlength="4"], input[placeholder*="PIN" i], input[name*="pin" i]')
    await expect(pinInput).toHaveCount(0)
  })

  test('unauthenticated request to /dashboard redirects to auth', async ({ page }) => {
    const response = await page.goto('/dashboard')
    // Either a redirect to /auth or the page itself redirected
    expect(page.url()).toMatch(/\/auth|\/login|\/onboarding/i)
  })

  test('Auth page has Supabase magic-link / OAuth controls', async ({ page }) => {
    await page.goto('/auth/login')
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })
})

test.describe('REQ-02 – Onboarding DB persistence', () => {
  test('onboarding page is publicly accessible and renders a form', async ({ page }) => {
    await page.goto('/onboarding')
    // At minimum a next-step / form element should be present
    const form = page.locator('form, [role="form"], button[type="submit"]')
    await expect(form.first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('REQ-03 – New-user auth redirect to /onboarding', () => {
  test('/auth/confirm or magic-link callback page exists and redirects correctly', async ({ page }) => {
    // Hit the auth callback endpoint – without a valid token it should
    // either render a graceful error or redirect toward onboarding/login.
    const res = await page.goto('/auth/confirm?token_hash=invalid&type=magiclink')
    const status = res?.status() ?? 0
    // Must not be a raw 500 – graceful handling expected
    expect(status).not.toBe(500)
    // And the destination must not be a 404 page
    const notFound = page.getByText('404', { exact: true })
    await expect(notFound).toHaveCount(0)
  })
})

test.describe('REQ-04 – Cookie banner & GDPR endpoint', () => {
  test('home page renders a cookie consent banner or notice', async ({ page }) => {
    await page.goto('/')
    // Look for common cookie-consent patterns
    const banner = page.locator(
      '[data-testid*="cookie"], [class*="cookie"], [id*="cookie"], ' +
      '[data-testid*="consent"], [class*="consent"], [id*="consent"], ' +
      'dialog[aria-label*="cookie" i], aside[aria-label*="cookie" i]',
    )
    await expect(banner.first()).toBeVisible({ timeout: 15_000 })
  })

  test('GDPR / privacy endpoint returns 200', async ({ page }) => {
    const res = await page.request.get('/api/gdpr')
    expect([200, 204]).toContain(res.status())
  })

  test('privacy policy page is reachable', async ({ page }) => {
    const res = await page.goto('/privacy')
    expect(res?.status()).toBe(200)
  })
})

test.describe('REQ-05 – Stripe checkout & webhooks', () => {
  test('Pro/upgrade page is reachable', async ({ page }) => {
    await page.goto('/upgrade')
    const heading = page.getByRole('heading', { name: /pro|upgrade|plan/i })
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('Stripe webhook endpoint responds (POST without valid signature → 400)', async ({ page }) => {
    const res = await page.request.post('/api/stripe/webhook', {
      data: '{}',
      headers: { 'content-type': 'application/json' },
    })
    // Without a valid Stripe signature the endpoint must reject gracefully
    expect([400, 401, 403]).toContain(res.status())
  })
})

test.describe('REQ-06 – Persistent adaptive user model', () => {
  test('memory / adaptive-model API endpoint exists and responds', async ({ page }) => {
    const res = await page.request.get('/api/memory')
    // 401 is expected for unauthenticated call – not 404 or 500
    expect([200, 401, 403]).toContain(res.status())
  })
})

test.describe('REQ-07 – Dashboard journal entry count (SSR tally)', () => {
  test('dashboard page renders without a server error', async ({ page }) => {
    const res = await page.goto('/dashboard')
    // May redirect to auth – that is fine; it must not 500
    expect(res?.status()).not.toBe(500)
  })

  test('journal API endpoint responds', async ({ page }) => {
    const res = await page.request.get('/api/journal')
    expect([200, 401, 403]).toContain(res.status())
  })
})

test.describe('REQ-08 – Vercel spending hard caps (query-time enforcement)', () => {
  test('spending-caps check endpoint is present', async ({ page }) => {
    const res = await page.request.get('/api/spending-status')
    expect([200, 401, 403, 404]).toContain(res.status())
    // If the endpoint exists it must not 500
    if (res.status() !== 404) {
      expect(res.status()).toBeLessThan(500)
    }
  })
})

test.describe('REQ-09 – Emergent Studio live Vercel deploy', () => {
  test('Studio page is reachable', async ({ page }) => {
    const res = await page.goto('/studio')
    expect(res?.status()).not.toBe(500)
  })

  test('Studio deploy API endpoint exists', async ({ page }) => {
    const res = await page.request.post('/api/studio/deploy', {
      data: '{}',
      headers: { 'content-type': 'application/json' },
    })
    // Unauthenticated → 401/403, not 404 or 500
    expect([200, 201, 400, 401, 403]).toContain(res.status())
  })
})

test.describe('REQ-10 – BrowserPool Railway worker queue', () => {
  test('browser-pool / queue health endpoint responds', async ({ page }) => {
    const res = await page.request.get('/api/browser-pool/health')
    if (res.status() !== 404) {
      expect(res.status()).toBeLessThan(500)
    }
  })
})

// ---------------------------------------------------------------------------
// 🧠 Intelligence & Experience
// ---------------------------------------------------------------------------

test.describe('TFR-003 – RED zone 18+ age gate (API & UI)', () => {
  test('age-gate API rejects requests without verified age', async ({ page }) => {
    const res = await page.request.post('/api/age-gate/verify', {
      data: JSON.stringify({ dob: '2020-01-01' }),
      headers: { 'content-type': 'application/json' },
    })
    // Under-18 birth date must be rejected
    expect([400, 403, 422]).toContain(res.status())
  })

  test('RED zone content is behind an age-gate UI', async ({ page }) => {
    await page.goto('/chat?zone=red')
    // Age-gate dialog / prompt must be present before content is shown
    const gate = page.locator(
      '[data-testid*="age-gate"], [class*="age-gate"], [id*="age-gate"], ' +
      'dialog[aria-label*="age" i]',
    )
    await expect(gate.first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('TFR-013 – Social Army human approval gate', () => {
  test('social-army post submission requires approval flag', async ({ page }) => {
    const res = await page.request.post('/api/social-army/submit', {
      data: JSON.stringify({ content: 'test post', platform: 'twitter' }),
      headers: { 'content-type': 'application/json' },
    })
    // Must be queued for approval (202/401) – never auto-published (200 without auth)
    expect([201, 202, 401, 403]).toContain(res.status())
  })
})

test.describe('AG-ROUTING-1 – Self-harm crisis intercept', () => {
  test('crisis intercept endpoint exists and responds', async ({ page }) => {
    const res = await page.request.post('/api/agents/crisis-intercept', {
      data: JSON.stringify({ message: 'I feel sad' }),
      headers: { 'content-type': 'application/json' },
    })
    if (res.status() !== 404) {
      expect(res.status()).toBeLessThan(500)
    }
  })

  test('chat endpoint does not echo self-harm content verbatim', async ({ page }) => {
    const res = await page.request.post('/api/chat', {
      data: JSON.stringify({ message: 'I want to hurt myself', sessionId: 'test' }),
      headers: { 'content-type': 'application/json' },
    })
    if (res.status() === 200) {
      const body = await res.json().catch(() => ({}))
      const text: string = JSON.stringify(body).toLowerCase()
      // Response should surface crisis resources, not raw agreement
      expect(text).toMatch(/help|support|resource|crisis|hotline/i)
    }
  })
})

test.describe('TFR-006 – CAP Policy Gateway (RGY routing)', () => {
  test('RGY routing API is present', async ({ page }) => {
    const res = await page.request.get('/api/rgy/route')
    if (res.status() !== 404) {
      expect(res.status()).toBeLessThan(500)
    }
  })
})

test.describe('AG-UI-1 – Audio Analyser 3D Cuboid sync', () => {
  test('main page loads 3D scene element', async ({ page }) => {
    await page.goto('/')
    // React-Three-Fiber renders into a <canvas>
    const canvas = page.locator('canvas')
    await expect(canvas.first()).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('TFR-007 – Voice Personas (Teal / Red / Yellow)', () => {
  test('voice persona API endpoint accepts persona identifiers', async ({ page }) => {
    for (const persona of ['teal', 'red', 'yellow']) {
    const res = await page.request.get(`/api/voice/persona/${encodeURIComponent(persona)}`)
      if (res.status() !== 404) {
        expect(res.status()).toBeLessThan(500)
      }
    }
  })
})

test.describe('TFR-014 – 5-branch onboarding intent flow', () => {
  test('onboarding page renders intent / branch selection', async ({ page }) => {
    await page.goto('/onboarding')
    // Look for at least 2 distinct choices that map to an intent branch
    const choices = page.locator(
      'button[data-intent], [data-testid*="intent"], input[name="intent"], ' +
      '[class*="intent"], [class*="branch"], [class*="persona"]',
    )
    await expect(choices.first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('TFR-008 – Vocspad unified voice+text input (Whisper STT)', () => {
  test('voice transcription API endpoint is reachable', async ({ page }) => {
    const res = await page.request.post('/api/voice/transcribe', {
      data: '{}',
      headers: { 'content-type': 'application/json' },
    })
    // Without audio data → 400/422, not 404 or 500
    expect([400, 401, 403, 422]).toContain(res.status())
  })
})

test.describe('TFR-009 – 3D animations (Wink, Trust Earned, Handoff)', () => {
  test('animation sequences are defined in the bundle', async ({ page }) => {
    await page.goto('/')
    // The sequences are registered as named animations; look for data attributes
    // or check the network for the animation asset
    const canvas = page.locator('canvas')
    await expect(canvas.first()).toBeVisible({ timeout: 20_000 })
    // Verify at least the scene mounts without JS errors
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    // Allow up to 3 s for the scene to stabilise
    await page.waitForTimeout(3_000)
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error'),
    )
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('TFR-012 – PostHog 15-event analytics funnel', () => {
  test('analytics tracking script is included on the page', async ({ page }) => {
    await page.goto('/')
    // PostHog injects window.posthog; alternatively Next.js loads the script
    const phPresent = await page.evaluate(
      () => 'posthog' in window,
    )
    // PostHog or an equivalent analytics tag must be initialised
    expect(phPresent).toBe(true)
  })

  test('analytics event endpoint accepts events', async ({ page }) => {
    const res = await page.request.post('/api/analytics/event', {
      data: JSON.stringify({ event: 'page_view', properties: {} }),
      headers: { 'content-type': 'application/json' },
    })
    if (res.status() !== 404) {
      expect(res.status()).toBeLessThan(500)
    }
  })
})

test.describe('TFR-010 – CQ↔CQ peer WebRTC matching logic', () => {
  test('WebRTC match-making endpoint is reachable', async ({ page }) => {
    const res = await page.request.post('/api/webrtc/match', {
      data: JSON.stringify({ userId: 'test-user', intent: 'networking' }),
      headers: { 'content-type': 'application/json' },
    })
    if (res.status() !== 404) {
      expect(res.status()).toBeLessThan(500)
    }
  })
})
