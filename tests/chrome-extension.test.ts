/**
 * Tests for Chrome Extension
 * Validates manifest structure and extension configuration
 */

import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const extensionDir = resolve(__dirname, '../chrome-extension')

describe('Chrome Extension Manifest', () => {
  const manifest = JSON.parse(readFileSync(resolve(extensionDir, 'manifest.json'), 'utf-8'))

  test('uses manifest v3', () => {
    expect(manifest.manifest_version).toBe(3)
  })

  test('has required permissions', () => {
    expect(manifest.permissions).toContain('sidePanel')
    expect(manifest.permissions).toContain('activeTab')
    expect(manifest.permissions).toContain('tabs')
    expect(manifest.permissions).toContain('storage')
    expect(manifest.permissions).toContain('scripting')
  })

  test('has host permissions for all URLs', () => {
    expect(manifest.host_permissions).toContain('<all_urls>')
  })

  test('has content scripts registered', () => {
    expect(manifest.content_scripts).toBeDefined()
    expect(manifest.content_scripts.length).toBeGreaterThan(0)
    expect(manifest.content_scripts[0].js).toContain('content-script.js')
    expect(manifest.content_scripts[0].matches).toContain('<all_urls>')
  })

  test('has service worker configured', () => {
    expect(manifest.background).toBeDefined()
    expect(manifest.background.service_worker).toBe('service-worker.js')
  })

  test('has side panel configured', () => {
    expect(manifest.side_panel).toBeDefined()
    expect(manifest.side_panel.default_path).toBe('sidepanel.html')
  })

  test('has icons defined', () => {
    expect(manifest.icons).toBeDefined()
    expect(manifest.icons['16']).toBe('icon16.png')
    expect(manifest.icons['48']).toBe('icon48.png')
    expect(manifest.icons['128']).toBe('icon128.png')
  })

  test('has CSP allowing production domain', () => {
    const csp = manifest.content_security_policy.extension_pages
    expect(csp).toContain('https://*.cubiqo.ai')
  })

  test('version is updated', () => {
    expect(manifest.version).toBe('1.1')
  })
})

describe('Chrome Extension Files', () => {
  test('content-script.js exists', () => {
    const content = readFileSync(resolve(extensionDir, 'content-script.js'), 'utf-8')
    expect(content).toContain('__cubiqoContentScriptLoaded')
    expect(content).toContain('PAGE_CONTEXT')
    expect(content).toContain('BROWSER_ACTION')
    expect(content).toContain('pushState')
    expect(content).toContain('replaceState')
  })

  test('service-worker.js has message handling', () => {
    const content = readFileSync(resolve(extensionDir, 'service-worker.js'), 'utf-8')
    expect(content).toContain('PAGE_CONTEXT')
    expect(content).toContain('BROWSER_CONTROL')
    expect(content).toContain('handleBrowserControl')
    expect(content).toContain('list_tabs')
    expect(content).toContain('navigate')
    expect(content).toContain('screenshot')
  })

  test('sidepanel.js uses secure postMessage', () => {
    const content = readFileSync(resolve(extensionDir, 'sidepanel.js'), 'utf-8')
    // Should derive target origin from iframe src rather than using wildcard
    expect(content).toContain('TARGET_ORIGIN')
    // Verify postMessage calls use TARGET_ORIGIN variable
    expect(content).toMatch(/postMessage\([^)]+,\s*TARGET_ORIGIN\)/)
  })

  test('sidepanel.html has connection status indicator', () => {
    const content = readFileSync(resolve(extensionDir, 'sidepanel.html'), 'utf-8')
    expect(content).toContain('connection-status')
  })
})
