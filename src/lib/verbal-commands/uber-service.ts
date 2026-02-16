/**
 * Uber Service - Ride booking via browser automation
 * Uses browser automation for Uber Web
 */

import { BrowserService } from '../browser/browser-service';
import type { UberCommand, CommandResult } from './types';

export class UberService {
  private browser: BrowserService;
  private isAuthenticated = false;

  constructor(browser: BrowserService) {
    this.browser = browser;
  }

  /**
   * Execute Uber command
   */
  async executeCommand(command: UberCommand): Promise<CommandResult> {
    try {
      // Initialize Uber session
      if (!this.isAuthenticated) {
        const authResult = await this.initializeSession();
        if (!authResult.success) {
          return authResult;
        }
      }

      switch (command.action) {
        case 'request':
          return await this.requestRide(command);
        case 'estimate':
          return await this.getEstimate(command);
        case 'status':
          return await this.checkStatus();
        default:
          return {
            success: false,
            error: `Unknown action: ${command.action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Uber operation failed',
      };
    }
  }

  /**
   * Initialize Uber session
   */
  private async initializeSession(): Promise<CommandResult> {
    // Navigate to Uber
    await this.browser.executeAction({
      type: 'navigate',
      url: 'https://m.uber.com',
    });

    // Wait for page to load
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 3000,
    });

    // Check if logged in by looking for ride request elements
    const result = await this.browser.executeAction({
      type: 'scrape',
      waitForSelector: 'input[placeholder*="pickup"], input[name="email"]',
    });

    if (!result.success) {
      return {
        success: false,
        needsAuth: true,
        error: 'Uber login required. Please log in to Uber first.',
      };
    }

    this.isAuthenticated = true;

    return {
      success: true,
      message: 'Uber session initialized',
    };
  }

  /**
   * Request a ride
   */
  private async requestRide(command: UberCommand): Promise<CommandResult> {
    const { pickup, destination, rideType } = command;

    if (!pickup || !destination) {
      return {
        success: false,
        error: 'Pickup and destination required',
      };
    }

    // Navigate to ride request
    await this.browser.executeAction({
      type: 'navigate',
      url: 'https://m.uber.com/looking',
    });

    // Wait for pickup input
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'input[placeholder*="pickup"]',
    });

    // Enter pickup location
    await this.browser.executeAction({
      type: 'type',
      selector: 'input[placeholder*="pickup"]',
      text: pickup,
    });

    // Wait for autocomplete
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 1000,
    });

    // Click first suggestion
    await this.browser.executeAction({
      type: 'click',
      selector: 'li[role="option"]',
    });

    // Enter destination
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'input[placeholder*="destination"]',
    });

    await this.browser.executeAction({
      type: 'type',
      selector: 'input[placeholder*="destination"]',
      text: destination,
    });

    // Wait for autocomplete
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 1000,
    });

    // Click first suggestion
    await this.browser.executeAction({
      type: 'click',
      selector: 'li[role="option"]',
    });

    // Wait for ride options to load
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 3000,
    });

    // Select ride type if specified
    if (rideType) {
      const rideTypeMap: Record<string, string> = {
        pool: 'Pool',
        x: 'UberX',
        xl: 'UberXL',
        black: 'Black',
      };

      const rideTypeName = rideTypeMap[rideType] || 'UberX';

      await this.browser.executeAction({
        type: 'click',
        selector: `button[aria-label*="${rideTypeName}"]`,
      });
    }

    // This is where we STOP - don't actually request the ride
    // Instead, return the estimate
    const result = await this.browser.executeAction({
      type: 'scrape',
      selectors: {
        price: 'div[data-testid="price-estimate"]',
        eta: 'div[data-testid="pickup-eta"]',
      },
    });

    return {
      success: true,
      needsConsent: true,
      data: result.data,
      message: `Ride prepared: ${pickup} → ${destination}. Ready to confirm?`,
    };
  }

  /**
   * Get ride estimate
   */
  private async getEstimate(command: UberCommand): Promise<CommandResult> {
    const { pickup, destination } = command;

    if (!pickup || !destination) {
      return {
        success: false,
        error: 'Pickup and destination required',
      };
    }

    // Use the same flow as requestRide but stop at estimate
    return await this.requestRide({
      ...command,
      action: 'request', // Reuse request logic but don't confirm
    });
  }

  /**
   * Check current ride status
   */
  private async checkStatus(): Promise<CommandResult> {
    // Navigate to current ride
    await this.browser.executeAction({
      type: 'navigate',
      url: 'https://m.uber.com/current',
    });

    // Wait for page to load
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 2000,
    });

    // Scrape ride status
    const result = await this.browser.executeAction({
      type: 'scrape',
      selectors: {
        status: 'div[data-testid="ride-status"]',
        driverName: 'div[data-testid="driver-name"]',
        eta: 'div[data-testid="eta"]',
      },
    });

    if (!result.success) {
      return {
        success: false,
        error: 'No active ride found',
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Current ride status retrieved',
    };
  }

  /**
   * Check if Uber is authenticated
   */
  async checkAuth(): Promise<boolean> {
    return this.isAuthenticated;
  }
}
