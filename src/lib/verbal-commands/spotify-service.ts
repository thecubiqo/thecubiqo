import { BaseService } from './base-service';
import type { CommandResult } from './types';

/**
 * SpotifyService - Handle Spotify verbal commands
 */
export class SpotifyService extends BaseService {
    constructor(browser: any) {
        super(browser, 'Spotify');
    }

    async executeCommand(params: {
        action: 'play' | 'pause' | 'skip' | 'search';
        query?: string;
    }): Promise<CommandResult> {
        switch (params.action) {
            case 'play':
                return this.play(params.query);
            case 'pause':
                return { success: true, message: 'Spotify paused' }; // Mock
            case 'skip':
                return { success: true, message: 'Skipped track' }; // Mock
            default:
                return { success: false, error: `Invalid Spotify action: ${params.action}` };
        }
    }

    private async play(query?: string): Promise<CommandResult> {
        const url = query ? `https://open.spotify.com/search/${encodeURIComponent(query)}` : `https://open.spotify.com/`;
        return this.browserAction(url, async (page) => {
            // Play logic
        });
    }
}
