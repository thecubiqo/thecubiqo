/**
 * Command Parser - Converts natural language to browser actions
 * Integrates with AI system for verbal command interpretation
 */

import type { BrowserAction } from './types';

export class BrowserCommandParser {
  /**
   * Parse natural language command into browser actions
   */
  static parseCommand(command: string): BrowserAction[] {
    const lowerCommand = command.toLowerCase().trim();
    const actions: BrowserAction[] = [];

    // Navigation patterns
    if (this.isNavigationCommand(lowerCommand)) {
      const url = this.extractUrl(lowerCommand);
      if (url) {
        actions.push({
          type: 'navigate',
          url,
          waitUntil: 'networkidle2',
        });
      }
    }

    // Click patterns
    if (this.isClickCommand(lowerCommand)) {
      const selector = this.inferSelector(lowerCommand);
      if (selector) {
        actions.push({
          type: 'click',
          selector,
        });
      }
    }

    // Form filling patterns
    if (this.isFormCommand(lowerCommand)) {
      const formData = this.extractFormData(lowerCommand);
      if (formData) {
        actions.push({
          type: 'fill-form',
          fields: formData.fields,
          submitSelector: formData.submitSelector,
          requiresConsent: true,
          description: 'Fill and submit form',
        });
      }
    }

    // Screenshot patterns
    if (this.isScreenshotCommand(lowerCommand)) {
      actions.push({
        type: 'screenshot',
        fullPage: lowerCommand.includes('full') || lowerCommand.includes('entire'),
      });
    }

    // Scraping patterns
    if (this.isScrapeCommand(lowerCommand)) {
      actions.push({
        type: 'scrape',
        description: 'Extract page content',
      });
    }

    // Scroll patterns
    if (this.isScrollCommand(lowerCommand)) {
      const direction = this.extractScrollDirection(lowerCommand);
      actions.push({
        type: 'scroll',
        direction,
      });
    }

    return actions;
  }

  /**
   * Parse command with AI assistance
   * This method should be called with the AI model's interpretation
   */
  static async parseWithAI(
    userCommand: string,
    aiInterpretation: {
      intent: string;
      parameters: Record<string, any>;
      requiresConfirmation?: boolean;
    }
  ): Promise<BrowserAction[]> {
    const actions: BrowserAction[] = [];
    const { intent, parameters } = aiInterpretation;

    switch (intent) {
      case 'navigate':
        actions.push({
          type: 'navigate',
          url: parameters.url,
          waitUntil: parameters.waitUntil || 'networkidle2',
        });
        break;

      case 'login':
        // Handle login flow
        if (parameters.username && parameters.password) {
          actions.push({
            type: 'fill-form',
            fields: {
              [parameters.usernameSelector || 'input[name="username"]']: parameters.username,
              [parameters.passwordSelector || 'input[name="password"]']: parameters.password,
            },
            submitSelector: parameters.submitSelector || 'button[type="submit"]',
            requiresConsent: true,
            description: `Login to ${parameters.domain}`,
          });
        }
        break;

      case 'search':
        actions.push(
          {
            type: 'navigate',
            url: parameters.searchEngine || 'https://www.google.com',
          },
          {
            type: 'type',
            selector: parameters.searchSelector || 'input[name="q"]',
            text: parameters.query,
          },
          {
            type: 'click',
            selector: parameters.submitSelector || 'button[type="submit"]',
            waitForNavigation: true,
          }
        );
        break;

      case 'fill-form':
        actions.push({
          type: 'fill-form',
          fields: parameters.fields,
          submitSelector: parameters.submit ? parameters.submitSelector : undefined,
          requiresConsent: true,
          description: parameters.description || 'Fill form',
        });
        break;

      case 'click':
        actions.push({
          type: 'click',
          selector: parameters.selector,
          waitForNavigation: parameters.waitForNavigation || false,
        });
        break;

      case 'screenshot':
        actions.push({
          type: 'screenshot',
          fullPage: parameters.fullPage || false,
          selector: parameters.selector,
        });
        break;

      case 'scrape':
        actions.push({
          type: 'scrape',
          selectors: parameters.selectors,
          waitForSelector: parameters.waitForSelector,
        });
        break;

      case 'extract':
        actions.push({
          type: 'extract',
          dataType: parameters.dataType || 'text',
          selector: parameters.selector,
        });
        break;

      case 'post-social':
        // Handle social media posting
        actions.push({
          type: 'fill-form',
          fields: parameters.fields,
          submitSelector: parameters.postButton,
          requiresConsent: true,
          description: `Post to ${parameters.platform}`,
        });
        break;

      case 'send-email':
        // Handle email composition
        actions.push({
          type: 'fill-form',
          fields: {
            [parameters.toSelector || 'input[name="to"]']: parameters.to,
            [parameters.subjectSelector || 'input[name="subject"]']: parameters.subject,
            [parameters.bodySelector || 'textarea[name="body"]']: parameters.body,
          },
          submitSelector: parameters.sendButton,
          requiresConsent: true,
          description: 'Send email',
        });
        break;

      case 'book-appointment':
        // Handle booking flows
        actions.push({
          type: 'fill-form',
          fields: parameters.fields,
          submitSelector: parameters.submitSelector,
          requiresConsent: true,
          description: `Book appointment at ${parameters.service}`,
        });
        break;
    }

    return actions;
  }

