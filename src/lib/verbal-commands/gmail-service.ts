/**
 * Gmail Service - Email operations via OAuth + Browser
 * Uses Gmail OAuth for authentication, browser automation for actions
 */

import { BrowserService } from '../browser/browser-service';
import type { EmailCommand, Email, CommandResult, OAuthTokens } from './types';

export class GmailService {
  private browser: BrowserService;
  private tokens: OAuthTokens | null = null;

  constructor(browser: BrowserService) {
    this.browser = browser;
  }

  /**
   * Initialize with OAuth tokens
   */
  setTokens(tokens: OAuthTokens) {
    this.tokens = tokens;
  }

  /**
   * Execute email command
   */
  async executeCommand(command: EmailCommand): Promise<CommandResult> {
    if (!this.tokens) {
      return {
        success: false,
        needsAuth: true,
        error: 'Gmail OAuth required',
      };
    }

    try {
      switch (command.action) {
        case 'send':
          return await this.sendEmail(command);
        case 'read':
          return await this.readEmails(command);
        case 'search':
          return await this.searchEmails(command);
        default:
          return {
            success: false,
            error: `Unknown action: ${command.action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gmail operation failed',
      };
    }
  }

  /**
   * Send email via Gmail
   */
  private async sendEmail(command: EmailCommand): Promise<CommandResult> {
    const { to, subject, body } = command;

    if (!to || !subject || !body) {
      return {
        success: false,
        error: 'Missing required fields: to, subject, body',
      };
    }

    // Navigate to Gmail
    await this.browser.executeAction({
      type: 'navigate',
      url: 'https://mail.google.com',
    });

    // Wait for Gmail to load
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[role="main"]',
    });

    // Click compose button
    await this.browser.executeAction({
      type: 'click',
      selector: 'div[role="button"][gh="cm"]',
    });

    // Fill in recipients
    await this.browser.executeAction({
      type: 'type',
      selector: 'input[aria-label*="To"]',
      text: to,
    });

    // Fill in subject
    await this.browser.executeAction({
      type: 'type',
      selector: 'input[name="subjectbox"]',
      text: subject,
    });

    // Fill in body
    await this.browser.executeAction({
      type: 'type',
      selector: 'div[aria-label*="Message Body"]',
      text: body,
    });

    // Click send button
    await this.browser.executeAction({
      type: 'click',
      selector: 'div[role="button"][aria-label*="Send"]',
    });

    return {
      success: true,
      message: `Email sent to ${to}`,
    };
  }

  /**
   * Read recent emails
   */
  private async readEmails(command: EmailCommand): Promise<CommandResult> {
    const maxResults = command.maxResults || 10;

    // Navigate to Gmail
    await this.browser.executeAction({
      type: 'navigate',
      url: 'https://mail.google.com',
    });

    // Wait for inbox to load
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'table[role="grid"]',
    });

    // Scrape email list
    const result = await this.browser.executeAction({
      type: 'scrape',
      selectors: {
        subjects: 'span[data-thread-id] span.bog',
        senders: 'span[data-thread-id] span[email]',
        snippets: 'span[data-thread-id] .y2',
      },
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to read emails',
      };
    }

    // Parse email data
    const emails: Email[] = [];
    const subjects = Array.isArray(result.data.subjects) ? result.data.subjects : [result.data.subjects];
    const senders = Array.isArray(result.data.senders) ? result.data.senders : [result.data.senders];
    const snippets = Array.isArray(result.data.snippets) ? result.data.snippets : [result.data.snippets];

    for (let i = 0; i < Math.min(maxResults, subjects.length); i++) {
      emails.push({
        id: `email-${i}`,
        from: senders[i] || 'Unknown',
        subject: subjects[i] || 'No subject',
        snippet: snippets[i] || '',
        date: new Date().toISOString(),
        unread: false,
      });
    }

    return {
      success: true,
      data: emails,
      message: `Found ${emails.length} emails`,
    };
  }

  /**
   * Search emails
   */
  private async searchEmails(command: EmailCommand): Promise<CommandResult> {
    const { query } = command;

    if (!query) {
      return {
        success: false,
        error: 'Search query required',
      };
    }

    // Navigate to Gmail with search query
    await this.browser.executeAction({
      type: 'navigate',
      url: `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`,
    });

    // Wait for results
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'table[role="grid"]',
    });

    // Use readEmails logic to extract results
    return await this.readEmails(command);
  }

  /**
   * Check if user is authenticated with Gmail
   */
  async checkAuth(): Promise<boolean> {
    if (!this.tokens) return false;

    // Check if token is expired
    if (this.tokens.expires_at && this.tokens.expires_at < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Get OAuth authorization URL
   */
  static getAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/gmail/callback`;
    
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
    ].join(' ');

    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`;
  }
}
