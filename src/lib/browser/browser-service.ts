/**
 * Browser Service - Core automation logic
 * Handles all headless browser operations with security and consent
 */

import puppeteer, { Browser, Page } from 'puppeteer';
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
  ExtractAction
} from './types';

export class BrowserService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private currentSession: BrowserSession | null = null;
  private consentCallback?: (domain: string, action: string) => Promise<boolean>;

  constructor(consentCallback?: (domain: string, action: string) => Promise<boolean>) {
    this.consentCallback = consentCallback;
  }

  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    this.page = await this.browser.newPage();
    
    // Set reasonable defaults
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
  }

  /**
   * Execute a browser action with security checks
   */
  async executeAction(action: BrowserAction): Promise<BrowserResult> {
    try {
      await this.initialize();

      // Check consent for sensitive actions
      if (action.requiresConsent && this.consentCallback) {
        const currentUrl = this.page?.url() || 'unknown';
        const domain = new URL(currentUrl).hostname;
        const allowed = await this.consentCallback(domain, action.type);
        
        if (!allowed) {
          return {
            success: false,
            error: 'User consent denied',
            timestamp: Date.now(),
          };
        }
      }

      // Execute action based on type
      let result: BrowserResult;
      
      switch (action.type) {
        case 'navigate':
          result = await this.navigate(action);
          break;
        case 'click':
          result = await this.click(action);
          break;
        case 'type':
          result = await this.type(action);
          break;
        case 'screenshot':
          result = await this.screenshot(action);
          break;
        case 'scrape':
          result = await this.scrape(action);
          break;
        case 'fill-form':
          result = await this.fillForm(action);
          break;
        case 'wait':
          result = await this.wait(action);
          break;
        case 'scroll':
          result = await this.scroll(action);
          break;
        case 'extract':
          result = await this.extract(action);
          break;
        default:
          result = {
            success: false,
            error: `Unknown action type: ${(action as any).type}`,
            timestamp: Date.now(),
          };
      }

      // Record action in session
      if (this.currentSession) {
        this.currentSession.actions.push(action);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Navigate to URL
   */
  private async navigate(action: NavigateAction): Promise<BrowserResult> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.goto(action.url, {
      waitUntil: action.waitUntil || 'networkidle2',
      timeout: 30000,
    });

    return {
      success: true,
      url: this.page.url(),
      timestamp: Date.now(),
    };
  }

  /**
   * Click element
   */
  private async click(action: ClickAction): Promise<BrowserResult> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.waitForSelector(action.selector, { timeout: 10000 });
    
    if (action.waitForNavigation) {
      await Promise.all([
        this.page.waitForNavigation({ timeout: 30000 }),
        this.page.click(action.selector),
      ]);
    } else {
      await this.page.click(action.selector);
    }

    return {
      success: true,
      url: this.page.url(),
      timestamp: Date.now(),
    };
  }

  /**
   * Type text into element
   */
  private async type(action: TypeAction): Promise<BrowserResult> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.waitForSelector(action.selector, { timeout: 10000 });
    await this.page.type(action.selector, action.text, { 
      delay: action.delay || 50 
    });

    return {
      success: true,
      timestamp: Date.now(),
    };
  }

  /**
   * Take screenshot
   */
  private async screenshot(action: ScreenshotAction): Promise<BrowserResult> {
    if (!this.page) throw new Error('Browser not initialized');

    let screenshot: Buffer;

    if (action.selector) {
      const element = await this.page.$(action.selector);
      if (!element) {
        throw new Error(`Element not found: ${action.selector}`);
      }
      screenshot = await element.screenshot();
    } else {
      screenshot = await this.page.screenshot({ 
        fullPage: action.fullPage || false 
      });
    }

    return {
      success: true,
      screenshot: screenshot.toString('base64'),
      url: this.page.url(),
      timestamp: Date.now(),
    };
  }

  /**
   * Scrape page data
   */
  private async scrape(action: ScrapeAction): Promise<BrowserResult> {
    if (!this.page) throw new Error('Browser not initialized');

    if (action.waitForSelector) {
      await this.page.waitForSelector(action.waitForSelector, { timeout: 10000 });
    }

    let data: any = {};

    if (action.selectors) {
      // Extract specific selectors
      for (const [key, selector] of Object.entries(action.selectors)) {
        const elements = await this.page.$$(selector);
        const values = await Promise.all(
          elements.map(el => el.evaluate(node => node.textContent?.trim() || ''))
        );
        data[key] = values.length === 1 ? values[0] : values;
      }
    } else {
      // Extract all text content
      data = await this.page.evaluate(() => document.body.innerText);
    }

    return {
      success: true,
      data,
      url: this.page.url(),
      timestamp: Date.now(),
    };
  }

  /**
   * Fill form fields
   */
  private async fillForm(action: FillFormAction): Promise<BrowserResult> {
    if (!this.page) throw new Error('Browser not initialized');

    // Fill each field
    for (const [selector, value] of Object.entries(action.fields)) {
      await this.page.waitForSelector(selector, { timeout: 10000 });
      await this.page.type(selector, value, { delay: 50 });
    }

    // Submit if selector provided
    if (action.submitSelector) {
      await Promise.all([
        this.page.waitForNavigation({ timeout: 30000 }),
        this.page.click(action.submitSelector),
      ]);
    }

    return {
      success: true,
      url: this.page.url(),
      timestamp: Date.now(),
    };
  }

  /**
   * Wait for condition
   */
  private async wait(action: WaitAction): Promise<BrowserResult> {
    if (!this.page) throw new Error('Browser not initialized');

    switch (action.condition) {
      case 'selector':
        await this.page.waitForSelector(action.value as string, { timeout: 30000 });
        break;
      case 'timeout':
        await new Promise(resolve => setTimeout(resolve, action.value as number));
        break;
      case 'navigation':
        await this.page.waitForNavigation({ timeout: 30000 });
        break;
    }

    return {
      success: true,
      timestamp: Date.now(),
    };
  }

  /**
   * Scroll page
   */
  private async scroll(action: ScrollAction): Promise<BrowserResult> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.evaluate((direction, amount) => {
      switch (direction) {
        case 'up':
          window.scrollBy(0, -(amount || 500));
          break;
        case 'down':
          window.scrollBy(0, amount || 500);
          break;
        case 'top':
          window.scrollTo(0, 0);
          break;
        case 'bottom':
          window.scrollTo(0, document.body.scrollHeight);
          break;
      }
    }, action.direction, action.amount);

    return {
      success: true,
      timestamp: Date.now(),
    };
  }

  /**
   * Extract data from page
   */
  private async extract(action: ExtractAction): Promise<BrowserResult> {
    if (!this.page) throw new Error('Browser not initialized');

    let data: any;

    switch (action.dataType) {
      case 'text':
        data = await this.page.evaluate((sel) => {
          const element = sel ? document.querySelector(sel) : document.body;
          return element?.textContent?.trim() || '';
        }, action.selector);
        break;

      case 'links':
        data = await this.page.evaluate(() => {
          return Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.textContent?.trim(),
            href: a.href,
          }));
        });
        break;

      case 'images':
        data = await this.page.evaluate(() => {
          return Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
          }));
        });
        break;

      case 'table':
        data = await this.page.evaluate((sel) => {
          const table = sel ? document.querySelector(sel) : document.querySelector('table');
          if (!table) return null;
          
          const rows = Array.from(table.querySelectorAll('tr'));
          return rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            return cells.map(cell => cell.textContent?.trim() || '');
          });
        }, action.selector);
        break;
    }

    return {
      success: true,
      data,
      url: this.page.url(),
      timestamp: Date.now(),
    };
  }

  /**
   * Start a new browser session
   */
  async startSession(url: string, consentGiven: boolean = false): Promise<BrowserSession> {
    await this.initialize();

    this.currentSession = {
      id: `session-${Date.now()}`,
      url,
      startTime: Date.now(),
      actions: [],
      consentGiven,
    };

    if (url) {
      await this.executeAction({ type: 'navigate', url });
    }

    return this.currentSession;
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string | undefined {
    return this.page?.url();
  }

  /**
   * Get current session
   */
  getSession(): BrowserSession | null {
    return this.currentSession;
  }

  /**
   * Close browser and cleanup
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.currentSession = null;
  }
}
