/**
 * Tests for the Social Army Railway worker components.
 *
 * Validates:
 *   - railway.json config is correct for Railway deployment
 *   - Semaphore bounded concurrency behaves correctly
 *   - Health server responds correctly (mirrors the worker's /health endpoint)
 *   - brand-context.json has all required fields for the content engine
 *   - Dockerfile declares required env vars and health check
 *
 * All tests run without real Supabase, GFXToolz, Puppeteer, or API calls.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import http from 'http'
import type { AddressInfo } from 'net'
import path from 'path'
import fs from 'fs'

// ─── Railway Config ───────────────────────────────────────────────────────────

describe('railway.json: deployment configuration', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = require('../../railway.json')

  it('specifies Dockerfile builder targeting social-army', () => {
    expect(config.build.builder).toBe('DOCKERFILE')
    expect(config.build.dockerfilePath).toBe('social-army/Dockerfile')
  })

  it('starts the worker with tsx', () => {
    expect(config.deploy.startCommand).toContain('worker.ts')
    expect(config.deploy.startCommand).toMatch(/tsx/)
  })

  it('has a health check path at /health', () => {
    expect(config.deploy.healthcheckPath).toBe('/health')
    expect(config.deploy.healthcheckTimeout).toBeGreaterThan(0)
  })

  it('restarts on failure', () => {
    expect(config.deploy.restartPolicyType).toBe('ON_FAILURE')
    expect(config.deploy.restartPolicyMaxRetries).toBeGreaterThan(0)
  })

  it('runs exactly one replica', () => {
    expect(config.deploy.numReplicas).toBe(1)
  })
})

// ─── Brand Context ────────────────────────────────────────────────────────────

describe('brand-context.json: content engine configuration', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const brandContext = require('../../social-army/config/brand-context.json')

  it('has brand metadata', () => {
    expect(brandContext.brand).toHaveProperty('name', 'CubiQo')
    expect(brandContext.brand).toHaveProperty('tagline')
    expect(brandContext.brand).toHaveProperty('hashtags')
    expect(Array.isArray(brandContext.brand.hashtags)).toBe(true)
    expect(brandContext.brand.hashtags.length).toBeGreaterThan(0)
  })

  it('has all 5 persona definitions', () => {
    const REQUIRED_PERSONAS = ['builder', 'guru', 'philosopher', 'artist', 'memer']
    for (const persona of REQUIRED_PERSONAS) {
      expect(brandContext.personas).toHaveProperty(persona)
      expect(brandContext.personas[persona]).toHaveProperty('voice')
      expect(brandContext.personas[persona]).toHaveProperty('topics')
      expect(brandContext.personas[persona]).toHaveProperty('example_post')
    }
  })

  it('has tone guide with do and dont rules', () => {
    expect(brandContext.tone_guide).toHaveProperty('do')
    expect(brandContext.tone_guide).toHaveProperty('dont')
    expect(Array.isArray(brandContext.tone_guide.do)).toBe(true)
    expect(Array.isArray(brandContext.tone_guide.dont)).toBe(true)
  })

  it('has features list', () => {
    expect(Array.isArray(brandContext.features)).toBe(true)
    expect(brandContext.features.length).toBeGreaterThan(0)
  })

  it('has image prompts for visual content generation', () => {
    expect(brandContext.image_prompts).toBeDefined()
    expect(typeof brandContext.image_prompts).toBe('object')
    expect(Object.keys(brandContext.image_prompts).length).toBeGreaterThan(0)
  })
})

// ─── Semaphore (mirrors worker.ts bounded concurrency) ───────────────────────

describe('Semaphore: bounded concurrency', () => {
  class Semaphore {
    private count: number
    private waiters: Array<() => void> = []
    constructor(n: number) { this.count = n }

    async acquire(): Promise<() => void> {
      if (this.count > 0) {
        this.count--
        return () => this._release()
      }
      return new Promise(resolve => {
        this.waiters.push(() => { this.count--; resolve(() => this._release()) })
      })
    }

    private _release() {
      this.count++
      const next = this.waiters.shift()
      if (next) { this.count--; next() }
    }

    get available() { return this.count }
  }

  it('allows up to N concurrent acquisitions', async () => {
    const sem = new Semaphore(3)
    const releases: Array<() => void> = []

    for (let i = 0; i < 3; i++) {
      releases.push(await sem.acquire())
    }
    expect(sem.available).toBe(0)

    releases[0]()
    expect(sem.available).toBe(1)
    releases[1]()
    releases[2]()
    expect(sem.available).toBe(3)
  })

  it('queues tasks beyond the concurrency limit', async () => {
    const sem = new Semaphore(1)
    const order: number[] = []

    const release1 = await sem.acquire()

    // Task 2 must wait
    const task2 = sem.acquire().then(release => {
      order.push(2)
      release()
    })

    order.push(1)
    release1()
    await task2

    expect(order).toEqual([1, 2])
  })

  it('processes all tasks when concurrency=1 (sequential)', async () => {
    const sem = new Semaphore(1)
    const results: number[] = []

    async function run(n: number) {
      const release = await sem.acquire()
      results.push(n)
      release()
    }

    await Promise.all([run(1), run(2), run(3)])
    expect(results.sort()).toEqual([1, 2, 3])
  })

  it('handles high concurrency without deadlocks', async () => {
    const sem = new Semaphore(5)
    const tasks = Array.from({ length: 20 }, (_, i) => async () => {
      const release = await sem.acquire()
      await new Promise(r => setTimeout(r, 1))
      release()
      return i
    })
    const results = await Promise.allSettled(tasks.map(t => t()))
    expect(results.every(r => r.status === 'fulfilled')).toBe(true)
  })
})

// ─── Health Server ────────────────────────────────────────────────────────────

describe('Railway health server: /health endpoint', () => {
  let server: http.Server
  let port: number

  beforeEach(async () => {
    const startTime = Date.now()
    server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'ok',
          uptime: Math.floor((Date.now() - startTime) / 1000),
          worker: 'social-army-v3',
        }))
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as AddressInfo).port
        resolve()
      })
    })
  })

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('responds 200 to /health with correct JSON shape', async () => {
    const res = await fetch(`http://localhost:${port}/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.worker).toBe('social-army-v3')
    expect(typeof body.uptime).toBe('number')
    expect(body.uptime).toBeGreaterThanOrEqual(0)
  })

  it('returns 404 for any other route', async () => {
    const res = await fetch(`http://localhost:${port}/metrics`)
    expect(res.status).toBe(404)
  })

  it('Content-Type is application/json', async () => {
    const res = await fetch(`http://localhost:${port}/health`)
    expect(res.headers.get('content-type')).toContain('application/json')
  })
})

// ─── Dockerfile validation ────────────────────────────────────────────────────

describe('social-army/Dockerfile: Railway deployment requirements', () => {
  const dockerfilePath = path.resolve(__dirname, '../../social-army/Dockerfile')
  const dockerfile = fs.readFileSync(dockerfilePath, 'utf-8')

  it('starts from a Node 20 base image', () => {
    expect(dockerfile).toMatch(/FROM node:20/)
  })

  it('skips Puppeteer Chromium download (uses system Chromium)', () => {
    expect(dockerfile).toContain('PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true')
    expect(dockerfile).toContain('PUPPETEER_EXECUTABLE_PATH')
  })

  it('exposes a port for the health server', () => {
    expect(dockerfile).toMatch(/EXPOSE\s+\d+/)
  })

  it('starts the worker with tsx', () => {
    expect(dockerfile).toMatch(/CMD.*tsx.*worker/)
  })

  it('includes a HEALTHCHECK directive', () => {
    expect(dockerfile).toContain('HEALTHCHECK')
    expect(dockerfile).toContain('/health')
  })

  it('installs Chromium system deps', () => {
    expect(dockerfile).toContain('chromium')
  })
})
