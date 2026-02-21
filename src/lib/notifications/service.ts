// Core notification service for delivering system alerts

import { createClient } from '@/lib/supabase/server';
import type {
  Notification,
  NotificationType,
  NotificationPriority,
} from './types';
import { randomUUID } from 'crypto';

export class NotificationService {
  /**
   * Create and send a notification through all enabled channels
   */
  static async send(params: {
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    details?: Record<string, any>;
    actionUrl?: string;
    actionLabel?: string;
    userId?: string;
    expiresInHours?: number;
  }): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const supabase = await createClient();

      // Create notification record
      const notification: Notification = {
        id: randomUUID(),
        type: params.type,
        priority: params.priority,
        title: params.title,
        message: params.message,
        details: params.details,
        actionUrl: params.actionUrl,
        actionLabel: params.actionLabel,
        userId: params.userId,
        read: false,
        dismissed: false,
        createdAt: new Date(),
        expiresAt: params.expiresInHours
          ? new Date(Date.now() + params.expiresInHours * 60 * 60 * 1000)
          : undefined,
      };

      // Save to database
      const { data, error } = await (supabase as any)
        .from('notifications')
        .insert({
          id: notification.id,
          type: notification.type,
          priority: notification.priority,
          title: notification.title,
          message: notification.message,
          details: notification.details || {},
          action_url: notification.actionUrl,
          action_label: notification.actionLabel,
          user_id: notification.userId,
          read: notification.read,
          dismissed: notification.dismissed,
          expires_at: notification.expiresAt?.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save notification:', error);
        return { success: false, error: error.message };
      }

      // Send through additional channels based on priority
      if (params.priority === 'critical' || params.priority === 'high') {
        // Send webhook notification
        await this.sendWebhook(notification);

        // Send Slack notification
        await this.sendSlack(notification);
      }

      return { success: true, notificationId: notification.id };
    } catch (error) {
      console.error('Notification service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send notification to configured webhook
   */
  private static async sendWebhook(notification: Partial<Notification>): Promise<void> {
    try {
      const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
      if (!webhookUrl) return;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Notification-Secret': process.env.NOTIFICATION_WEBHOOK_SECRET || '',
        },
        body: JSON.stringify({
          id: notification.id,
          type: notification.type,
          priority: notification.priority,
          title: notification.title,
          message: notification.message,
          details: notification.details,
          timestamp: notification.createdAt?.toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn('Webhook notification failed:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Send notification to Slack
   */
  private static async sendSlack(notification: Partial<Notification>): Promise<void> {
    try {
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!slackWebhookUrl) return;

      const priorityEmoji = {
        low: '📘',
        medium: '📙',
        high: '🟠',
        critical: '🔴',
      }[notification.priority || 'medium'];

      const response = await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${priorityEmoji} *${notification.title}*`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${priorityEmoji} ${notification.title}`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: notification.message,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Priority: *${notification.priority}* | Type: \`${notification.type}\``,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        console.warn('Slack notification failed:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnread(userId?: string): Promise<Notification[]> {
    try {
      const supabase = await createClient();

      let query = (supabase as any)
        .from('notifications')
        .select('*')
        .eq('read', false)
        .eq('dismissed', false)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        type: row.type,
        priority: row.priority,
        title: row.title,
        message: row.message,
        details: row.details,
        actionUrl: row.action_url,
        actionLabel: row.action_label,
        userId: row.user_id,
        read: row.read,
        dismissed: row.dismissed,
        createdAt: new Date(row.created_at),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      }));
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Failed to mark notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Dismiss notification
   */
  static async dismiss(notificationId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { error } = await (supabase as any)
        .from('notifications')
        .update({ dismissed: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Failed to dismiss notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
      return false;
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpired(): Promise<number> {
    try {
      const supabase = await createClient();

      const { data, error } = await (supabase as any)
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        console.error('Failed to cleanup notifications:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup notifications:', error);
      return 0;
    }
  }
}
