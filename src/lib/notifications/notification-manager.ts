/**
 * Notification Manager
 * Core service for managing notifications from all integrations
 */

import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  user_id: string
  integration_id: string
  type: 'message' | 'mention' | 'alert' | 'reminder' | 'device_state'
  title: string
  body?: string
  data?: Record<string, any>
  priority: 0 | 1 | 2 | 3 // 0=low, 1=normal, 2=high, 3=urgent
  read_at?: string
  acted_on_at?: string
  action_taken?: string
  expires_at?: string
  created_at: string
}

export interface CreateNotificationInput {
  integration_id: string
  type: Notification['type']
  title: string
  body?: string
  data?: Record<string, any>
  priority?: Notification['priority']
  expires_at?: string
}

export class NotificationManager {
  private supabase = createClient() as any

  async create(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        integration_id: input.integration_id,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data || {},
        priority: input.priority || 1,
        expires_at: input.expires_at,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getAll(options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
    integrationId?: string
  }): Promise<Notification[]> {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.is('read_at', null)
    }

    if (options?.integrationId) {
      query = query.eq('integration_id', options.integrationId)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getUnreadCount(): Promise<number> {
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) return 0

    const { data, error } = await this.supabase
      .rpc('get_unread_notification_count', {
        p_user_id: user.user.id
      })

    if (error) throw error
    return data || 0
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .rpc('mark_notifications_read', {
        p_notification_ids: notificationIds
      })

    if (error) throw error
  }

  async markOneAsRead(notificationId: string): Promise<void> {
    await this.markAsRead([notificationId])
  }

  async delete(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
  }

  subscribeToNotifications(
    callback: (notification: Notification) => void
  ): () => void {
    const channel = this.supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }
}

export const notificationManager = new NotificationManager()