  // Helper methods for pattern matching

  private static isNavigationCommand(cmd: string): boolean {
    return /\b(go to|navigate to|open|visit)\b/.test(cmd) || /https?:\/\//.test(cmd);
  }

  private static isClickCommand(cmd: string): boolean {
    return /\b(click|press|tap|select)\b/.test(cmd);
  }

  private static isFormCommand(cmd: string): boolean {
    return /\b(fill|enter|type|submit|form)\b/.test(cmd);
  }

  private static isScreenshotCommand(cmd: string): boolean {
    return /\b(screenshot|capture|snap|picture)\b/.test(cmd);
  }

  private static isScrapeCommand(cmd: string): boolean {
    return /\b(scrape|extract|get|fetch|grab)\b/.test(cmd);
  }

  private static isScrollCommand(cmd: string): boolean {
    return /\b(scroll|page)\b/.test(cmd);
  }

  private static extractUrl(cmd: string): string | null {
    const urlMatch = cmd.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) return urlMatch[1];

    // Try to infer common domains
    if (cmd.includes('gmail')) return 'https://mail.google.com';
    if (cmd.includes('twitter')) return 'https://twitter.com';
    if (cmd.includes('facebook')) return 'https://facebook.com';
    if (cmd.includes('linkedin')) return 'https://linkedin.com';

    return null;
  }

  private static inferSelector(cmd: string): string | null {
    // Try to extract button/link text
    const buttonMatch = cmd.match(/(?:button|link)(?:\s+(?:labeled|saying|with))?\s+["']([^"']+)["']/);
    if (buttonMatch) {
      return `button:contains("${buttonMatch[1]}"), a:contains("${buttonMatch[1]}")`;
    }

    // Common button types
    if (cmd.includes('submit')) return 'button[type="submit"]';
    if (cmd.includes('login')) return 'button:contains("Login"), button:contains("Sign in")';
    if (cmd.includes('sign up')) return 'button:contains("Sign up"), button:contains("Register")';

    return null;
  }

  private static extractFormData(cmd: string): { fields: Record<string, string>; submitSelector?: string } | null {
    // This is a simplified version - in production, this would use AI parsing
    const fields: Record<string, string> = {};
    
    // Example pattern matching (would be replaced with AI interpretation)
    const emailMatch = cmd.match(/email[:\s]+([^\s,]+)/);
    if (emailMatch) fields['input[type="email"]'] = emailMatch[1];

    const passwordMatch = cmd.match(/password[:\s]+([^\s,]+)/);
    if (passwordMatch) fields['input[type="password"]'] = passwordMatch[1];

    if (Object.keys(fields).length === 0) return null;

    return {
      fields,
      submitSelector: cmd.includes('submit') ? 'button[type="submit"]' : undefined,
    };
  }

  private static extractScrollDirection(cmd: string): 'up' | 'down' | 'top' | 'bottom' {
    if (cmd.includes('up')) return 'up';
    if (cmd.includes('down')) return 'down';
    if (cmd.includes('top')) return 'top';
    if (cmd.includes('bottom')) return 'bottom';
    return 'down'; // default
  }

  /**
   * Generate AI prompt for command interpretation
   */
  static generateAIPrompt(userCommand: string, currentUrl?: string): string {
    return `You are helping interpret a browser automation command. The user said: "${userCommand}"
${currentUrl ? `Current page: ${currentUrl}` : ''}

Please analyze this command and respond with a JSON object containing:
{
  "intent": "navigate|login|search|fill-form|click|screenshot|scrape|extract|post-social|send-email|book-appointment",
  "parameters": {
    // Intent-specific parameters
  },
  "requiresConfirmation": boolean, // true if this action modifies data or posts publicly
  "description": "Human-readable description of what will be done"
}

Examples:
- "Go to Gmail" → {"intent": "navigate", "parameters": {"url": "https://mail.google.com"}}
- "Take a screenshot" → {"intent": "screenshot", "parameters": {"fullPage": false}}
- "Post to Twitter: Hello world" → {"intent": "post-social", "parameters": {"platform": "twitter", "text": "Hello world"}, "requiresConfirmation": true}

Respond only with the JSON object.`;
  }
}
