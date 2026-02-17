/**
 * Browser Queue System
 * 
 * Manages browser session queuing with:
 * - Max 5 concurrent sessions
 * - Priority handling
 * - Rate limiting (10 sessions/hour per user)
 * - FIFO queue for pending sessions
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Days 3-4: Browser Queue & Pool
 */

import { createClient } from '@/lib/supabase/server';

export type SessionStatus = 'pending' | 'active' | 'completed' | 'failed' | 'denied';

export interface QueuedSession {
  id: string;
  userId: string;
  url: string;
  purpose: string;
  priority: number; // Higher = more important (0-10)
  createdAt: number;
  status: SessionStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

interface RateLimitTracker {
  [userId: string]: {
    count: number;
    windowStart: number;
  };
}

export class BrowserQueue {
  private queue: QueuedSession[] = [];
  private activeSessionsCount = 0;
  private readonly maxConcurrent = 5;
  private readonly maxSessionsPerHour = 10;
  private readonly rateLimitWindow = 60 * 60 * 1000; // 1 hour in ms
  private rateLimitTracker: RateLimitTracker = {};

  /**
   * Enqueue a new browser session
   * Returns session ID if successful, or error if rate limited
   */
  async enqueue(
    session: Omit<QueuedSession, 'status' | 'createdAt'>
  ): Promise<{ id: string; position: number } | { error: string }> {
    // Check rate limit
    if (!this.checkRateLimit(session.userId)) {
      return {
        error: `Rate limit exceeded. Max ${this.maxSessionsPerHour} sessions per hour.`,
      };
    }

    // Create queued session
    const queuedSession: QueuedSession = {
      ...session,
      status: 'pending',
      createdAt: Date.now(),
    };

    // Insert in priority order (higher priority first)
    const insertIndex = this.queue.findIndex(
      (s) => s.status === 'pending' && s.priority < queuedSession.priority
    );

    if (insertIndex === -1) {
      this.queue.push(queuedSession);
    } else {
      this.queue.splice(insertIndex, 0, queuedSession);
    }

    // Save to database
    await this.saveSessionToDatabase(queuedSession);

    // Track for rate limiting
    this.trackSession(session.userId);

    // Calculate queue position
    const position = this.queue
      .filter((s) => s.status === 'pending')
      .indexOf(queuedSession);

    // Try to process queue immediately
    this.processQueue();

    return { id: queuedSession.id, position };
  }

  /**
   * Check if user is within rate limit
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const tracker = this.rateLimitTracker[userId];

    if (!tracker) {
      return true; // No sessions yet
    }

    // Reset window if expired
    if (now - tracker.windowStart > this.rateLimitWindow) {
      delete this.rateLimitTracker[userId];
      return true;
    }

    // Check if under limit
    return tracker.count < this.maxSessionsPerHour;
  }

  /**
   * Track session for rate limiting
   */
  private trackSession(userId: string): void {
    const now = Date.now();
    const tracker = this.rateLimitTracker[userId];

    if (!tracker) {
      this.rateLimitTracker[userId] = {
        count: 1,
        windowStart: now,
      };
    } else {
      tracker.count++;
    }
  }

  /**
   * Process queue - start next pending session if capacity available
   */
  private async processQueue(): Promise<void> {
    // Check if we can process more sessions
    if (this.activeSessionsCount >= this.maxConcurrent) {
      console.log('[BrowserQueue] Queue full, waiting for capacity');
      return;
    }

    // Find next pending session (highest priority)
    const nextSession = this.queue.find((s) => s.status === 'pending');

    if (!nextSession) {
      console.log('[BrowserQueue] No pending sessions');
      return;
    }

    // Mark as active
    nextSession.status = 'active';
    nextSession.startedAt = Date.now();
    this.activeSessionsCount++;

    console.log('[BrowserQueue] Starting session:', nextSession.id);

    // Update database
    await this.updateSessionInDatabase(nextSession);

    // Execute session (async)
    this.executeSession(nextSession)
      .then(() => {
        nextSession.status = 'completed';
        nextSession.completedAt = Date.now();
      })
      .catch((error) => {
        nextSession.status = 'failed';
        nextSession.error = error.message;
        nextSession.completedAt = Date.now();
      })
      .finally(async () => {
        this.activeSessionsCount--;
        await this.updateSessionInDatabase(nextSession);
        
        // Process next session in queue
        this.processQueue();
      });
  }

