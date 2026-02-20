/**
 * Browser Consent Manager
 * 
 * Handles user consent for browser automation actions:
 * - Request consent before sensitive actions
 * - Check for remembered consent decisions
 * - Log all consent decisions to database
 * - Domain-based consent tracking
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Day 6: Consent Manager
 */

import { createClient } from '@/lib/supabase/server';

export interface ConsentRequest {
  sessionId: string;
  userId: string;
  domain: string;
  url: string;
  actionDescription: string;
  screenshot?: string; // Base64 or URL
  requiresApproval?: boolean;
}

export interface ConsentResponse {
  approved: boolean;
  remember: boolean;
  reason?: string;
  respondedAt: number;
}

export interface ConsentDecision {
  requestId: string;
  approved: boolean;
  remember: boolean;
  reason?: string;
}

export class ConsentManager {
  private pendingConsents: Map<string, ConsentRequest> = new Map();
  private consentResponses: Map<string, ConsentResponse> = new Map();
  private readonly consentTimeout = 60 * 1000; // 1 minute timeout

  /**
   * Request consent from user
   * Checks for remembered consent first, then waits for user response
   */
  async requestConsent(request: ConsentRequest): Promise<boolean> {
    console.log('[ConsentManager] Requesting consent:', {
      sessionId: request.sessionId,
      domain: request.domain,
      action: request.actionDescription,
    });

    // Check if consent is required
    if (request.requiresApproval === false) {
      console.log('[ConsentManager] Action does not require approval');
      await this.logConsent(request, true, 'Action does not require approval');
      return true;
    }

    // Check for remembered consent
    const remembered = await this.checkRememberedConsent(
      request.userId,
      request.domain
    );

    if (remembered !== null) {
      console.log('[ConsentManager] Using remembered consent:', remembered);
      await this.logConsent(
        request,
        remembered,
        remembered ? 'Previously approved' : 'Previously denied'
      );
      return remembered;
    }

    // Store pending consent request
    const requestId = `consent-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    this.pendingConsents.set(requestId, request);

    // TODO: Send notification to frontend
    // This would typically be done via WebSocket or SSE
    console.log('[ConsentManager] Waiting for user response...');

    // Wait for response with timeout
    const response = await this.waitForResponse(requestId);

    if (response) {
      // Log the decision
      await this.logConsent(request, response.approved, response.reason);

      // Save remembered consent if requested
      if (response.remember) {
        await this.rememberConsent(request.userId, request.domain, response.approved);
      }

      return response.approved;
    }

    // Timeout - default to deny for safety
    console.log('[ConsentManager] Consent request timed out');
    await this.logConsent(request, false, 'Consent request timed out');
    return false;
  }

  /**
   * Approve consent request
   */
  async approveConsent(
    requestId: string,
    remember: boolean = false,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const request = this.pendingConsents.get(requestId);

    if (!request) {
      return {
        success: false,
        error: 'Consent request not found or already processed',
      };
    }

    const response: ConsentResponse = {
      approved: true,
      remember,
      reason,
      respondedAt: Date.now(),
    };

    this.consentResponses.set(requestId, response);
    this.pendingConsents.delete(requestId);

    console.log('[ConsentManager] Consent approved:', requestId);

    return { success: true };
  }

  /**
   * Deny consent request
   */
  async denyConsent(
    requestId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const request = this.pendingConsents.get(requestId);

    if (!request) {
      return {
        success: false,
        error: 'Consent request not found or already processed',
      };
    }

    const response: ConsentResponse = {
      approved: false,
      remember: false,
      reason,
      respondedAt: Date.now(),
    };

    this.consentResponses.set(requestId, response);
    this.pendingConsents.delete(requestId);

    console.log('[ConsentManager] Consent denied:', requestId);

    return { success: true };
  }

  /**
   * Check for remembered consent for a domain
   */
  private async checkRememberedConsent(
    userId: string,
    domain: string
  ): Promise<boolean | null> {
    try {
      const supabase = await createClient();

      // Use Guy's helper function
      const { data, error } = await supabase.rpc('get_user_domain_consent', {
        p_user_id: userId,
        p_domain: domain,
      });

      if (error || !data || data.length === 0) {
        return null; // No remembered consent
      }

      const consent = data[0];
      return consent.approved;
    } catch (error) {
      console.error('[ConsentManager] Failed to check remembered consent:', error);
      return null;
    }
  }

  /**
   * Save consent decision to remember for future requests
   */
  private async rememberConsent(
    userId: string,
    domain: string,
    approved: boolean
  ): Promise<void> {
    try {
      const supabase = await createClient();

      // Note: We'll use a special session_id to indicate this is a remembered preference
      const preferenceSessionId = '00000000-0000-0000-0000-000000000000';

      await supabase.from('browser_consent_records').insert({
        user_id: userId,
        session_id: preferenceSessionId,
        domain,
        action_description: 'Domain-wide consent preference',
        approved,
        remember_choice: true,
      });

      console.log('[ConsentManager] Saved remembered consent:', {
        userId,
        domain,
        approved,
      });
    } catch (error) {
      console.error('[ConsentManager] Failed to save remembered consent:', error);
    }
  }

  /**
   * Log consent decision to database
   */
  private async logConsent(
    request: ConsentRequest,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from('browser_consent_records').insert({
        user_id: request.userId,
        session_id: request.sessionId,
        domain: request.domain,
        action_description: request.actionDescription,
        approved,
        reason: reason || null,
        remember_choice: false, // Individual decisions don't count as remembered
      });

      console.log('[ConsentManager] Logged consent decision:', {
        sessionId: request.sessionId,
        approved,
        reason,
      });
    } catch (error) {
      console.error('[ConsentManager] Failed to log consent:', error);
    }
  }

  /**
   * Wait for user response with timeout
   */
  private async waitForResponse(
    requestId: string
  ): Promise<ConsentResponse | null> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // Check if response received
        const response = this.consentResponses.get(requestId);
        if (response) {
          clearInterval(checkInterval);
          this.consentResponses.delete(requestId);
          resolve(response);
          return;
        }

        // Check timeout
        if (Date.now() - startTime > this.consentTimeout) {
          clearInterval(checkInterval);
          this.pendingConsents.delete(requestId);
          resolve(null);
        }
      }, 500); // Check every 500ms
    });
  }

  /**
   * Get pending consent requests for a user
   */
  getPendingConsents(userId: string): ConsentRequest[] {
    return Array.from(this.pendingConsents.values()).filter(
      (request) => request.userId === userId
    );
  }

  /**
   * Get consent history for a user and domain
   */
  async getConsentHistory(
    userId: string,
    domain?: string
  ): Promise<
    Array<{
      domain: string;
      actionDescription: string;
      approved: boolean;
      createdAt: string;
    }>
  > {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('browser_consent_records')
        .select('domain, action_description, approved, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (domain) {
        query = query.eq('domain', domain);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map((record: {
        domain: string;
        action_description: string;
        approved: boolean;
        created_at: string;
      }) => ({
        domain: record.domain,
        actionDescription: record.action_description,
        approved: record.approved,
        createdAt: record.created_at,
      }));
    } catch (error) {
      console.error('[ConsentManager] Failed to get consent history:', error);
      return [];
    }
  }

  /**
   * Clear remembered consent for a domain
   */
  async clearRememberedConsent(
    userId: string,
    domain: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient();

      // Delete all remembered consents for this domain
      const { error } = await supabase
        .from('browser_consent_records')
        .delete()
        .eq('user_id', userId)
        .eq('domain', domain)
        .eq('remember_choice', true);

      if (error) {
        throw error;
      }

      console.log('[ConsentManager] Cleared remembered consent:', {
        userId,
        domain,
      });

      return { success: true };
    } catch (error) {
      console.error('[ConsentManager] Failed to clear remembered consent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear consent',
      };
    }
  }

  /**
   * Cleanup expired pending consents
   */
  cleanup(): void {
    const now = Date.now();

    for (const [requestId] of this.pendingConsents.entries()) {
      // Note: Requests are tracked in memory only, no creation timestamp stored
      // Actual timeout is handled in waitForResponse()
      // This cleanup is for edge cases where waitForResponse doesn't clean up
      // Check if consent response exists (already processed)
      if (this.consentResponses.has(requestId)) {
        this.pendingConsents.delete(requestId);
        console.log('[ConsentManager] Cleaned up processed consent:', requestId);
      }
    }
  }
}

// Singleton instance
let consentManagerInstance: ConsentManager | null = null;

/**
 * Get singleton consent manager instance
 */
export function getConsentManager(): ConsentManager {
  if (!consentManagerInstance) {
    consentManagerInstance = new ConsentManager();

    // Cleanup expired consents every minute
    setInterval(() => {
      consentManagerInstance?.cleanup();
    }, 60 * 1000);
  }

  return consentManagerInstance;
}
