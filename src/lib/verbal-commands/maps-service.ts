/**
 * Google Maps Service - Search and directions
 * Uses browser automation for Google Maps
 */

import { BrowserService } from '../browser/browser-service';
import type { MapsCommand, Location, CommandResult } from './types';

export class MapsService {
  private browser: BrowserService;

  constructor(browser: BrowserService) {
    this.browser = browser;
  }

  /**
   * Execute Maps command
   */
  async executeCommand(command: MapsCommand): Promise<CommandResult> {
    try {
      switch (command.action) {
        case 'search':
          return await this.searchLocation(command);
        case 'directions':
          return await this.getDirections(command);
        case 'nearby':
          return await this.searchNearby(command);
        default:
          return {
            success: false,
            error: `Unknown action: ${command.action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Maps operation failed',
      };
    }
  }

  /**
   * Search for a location
   */
  private async searchLocation(command: MapsCommand): Promise<CommandResult> {
    const { query } = command;

    if (!query) {
      return {
        success: false,
        error: 'Search query required',
      };
    }

    // Navigate to Google Maps with search query
    await this.browser.executeAction({
      type: 'navigate',
      url: `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
    });

    // Wait for results to load
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[role="main"]',
    });

    // Wait for place details
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 2000,
    });

    // Scrape location details
    const result = await this.browser.executeAction({
      type: 'scrape',
      selectors: {
        name: 'h1.DUwDvf',
        address: 'button[data-item-id="address"] div.Io6YTe',
        rating: 'span.ceNzKf[aria-label]',
      },
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to find location',
      };
    }

    const location: Location = {
      name: result.data.name || query,
      address: result.data.address || 'Address not available',
      rating: result.data.rating ? parseFloat(result.data.rating) : undefined,
    };

    return {
      success: true,
      data: location,
      message: `Found: ${location.name}`,
    };
  }

  /**
   * Get directions between two points
   */
  private async getDirections(command: MapsCommand): Promise<CommandResult> {
    const { origin, destination } = command;

    if (!origin || !destination) {
      return {
        success: false,
        error: 'Origin and destination required',
      };
    }

    // Navigate to directions
    await this.browser.executeAction({
      type: 'navigate',
      url: `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`,
    });

    // Wait for directions to load
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[role="main"]',
    });

    // Wait for route calculation
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 3000,
    });

    // Scrape directions info
    const result = await this.browser.executeAction({
      type: 'scrape',
      selectors: {
        duration: 'div.Fk3sm span.delay',
        distance: 'div.Fk3sm div.ivN21e',
        route: 'div.XdKEzd',
      },
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to get directions',
      };
    }

    return {
      success: true,
      data: {
        origin,
        destination,
        duration: result.data.duration,
        distance: result.data.distance,
        route: result.data.route,
      },
      message: `Directions from ${origin} to ${destination}`,
    };
  }

  /**
   * Search for nearby places of a category
   */
  private async searchNearby(command: MapsCommand): Promise<CommandResult> {
    const { category, query } = command;

    if (!category && !query) {
      return {
        success: false,
        error: 'Category or query required',
      };
    }

    const searchTerm = query || `${category} near me`;

    // Navigate to search
    await this.browser.executeAction({
      type: 'navigate',
      url: `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`,
    });

    // Wait for results
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[role="feed"]',
    });

    // Wait for places to load
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 2000,
    });

    // Scrape nearby places
    const result = await this.browser.executeAction({
      type: 'scrape',
      selectors: {
        names: 'div[role="feed"] a.hfpxzc',
        addresses: 'div[role="feed"] div.W4Efsd span:nth-child(2)',
        ratings: 'div[role="feed"] span.MW4etd',
      },
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to find nearby places',
      };
    }

    // Parse results into locations
    const names = Array.isArray(result.data.names) ? result.data.names : [result.data.names];
    const addresses = Array.isArray(result.data.addresses) ? result.data.addresses : [result.data.addresses];
    const ratings = Array.isArray(result.data.ratings) ? result.data.ratings : [result.data.ratings];

    const locations: Location[] = names.map((name: string, i: number) => ({
      name: name || 'Unknown',
      address: addresses[i] || 'Address not available',
      rating: ratings[i] ? parseFloat(ratings[i]) : undefined,
    }));

    return {
      success: true,
      data: locations,
      message: `Found ${locations.length} nearby places`,
    };
  }
}
