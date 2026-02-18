'use client'

import { useEffect, useState } from 'react'
import { notificationManager, type Notification } from '@/lib/notifications/notification-manager'
import { getIntegration } from '@/lib/notifications/integration-registry'
import { X } from 'lucide-react'

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()

    // Subscribe to real-time notifications
    const unsubscribe = notificationManager.subscribeToNotifications((notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    return () => unsubscribe()
  }, [])

  async function loadNotifications() {
    try {
      const data = await notificationManager.getAll({ limit: 50 })
      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  async function loadUnreadCount() {
    try {
      const count = await notificationManager.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      await notificationManager.markOneAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  async function handleDelete(id: string) {
    try {
      await notificationManager.delete(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (!notifications.find(n => n.id === id)?.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed top-16 right-4 w-96 max-h-[600px] bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[500px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <span className="text-4xl block mb-2">📭</span>
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  onDelete={() => handleDelete(notification.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete
}: {
  notification: Notification
  onMarkAsRead: () => void
  onDelete: () => void
}) {
  const integration = getIntegration(notification.data?.integration_name || '')
  const isUnread = !notification.read_at

  return (
    <div
      className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
        isUnread ? 'bg-white/5' : ''
      }`}
      onClick={isUnread ? onMarkAsRead : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Integration Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: integration?.color + '20' }}
        >
          {integration?.icon || '📬'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-white text-sm">{notification.title}</h4>
            {isUnread && (
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>

          {notification.body && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
              {notification.body}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">
              {new Date(notification.created_at).toLocaleTimeString()}
            </span>
            {notification.priority > 1 && (
              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                {notification.priority === 3 ? 'Urgent' : 'High'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}
