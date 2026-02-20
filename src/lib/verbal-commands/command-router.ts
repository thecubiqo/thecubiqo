/**
 * Command Router - Routes verbal commands to appropriate services
 * Integrates with AI to parse natural language commands
 */

import { BrowserService } from '../browser/browser-service';
import { GmailService } from './gmail-service';
import { TwitterService } from './twitter-service';
import { MapsService } from './maps-service';
import { UberService } from './uber-service';
import { WhatsAppService } from './whatsapp-service';
import type { CommandIntent, CommandResult, OAuthTokens } from './types';

export class CommandRouter {
  private browser: BrowserService;
  private gmail: GmailService;
  private twitter: TwitterService;
  private maps: MapsService;
  private uber: UberService;
  private whatsapp: WhatsAppService;

  constructor() {
    this.browser = new BrowserService();
    this.gmail = new GmailService(this.browser);
    this.twitter = new TwitterService(this.browser);
    this.maps = new MapsService(this.browser);
    this.uber = new UberService(this.browser);
    this.whatsapp = new WhatsAppService(this.browser);
  }

  /**
   * Parse natural language command into intent
   * Uses AI to understand user's request
   */
  async parseCommand(userInput: string, aiModel: any): Promise<CommandIntent | null> {
    const prompt = this.buildParsingPrompt(userInput);

    try {
      // Call AI to parse the command
      const response = await aiModel.generateText({
        prompt,
        temperature: 0.3,
      });

      // Parse AI response as JSON
      const intent = JSON.parse(response);
      return intent;
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Execute a command intent
   */
  async executeCommand(intent: CommandIntent, tokens?: Record<string, OAuthTokens>): Promise<CommandResult> {
    try {
      // Set OAuth tokens if available
      if (tokens) {
        if (tokens.gmail) this.gmail.setTokens(tokens.gmail);
        if (tokens.twitter) this.twitter.setTokens(tokens.twitter);
      }

      // Route to appropriate service
      switch (intent.type) {
        case 'email':
          return await this.gmail.executeCommand(intent.parameters as any);

        case 'twitter':
          return await this.twitter.executeCommand(intent.parameters as any);

        case 'maps':
          return await this.maps.executeCommand(intent.parameters as any);

        case 'uber':
          return await this.uber.executeCommand(intent.parameters as any);

        case 'whatsapp':
          return await this.whatsapp.executeCommand(intent.parameters as any);

        default:
          return {
            success: false,
            error: `Unknown command type: ${intent.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command execution failed',
      };
    }
  }

  /**
   * Build AI prompt for command parsing
   */
  private buildParsingPrompt(userInput: string): string {
    return `You are a command parser for a personal AI assistant. Parse the following user request into a structured command.

User request: "${userInput}"

Analyze this request and respond with a JSON object following this structure:

{
  "type": "email" | "twitter" | "maps" | "uber" | "whatsapp",
  "action": "specific action for the service",
  "parameters": {
    // Service-specific parameters
  },
  "requiresAuth": boolean,
  "requiresConfirmation": boolean,
  "description": "human-readable description"
}

Service-specific formats:

**Email (Gmail):**
{
  "type": "email",
  "action": "send" | "read" | "search",
  "parameters": {
    "to": "recipient@example.com",
    "subject": "subject line",
    "body": "email body",
    "query": "search query",
    "maxResults": 10
  }
}

**Twitter:**
{
  "type": "twitter",
  "action": "post" | "read" | "reply",
  "parameters": {
    "text": "tweet content",
    "tweetId": "id to reply to",
    "media": ["url1", "url2"]
  }
}

**Maps:**
{
  "type": "maps",
  "action": "search" | "directions" | "nearby",
  "parameters": {
    "query": "search term",
    "origin": "starting point",
    "destination": "ending point",
    "category": "restaurants, cafes, etc"
  }
}

**Uber:**
{
  "type": "uber",
  "action": "request" | "estimate" | "status",
  "parameters": {
    "pickup": "pickup address",
    "destination": "destination address",
    "rideType": "pool" | "x" | "xl" | "black"
  },
  "requiresConfirmation": true
}

**WhatsApp:**
{
  "type": "whatsapp",
  "action": "send" | "read",
  "parameters": {
    "contact": "contact name",
    "phone": "+1234567890",
    "message": "message text"
  }
}

Examples:

User: "Send an email to john@example.com saying I'll be late"
{
  "type": "email",
  "action": "send",
  "parameters": {
    "to": "john@example.com",
    "subject": "Running late",
    "body": "Hi, I'll be late. Sorry!"
  },
  "requiresAuth": true,
  "requiresConfirmation": true,
  "description": "Send email to john@example.com"
}

User: "Tweet 'Having a great day!'"
{
  "type": "twitter",
  "action": "post",
  "parameters": {
    "text": "Having a great day!"
  },
  "requiresAuth": true,
  "requiresConfirmation": true,
  "description": "Post tweet"
}

User: "Find coffee shops near me"
{
  "type": "maps",
  "action": "nearby",
  "parameters": {
    "category": "coffee shops"
  },
  "requiresAuth": false,
  "requiresConfirmation": false,
  "description": "Search for nearby coffee shops"
}

User: "Get an Uber from home to the airport"
{
  "type": "uber",
  "action": "request",
  "parameters": {
    "pickup": "home",
    "destination": "airport",
    "rideType": "x"
  },
  "requiresAuth": true,
  "requiresConfirmation": true,
  "description": "Request Uber from home to airport"
}

User: "Send a WhatsApp to Mom saying I'm on my way"
{
  "type": "whatsapp",
  "action": "send",
  "parameters": {
    "contact": "Mom",
    "message": "I'm on my way"
  },
  "requiresAuth": false,
  "requiresConfirmation": true,
  "description": "Send WhatsApp to Mom"
}

Respond ONLY with the JSON object, no other text.`;
  }

  /**
   * Check authentication status for all services
   */
  async checkAuthStatus(): Promise<Record<string, boolean>> {
    return {
      gmail: await this.gmail.checkAuth(),
      twitter: await this.twitter.checkAuth(),
      maps: true, // Maps doesn't need auth
      uber: await this.uber.checkAuth(),
      whatsapp: await this.whatsapp.checkAuth(),
    };
  }

  /**
   * Get OAuth URLs for services that need authentication
   */
  getAuthUrls(): Record<string, string> {
    return {
      gmail: GmailService.getAuthUrl(),
      twitter: TwitterService.getAuthUrl(),
    };
  }

  /**
   * Clean up browser resources
   */
  async cleanup(): Promise<void> {
    await this.browser.close();
  }
}

/**
 * Singleton instance for global access
 */
let routerInstance: CommandRouter | null = null;

export function getCommandRouter(): CommandRouter {
  if (!routerInstance) {
    routerInstance = new CommandRouter();
  }
  return routerInstance;
}

/**
 * Helper function to execute a natural language command
 */
export async function executeVerbalCommand(
  userInput: string,
  aiModel: any,
  tokens?: Record<string, OAuthTokens>
): Promise<CommandResult> {
  const router = getCommandRouter();

  // Parse command
  const intent = await router.parseCommand(userInput, aiModel);

  if (!intent) {
    return {
      success: false,
      error: 'Could not understand command',
    };
  }

  // Check if confirmation is needed
  if (intent.requiresConfirmation) {
    return {
      success: false,
      needsConsent: true,
      message: `About to: ${intent.description}. Confirm?`,
      data: intent,
    };
  }

  // Execute command
  return await router.executeCommand(intent, tokens);
}