  /**
   * Execute browser session
   * This is where the actual browser automation happens
   */
  private async executeSession(session: QueuedSession): Promise<void> {
    console.log('[BrowserQueue] Executing session:', session.id);

    // TODO: Integrate with browser pool to get a browser instance
    // TODO: Execute browser actions
    // TODO: Handle consent flow
    // TODO: Capture results

    // Placeholder for now
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('[BrowserQueue] Session completed:', session.id);
  }

  /**
   * Get queue status for a user
   */
  getQueueStatus(userId?: string): {
    pending: number;
    active: number;
    completed: number;
    userPosition?: number;
  } {
    const pending = this.queue.filter((s) => s.status === 'pending').length;
    const active = this.activeSessionsCount;
    const completed = this.queue.filter((s) => s.status === 'completed').length;

    let userPosition: number | undefined;
    if (userId) {
      const userSession = this.queue.find(
        (s) => s.userId === userId && s.status === 'pending'
      );
      if (userSession) {
        userPosition =
          this.queue.filter((s) => s.status === 'pending').indexOf(userSession) + 1;
      }
    }

    return { pending, active, completed, userPosition };
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): QueuedSession | undefined {
    return this.queue.find((s) => s.id === sessionId);
  }

  /**
   * Cancel a pending session
   */
  async cancelSession(sessionId: string): Promise<boolean> {
    const session = this.queue.find((s) => s.id === sessionId);

    if (!session) {
      return false;
    }

    if (session.status !== 'pending') {
      return false; // Can only cancel pending sessions
    }

    session.status = 'failed';
    session.error = 'Cancelled by user';
    session.completedAt = Date.now();

    await this.updateSessionInDatabase(session);

    return true;
  }

  /**
   * Save session to database
   */
  private async saveSessionToDatabase(session: QueuedSession): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from('browser_sessions').insert({
        id: session.id,
        user_id: session.userId,
        url: session.url,
        purpose: session.purpose,
        status: session.status,
        created_at: new Date(session.createdAt).toISOString(),
        metadata: {
          priority: session.priority,
        },
      });
    } catch (error) {
      console.error('[BrowserQueue] Failed to save session to database:', error);
    }
  }

  /**
   * Update session in database
   */
  private async updateSessionInDatabase(session: QueuedSession): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase
        .from('browser_sessions')
        .update({
          status: session.status,
          completed_at: session.completedAt
            ? new Date(session.completedAt).toISOString()
            : null,
          metadata: {
            priority: session.priority,
            error: session.error,
            startedAt: session.startedAt,
          },
        })
        .eq('id', session.id);
    } catch (error) {
      console.error('[BrowserQueue] Failed to update session in database:', error);
    }
  }

  /**
   * Clean up old completed sessions (older than 1 hour)
   */
  cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    this.queue = this.queue.filter((s) => {
      if (s.status === 'completed' || s.status === 'failed') {
        return s.completedAt ? s.completedAt > oneHourAgo : true;
      }
      return true;
    });
  }
}

// Singleton instance
let queueInstance: BrowserQueue | null = null;

/**
 * Get singleton queue instance
 */
export function getBrowserQueue(): BrowserQueue {
  if (!queueInstance) {
    queueInstance = new BrowserQueue();

    // Cleanup every 10 minutes
    setInterval(() => {
      queueInstance?.cleanup();
    }, 10 * 60 * 1000);
  }

  return queueInstance;
}
