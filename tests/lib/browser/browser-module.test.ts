/**
 * Tests for Browser Module
 * Validates type exports, command parsing, and browser service configuration
 */

import { describe, test, expect } from 'vitest'
import { BrowserCommandParser } from '../../../src/lib/browser/command-parser'
import type {
  BrowserAction,
  BrowserResult,
  BrowserSession,
  NavigateAction,
  ClickAction,
  TypeAction,
  ScreenshotAction,
  ScrapeAction,
  FillFormAction,
  WaitAction,
  ScrollAction,
  ExtractAction,
  ConsentRequest,
} from '../../../src/lib/browser/types'

describe('Browser Module Exports', () => {
  test('all action types are importable', () => {
    // These types are used at compile-time; we verify the module resolves
    const nav: NavigateAction = { type: 'navigate', url: 'https://example.com' }
    const click: ClickAction = { type: 'click', selector: '#btn' }
    const typeAction: TypeAction = { type: 'type', selector: '#input', text: 'hello' }
    const screenshot: ScreenshotAction = { type: 'screenshot' }
    const scrape: ScrapeAction = { type: 'scrape' }
    const fillForm: FillFormAction = { type: 'fill-form', fields: { '#email': 'test@test.com' } }
    const wait: WaitAction = { type: 'wait', condition: 'timeout', value: 1000 }
    const scroll: ScrollAction = { type: 'scroll', direction: 'down' }
    const extract: ExtractAction = { type: 'extract', dataType: 'links' }

    expect(nav.type).toBe('navigate')
    expect(click.type).toBe('click')
    expect(typeAction.type).toBe('type')
    expect(screenshot.type).toBe('screenshot')
    expect(scrape.type).toBe('scrape')
    expect(fillForm.type).toBe('fill-form')
    expect(wait.type).toBe('wait')
    expect(scroll.type).toBe('scroll')
    expect(extract.type).toBe('extract')
  })

  test('BrowserResult interface is correct', () => {
    const result: BrowserResult = {
      success: true,
      timestamp: Date.now(),
    }
    expect(result.success).toBe(true)
    expect(typeof result.timestamp).toBe('number')
  })

  test('BrowserSession interface is correct', () => {
    const session: BrowserSession = {
      id: 'test-session',
      url: 'https://example.com',
      startTime: Date.now(),
      actions: [],
      consentGiven: false,
    }
    expect(session.id).toBe('test-session')
    expect(session.actions).toEqual([])
  })

  test('ConsentRequest interface is correct', () => {
    const consent: ConsentRequest = {
      action: { type: 'navigate', url: 'https://example.com' },
      reason: 'User requested navigation',
      domain: 'example.com',
    }
    expect(consent.domain).toBe('example.com')
  })
})

describe('BrowserCommandParser', () => {
  test('parses navigation commands', () => {
    const actions = BrowserCommandParser.parseCommand('go to https://google.com')
    expect(actions.length).toBeGreaterThan(0)
    expect(actions[0].type).toBe('navigate')
    expect((actions[0] as NavigateAction).url).toBe('https://google.com')
  })

  test('parses screenshot commands', () => {
    const actions = BrowserCommandParser.parseCommand('take a screenshot')
    expect(actions.length).toBeGreaterThan(0)
    expect(actions[0].type).toBe('screenshot')
  })

  test('parses full page screenshot commands', () => {
    const actions = BrowserCommandParser.parseCommand('take a full screenshot')
    expect(actions.length).toBeGreaterThan(0)
    const action = actions[0] as ScreenshotAction
    expect(action.type).toBe('screenshot')
    expect(action.fullPage).toBe(true)
  })

  test('parses scroll commands', () => {
    const actions = BrowserCommandParser.parseCommand('scroll down')
    expect(actions.length).toBeGreaterThan(0)
    expect(actions[0].type).toBe('scroll')
    expect((actions[0] as ScrollAction).direction).toBe('down')
  })

  test('parses scrape commands', () => {
    const actions = BrowserCommandParser.parseCommand('scrape this page')
    expect(actions.length).toBeGreaterThan(0)
    expect(actions[0].type).toBe('scrape')
  })

  test('generates AI prompt with current URL', () => {
    const prompt = BrowserCommandParser.generateAIPrompt(
      'find the login button',
      'https://example.com'
    )
    expect(prompt).toContain('find the login button')
    expect(prompt).toContain('https://example.com')
  })

  test('generates AI prompt without current URL', () => {
    const prompt = BrowserCommandParser.generateAIPrompt('navigate to gmail')
    expect(prompt).toContain('navigate to gmail')
    expect(prompt).not.toContain('Current page:')
  })

  test('parseWithAI handles navigate intent', async () => {
    const actions = await BrowserCommandParser.parseWithAI('go to gmail', {
      intent: 'navigate',
      parameters: { url: 'https://mail.google.com' },
    })
    expect(actions.length).toBe(1)
    expect(actions[0].type).toBe('navigate')
    expect((actions[0] as NavigateAction).url).toBe('https://mail.google.com')
  })

  test('parseWithAI handles screenshot intent', async () => {
    const actions = await BrowserCommandParser.parseWithAI('capture the page', {
      intent: 'screenshot',
      parameters: { fullPage: true },
    })
    expect(actions.length).toBe(1)
    expect(actions[0].type).toBe('screenshot')
    expect((actions[0] as ScreenshotAction).fullPage).toBe(true)
  })

  test('parseWithAI handles extract intent', async () => {
    const actions = await BrowserCommandParser.parseWithAI('get all links', {
      intent: 'extract',
      parameters: { dataType: 'links' },
    })
    expect(actions.length).toBe(1)
    expect(actions[0].type).toBe('extract')
    expect((actions[0] as ExtractAction).dataType).toBe('links')
  })

  test('parseWithAI handles search intent with multiple actions', async () => {
    const actions = await BrowserCommandParser.parseWithAI('search for cubiqo', {
      intent: 'search',
      parameters: { query: 'cubiqo' },
    })
    expect(actions.length).toBe(3) // navigate + type + click
    expect(actions[0].type).toBe('navigate')
    expect(actions[1].type).toBe('type')
    expect(actions[2].type).toBe('click')
  })

  test('returns empty array for unrecognized commands', () => {
    const actions = BrowserCommandParser.parseCommand('hello world how are you')
    expect(actions).toEqual([])
  })

  test('parses common domain shortcuts', () => {
    const gmailActions = BrowserCommandParser.parseCommand('go to gmail')
    expect(gmailActions.length).toBe(1)
    expect((gmailActions[0] as NavigateAction).url).toBe('https://mail.google.com')
  })
})
