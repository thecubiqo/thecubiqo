/**
 * WhatsApp Service - Messaging via WhatsApp Web
 * Uses browser automation for WhatsApp Web (no OAuth needed)
 */

import { BrowserService } from '../browser/browser-service';
import type { WhatsAppCommand, CommandResult } from './types';

export class WhatsAppService {
  private browser: BrowserService;
  private isAuthenticated = false;

  constructor(browser: BrowserService) {
    this.browser = browser;
  }

  /**
   * Execute WhatsApp command
   */
  async executeCommand(command: WhatsAppCommand): Promise<CommandResult> {
    try {
      // Initialize WhatsApp Web session
      if (!this.isAuthenticated) {
        const authResult = await this.initializeSession();
        if (!authResult.success) {
          return authResult;
        }
      }

      switch (command.action) {
        case 'send':
          return await this.sendMessage(command);
        case 'read':
          return await this.readMessages(command);
        default:
          return {
            success: false,
            error: `Unknown action: ${command.action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'WhatsApp operation failed',
      };
    }
  }

  /**
   * Initialize WhatsApp Web session
   */
  private async initializeSession(): Promise<CommandResult> {
    // Navigate to WhatsApp Web
    await this.browser.executeAction({
      type: 'navigate',
      url: 'https://web.whatsapp.com',
    });

    // Check if already logged in
    const mainResult = await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[data-testid="conversation-panel-wrapper"], canvas[aria-label="Scan this QR code"]',
    });

    if (!mainResult.success) {
      return {
        success: false,
        needsConsent: true,
        error: 'WhatsApp Web needs QR code scan. Please scan the QR code on your phone.',
      };
    }

    // Wait for WhatsApp to fully load
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 3000,
    });

    this.isAuthenticated = true;

    return {
      success: true,
      message: 'WhatsApp Web session initialized',
    };
  }

  /**
   * Send WhatsApp message
   */
  private async sendMessage(command: WhatsAppCommand): Promise<CommandResult> {
    const { contact, phone, message } = command;

    if (!message) {
      return {
        success: false,
        error: 'Message text required',
      };
    }

    if (!contact && !phone) {
      return {
        success: false,
        error: 'Contact name or phone number required',
      };
    }

    // If phone number provided, use direct link
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      await this.browser.executeAction({
        type: 'navigate',
        url: `https://web.whatsapp.com/send?phone=${cleanPhone}`,
      });
    } else {
      // Search for contact
      await this.browser.executeAction({
        type: 'click',
        selector: 'div[data-testid="search"]',
      });

      await this.browser.executeAction({
        type: 'type',
        selector: 'div[data-testid="chat-list-search"]',
        text: contact || '',
      });

      // Wait for search results
      await this.browser.executeAction({
        type: 'wait',
        condition: 'timeout',
        value: 1000,
      });

      // Click first result
      await this.browser.executeAction({
        type: 'click',
        selector: 'div[data-testid="cell-frame-container"]',
      });
    }

    // Wait for chat to open
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[data-testid="conversation-compose-box-input"]',
    });

    // Type message
    await this.browser.executeAction({
      type: 'type',
      selector: 'div[data-testid="conversation-compose-box-input"]',
      text: message,
    });

    // Send message
    await this.browser.executeAction({
      type: 'click',
      selector: 'button[data-testid="compose-btn-send"]',
    });

    return {
      success: true,
      message: `Message sent to ${contact || phone}`,
    };
  }

  /**
   * Read recent messages from a contact
   */
  private async readMessages(command: WhatsAppCommand): Promise<CommandResult> {
    const { contact, phone } = command;

    if (!contact && !phone) {
      return {
        success: false,
        error: 'Contact name or phone number required',
      };
    }

    // If phone number provided, use direct link
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      await this.browser.executeAction({
        type: 'navigate',
        url: `https://web.whatsapp.com/send?phone=${cleanPhone}`,
      });
    } else {
      // Search for contact
      await this.browser.executeAction({
        type: 'click',
        selector: 'div[data-testid="search"]',
      });

      await this.browser.executeAction({
        type: 'type',
        selector: 'div[data-testid="chat-list-search"]',
        text: contact || '',
      });

      await this.browser.executeAction({
        type: 'wait',
        condition: 'timeout',
        value: 1000,
      });

      // Click first result
      await this.browser.executeAction({
        type: 'click',
        selector: 'div[data-testid="cell-frame-container"]',
      });
    }

    // Wait for chat to open
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[data-testid="conversation-panel-body"]',
    });

    // Scrape recent messages
    const result = await this.browser.executeAction({
      type: 'scrape',
      selectors: {
        messages: 'div[data-testid="msg-container"] span.selectable-text',
      },
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to read messages',
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Messages retrieved',
    };
  }

  /**
   * Check if WhatsApp Web is authenticated
   */
  async checkAuth(): Promise<boolean> {
    return this.isAuthenticated;
  }
}
