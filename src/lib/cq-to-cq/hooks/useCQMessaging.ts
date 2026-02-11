/**
 * React Hook for CQ-to-CQ Messaging
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase-client';
import * as db from '../supabase-client';
import type {
  CQContact,
  CQConversation,
  CQMessage,
  CQNotification,
  WSMessage,
} from '../types';

export function useCQMessaging(userId: string) {
  const [contacts, setContacts] = useState<CQContact[]>([]);
  const [conversations, setConversations] = useState<CQConversation[]>([]);
  const [notifications, setNotifications] = useState<CQNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const connectWebSocket = () => {
      const ws = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}?userId=${userId}`
      );

      ws.onopen = () => {
        console.log('[CQ] WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const message: WSMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onerror = (error) => {
        console.error('[CQ] WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[CQ] WebSocket disconnected');
        setIsConnected(false);

        // Attempt reconnection after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, [userId]);

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [contactsData, conversationsData, notificationsData] =
          await Promise.all([
            db.getContacts(userId),
            db.getConversations(userId),
            db.getNotifications(userId),
          ]);

        setContacts(contactsData);
        setConversations(conversationsData);
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [userId]);

  // Subscribe to real-time updates via Supabase
  useEffect(() => {
    if (!userId) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`cq_messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cq_messages',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[CQ] New message:', payload);
          // Update conversations list
          loadConversations();
        }
      )
      .subscribe();

    // Subscribe to contact changes
    const contactsChannel = supabase
      .channel(`cq_contacts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cq_contacts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[CQ] Contact updated:', payload);
          loadContacts();
        }
      )
      .subscribe();

    // Subscribe to notifications
    const notificationsChannel = supabase
      .channel(`cq_notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cq_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[CQ] New notification:', payload);
          setNotifications((prev) => [payload.new as CQNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
      contactsChannel.unsubscribe();
      notificationsChannel.unsubscribe();
    };
  }, [userId]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'message':
        // New message received
        loadConversations();
        break;

      case 'message_status':
        // Message status updated (delivered/read)
        // Update UI accordingly
        break;

      case 'typing':
        // Someone is typing
        // Update UI with typing indicator
        break;

      case 'presence':
        // Contact presence updated
        // Update contact status
        break;

      case 'friend_request':
        // New friend request
        loadNotifications();
        break;

      default:
        console.warn('[CQ] Unknown WebSocket message type:', message.type);
    }
  }, []);

  // Helper functions to reload data
  const loadContacts = useCallback(async () => {
    try {
      const data = await db.getContacts(userId);
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }, [userId]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await db.getConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [userId]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await db.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [userId]);

  // Send message
  const sendMessage = useCallback(
    async (
      toUserId: string,
      content: string,
      type: 'text' | 'voice' = 'text',
      options?: {
        voiceUrl?: string;
        voiceDuration?: number;
        replyToId?: string;
      }
    ) => {
      try {
        // Get or create conversation
        const conversationId = await db.getOrCreateConversation(userId, toUserId);

        // Send message to database
        const message = await db.sendMessage({
          conversationId,
          fromUserId: userId,
          toUserId,
          type,
          content,
          voiceUrl: options?.voiceUrl,
          voiceDuration: options?.voiceDuration,
          replyToId: options?.replyToId,
          deliveredAt: undefined,
          readAt: undefined,
          isDeleted: false,
        });

        // Send via WebSocket for real-time delivery
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'message',
              payload: {
                messageId: message.id,
                conversationId,
                fromUserId: userId,
                toUserId,
                type,
                content,
                voiceUrl: options?.voiceUrl,
                timestamp: new Date(),
              },
              timestamp: new Date(),
            })
          );
        }

        return message;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    [userId]
  );

  // Send friend request
  const sendFriendRequest = useCallback(
    async (cqNumber: string, message?: string) => {
      try {
        return await db.sendFriendRequest(userId, cqNumber, message);
      } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
      }
    },
    [userId]
  );

  // Respond to friend request
  const respondToFriendRequest = useCallback(
    async (requestId: string, accept: boolean) => {
      try {
        await db.respondToFriendRequest(requestId, accept);
        await loadContacts();
        await loadNotifications();
      } catch (error) {
        console.error('Error responding to friend request:', error);
        throw error;
      }
    },
    [loadContacts, loadNotifications]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (conversationId: string, recipientId: string, isTyping: boolean) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'typing',
            payload: {
              conversationId,
              recipientId,
              isTyping,
            },
            timestamp: new Date(),
          })
        );
      }
    },
    []
  );

  return {
    contacts,
    conversations,
    notifications,
    isConnected,
    loading,
    sendMessage,
    sendFriendRequest,
    respondToFriendRequest,
    sendTypingIndicator,
    reloadContacts: loadContacts,
    reloadConversations: loadConversations,
    reloadNotifications: loadNotifications,
  };
}
