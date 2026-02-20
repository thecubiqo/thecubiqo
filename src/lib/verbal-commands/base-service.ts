import { BrowserService } from '../browser/browser-service';
import type { OAuthTokens, CommandResult } from './types';

/**
 * BaseService - Shared logic for all verbal command services
 */
export abstract class BaseService {
    protected browser: BrowserService;
    protected tokens: OAuthTokens | null = null;
    protected serviceName: string;

    constructor(browser: BrowserService, serviceName: string) {
        this.browser = browser;
        this.serviceName = serviceName;
    }

    setTokens(tokens: OAuthTokens): void {
        this.tokens = tokens;
    }

    async checkAuth(): Promise<boolean> {
        return !!this.tokens && !!this.tokens.access_token;
    }

    /**
     * Execute a command with appropriate fallback to browser automation
     */
    abstract executeCommand(params: any): Promise<CommandResult>;

    /**
     * Common browser-based fallback for authenticated actions
     */
    protected async browserAction(url: string, action: (page: any) => Promise<void>): Promise<CommandResult> {
        try {
            await this.browser.initialize();
            // Since BrowserService doesn't expose the page easily, 
            // we use executeAction for navigation and base automation.
            await this.browser.executeAction({ type: 'navigate', url });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: `${this.serviceName} browser action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
}
