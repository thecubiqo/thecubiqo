/**
 * Twitter Service - Post and read via OAuth + Browser
 * Uses Twitter OAuth for authentication, browser automation for actions
 */

import { BrowserService } from '../browser/browser-service';
import type { TwitterCommand, CommandResult, OAuthTokens } from './types';

export class TwitterService {
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
   * Execute Twitter command
   */
  async executeCommand(command: TwitterCommand): Promise<CommandResult> {
    if (!this.tokens) {
      return {
        success: false,
        needsAuth: true,
        error: 'Twitter OAuth required',
      };
    }

    try {
      switch (command.action) {
        case 'post':
          return await this.postTweet(command);
        case 'read':
          return await this.readTimeline();
        case 'reply':
          return await this.replyToTweet(command);
        default:
          return {
            success: false,
            error: `Unknown action: ${command.action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twitter operation failed',
      };
    }
  }

  /**
   * Post a tweet
   */
  private async postTweet(command: TwitterCommand): Promise<CommandResult> {
    const { text, media } = command;

    if (!text) {
      return {
        success: false,
        error: 'Tweet text required',
      };
    }

    // Navigate to Twitter
    await this.browser.executeAction({
      type: 'navigate',
      url: 'https://twitter.com/compose/tweet',
    });

    // Wait for compose box
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[role="textbox"][data-testid="tweetTextarea_0"]',
    });

    // Type tweet text
    await this.browser.executeAction({
      type: 'type',
      selector: 'div[role="textbox"][data-testid="tweetTextarea_0"]',
      text: text,
    });

    // TODO: Handle media uploads if provided
    if (media && media.length > 0) {
      console.log('Media upload not yet implemented:', media);
    }

    // Click tweet button
    await this.browser.executeAction({
      type: 'click',
      selector: 'div[data-testid="tweetButtonInline"]',
    });

    // Wait for tweet to be posted
    await this.browser.executeAction({
      type: 'wait',
      condition: 'timeout',
      value: 2000,
    });

    return {
      success: true,
      message: 'Tweet posted successfully',
    };
  }

  /**
   * Read timeline
   */
  private async readTimeline(): Promise<CommandResult> {
    // Navigate to home timeline
    await this.browser.executeAction({
      type: 'navigate',
      url: 'https://twitter.com/home',
    });

    // Wait for timeline
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[data-testid="primaryColumn"]',
    });

    // Scrape recent tweets
    const result = await this.browser.executeAction({
      type: 'scrape',
      selectors: {
        tweets: 'article[data-testid="tweet"]',
      },
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to read timeline',
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Timeline fetched',
    };
  }

  /**
   * Reply to a tweet
   */
  private async replyToTweet(command: TwitterCommand): Promise<CommandResult> {
    const { tweetId, text } = command;

    if (!tweetId || !text) {
      return {
        success: false,
        error: 'Tweet ID and reply text required',
      };
    }

    // Navigate to tweet
    await this.browser.executeAction({
      type: 'navigate',
      url: `https://twitter.com/i/web/status/${tweetId}`,
    });

    // Click reply button
    await this.browser.executeAction({
      type: 'click',
      selector: 'div[data-testid="reply"]',
    });

    // Wait for reply box
    await this.browser.executeAction({
      type: 'wait',
      condition: 'selector',
      value: 'div[role="textbox"][data-testid="tweetTextarea_0"]',
    });

    // Type reply
    await this.browser.executeAction({
      type: 'type',
      selector: 'div[role="textbox"][data-testid="tweetTextarea_0"]',
      text: text,
    });

    // Click reply button
    await this.browser.executeAction({
      type: 'click',
      selector: 'div[data-testid="tweetButtonInline"]',
    });

    return {
      success: true,
      message: 'Reply posted successfully',
    };
  }

  /**
   * Check if user is authenticated with Twitter
   */
  async checkAuth(): Promise<boolean> {
    if (!this.tokens) return false;

    if (this.tokens.expires_at && this.tokens.expires_at < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Get OAuth authorization URL
   */
  static getAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/twitter/callback`;
    
    const scopes = ['tweet.read', 'tweet.write', 'users.read'].join(' ');

    return `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${Math.random().toString(36)}&` +
      `code_challenge=challenge&` +
      `code_challenge_method=plain`;
  }
}
