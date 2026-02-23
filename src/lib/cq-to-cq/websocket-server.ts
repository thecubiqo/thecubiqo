/**
 * WebSocket Server for Real-Time CQ-to-CQ Messaging
 * Handles real-time messaging, presence, typing indicators, and call signaling
 */

import { supabase } from './supabase-client';
import type { WSMessage, TypingIndicator, PresenceStatus } from './types';

// Type definitions for WebSocket server (implementation depends on your server choice)
type WebSocketConnection = {
  userId: string;
  connectionId: string;
  socket: any; // Replace with actual WebSocket type
  lastActivity: Date;
};

class CQWebSocketServer {
  private connections: Map<string, WebSocketConnection[]> = new Map();
  private presenceStatus: Map<string, PresenceStatus> = new Map();
  private typingIndicators: Map<string, TypingIndicator[]> = new Map();

  /**
   * Register a new WebSocket connection
   */
  async registerConnection(userId: string, connectionId: string, socket: any) {
    const connection: WebSocketConnection = {
      userId,
      connectionId,
      socket,
      lastActivity: new Date(),
    };

    if (!this.connections.has(userId)) {
      this.connections.set(userId, []);
    }

    this.connections.get(userId)!.push(connection);

    // Update presence status
    this.updatePresence(userId, 'online');



    // Notify contacts of online status
    await this.broadcastPresenceUpdate(userId, 'online');
  }

  /**
   * Unregister a WebSocket connection
   */
  async unregisterConnection(userId: string, connectionId: string) {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    const filteredConnections = userConnections.filter(
      (conn) => conn.connectionId !== connectionId
    );

    if (filteredConnections.length === 0) {
      this.connections.delete(userId);
      this.updatePresence(userId, 'offline');
      await this.broadcastPresenceUpdate(userId, 'offline');
    } else {
      this.connections.set(userId, filteredConnections);
    }


  }

  /**
   * Send a message to a specific user (all their connections)
   */
  async sendToUser(userId: string, message: WSMessage) {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.length === 0) {
      
      return false;
    }

    const payload = JSON.stringify(message);

    userConnections.forEach((connection) => {
      try {
        connection.socket.send(payload);
        connection.lastActivity = new Date();
      } catch (error) {
        
      }
    });

    return true;
  }

  /**
   * Handle incoming message from client
   */
  async handleMessage(userId: string, rawMessage: string) {
    try {
      const message: WSMessage = JSON.parse(rawMessage);

      switch (message.type) {
        case 'message':
          await this.handleChatMessage(userId, message);
          break;

        case 'message_status':
          await this.handleMessageStatus(userId, message);
          break;

        case 'typing':
          await this.handleTypingIndicator(userId, message);
          break;

        case 'presence':
          await this.handlePresenceUpdate(userId, message);
          break;

        case 'call_signal':
          await this.handleCallSignal(userId, message);
          break;

        case 'call_ice_candidate':
          await this.handleIceCandidate(userId, message);
          break;

        default:
          
      }
    } catch (error) {
      
    }
  }

  /**
   * Handle chat message
   */
  private async handleChatMessage(userId: string, message: WSMessage) {
    const { toUserId, content, type, conversationId } = message.payload;

    // Forward to recipient
    const delivered = await this.sendToUser(toUserId, {
      type: 'message',
      payload: message.payload,
      timestamp: new Date(),
    });

    // Update message status
    if (delivered) {
      await this.sendToUser(userId, {
        type: 'message_status',
        payload: {
          messageId: message.payload.messageId,
          status: 'delivered',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle message status update (delivered/read)
   */
  private async handleMessageStatus(userId: string, message: WSMessage) {
    const { messageId, status, recipientId } = message.payload;

    // Notify sender of status update
    await this.sendToUser(recipientId, {
      type: 'message_status',
      payload: {
        messageId,
        status,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  /**
   * Handle typing indicator
   */
  private async handleTypingIndicator(userId: string, message: WSMessage) {
    const { conversationId, isTyping, recipientId } = message.payload;

    const indicator: TypingIndicator = {
      conversationId,
      userId,
      isTyping,
      timestamp: new Date(),
    };

    // Store typing state
    if (!this.typingIndicators.has(conversationId)) {
      this.typingIndicators.set(conversationId, []);
    }

    const indicators = this.typingIndicators.get(conversationId)!;
    const existingIndex = indicators.findIndex((ind) => ind.userId === userId);

    if (isTyping) {
      if (existingIndex >= 0) {
        indicators[existingIndex] = indicator;
      } else {
        indicators.push(indicator);
      }
    } else {
      if (existingIndex >= 0) {
        indicators.splice(existingIndex, 1);
      }
    }

    // Notify recipient
    await this.sendToUser(recipientId, {
      type: 'typing',
      payload: indicator,
      timestamp: new Date(),
    });
  }

  /**
   * Handle presence update
   */
  private async handlePresenceUpdate(userId: string, message: WSMessage) {
    const { status, customMessage } = message.payload;

    this.updatePresence(userId, status, customMessage);
    await this.broadcastPresenceUpdate(userId, status, customMessage);
  }

  /**
   * Handle WebRTC call signaling
   */
  private async handleCallSignal(userId: string, message: WSMessage) {
    const { callId, recipientId, signal } = message.payload;

    // Forward signaling data to recipient
    await this.sendToUser(recipientId, {
      type: 'call_signal',
      payload: {
        callId,
        senderId: userId,
        signal,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Handle ICE candidate exchange for WebRTC
   */
  private async handleIceCandidate(userId: string, message: WSMessage) {
    const { callId, recipientId, candidate } = message.payload;

    // Forward ICE candidate to recipient
    await this.sendToUser(recipientId, {
      type: 'call_ice_candidate',
      payload: {
        callId,
        senderId: userId,
        candidate,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Update user presence status
   */
  private updatePresence(
    userId: string,
    status: PresenceStatus['status'],
    customMessage?: string
  ) {
    this.presenceStatus.set(userId, {
      userId,
      status,
      lastSeen: new Date(),
      customMessage,
    });
  }

  /**
   * Broadcast presence update to user's contacts
   */
  private async broadcastPresenceUpdate(
    userId: string,
    status: PresenceStatus['status'],
    customMessage?: string
  ) {
    // Get user's contacts from database
    if (!supabase) return;
    const { data: contacts } = await supabase
      .from('cq_contacts')
      .select('user_id')
      .eq('contact_user_id', userId);

    if (!contacts) return;

    const presenceUpdate: WSMessage = {
      type: 'presence',
      payload: {
        userId,
        status,
        lastSeen: new Date(),
        customMessage,
      },
      timestamp: new Date(),
    };

    // Notify each contact
    for (const contact of contacts) {
      await this.sendToUser(contact.user_id, presenceUpdate);
    }
  }

  /**
   * Get online status of a user
   */
  isUserOnline(userId: string): boolean {
    return this.connections.has(userId) && this.connections.get(userId)!.length > 0;
  }

  /**
   * Get presence status of a user
   */
  getPresenceStatus(userId: string): PresenceStatus | null {
    return this.presenceStatus.get(userId) || null;
  }

  /**
   * Clean up stale connections (heartbeat check)
   */
  cleanupStaleConnections(timeoutMinutes: number = 5) {
    const now = new Date();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    for (const [userId, connections] of this.connections.entries()) {
      const activeConnections = connections.filter((conn) => {
        const timeSinceActivity = now.getTime() - conn.lastActivity.getTime();
        return timeSinceActivity < timeoutMs;
      });

      if (activeConnections.length === 0) {
        this.connections.delete(userId);
        this.updatePresence(userId, 'offline');
      } else if (activeConnections.length !== connections.length) {
        this.connections.set(userId, activeConnections);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    let totalConnections = 0;
    for (const connections of this.connections.values()) {
      totalConnections += connections.length;
    }

    return {
      uniqueUsers: this.connections.size,
      totalConnections,
      onlineUsers: Array.from(this.connections.keys()),
    };
  }
}

// Export singleton instance
export const cqWebSocketServer = new CQWebSocketServer();

// Example usage with different WebSocket libraries:

// ==================== Next.js API Route Example ====================
/*
// pages/api/cq-ws.ts
import { cqWebSocketServer } from '@/lib/cq-to-cq/websocket-server';

export default function handler(req: any, res: any) {
  if (req.socket.server.ws) {
    
  } else {
    const WebSocketServer = require('ws').Server;
    const wss = new WebSocketServer({ server: req.socket.server });

    wss.on('connection', (socket: any, request: any) => {
      // Extract userId from auth token (implement your auth logic)
      const userId = extractUserIdFromRequest(request);
      const connectionId = generateConnectionId();

      cqWebSocketServer.registerConnection(userId, connectionId, socket);

      socket.on('message', (data: any) => {
        cqWebSocketServer.handleMessage(userId, data.toString());
      });

      socket.on('close', () => {
        cqWebSocketServer.unregisterConnection(userId, connectionId);
      });
    });

    req.socket.server.ws = wss;
  }

  res.end();
}
*/

// ==================== Standalone Server Example ====================
/*
// server/cq-websocket.ts
import { WebSocketServer } from 'ws';
import { cqWebSocketServer } from './websocket-server';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket, request) => {
  const userId = extractUserIdFromRequest(request);
  const connectionId = crypto.randomUUID();

  cqWebSocketServer.registerConnection(userId, connectionId, socket);

  socket.on('message', (data) => {
    cqWebSocketServer.handleMessage(userId, data.toString());
  });

  socket.on('close', () => {
    cqWebSocketServer.unregisterConnection(userId, connectionId);
  });
});

// Periodic cleanup
setInterval(() => {
  cqWebSocketServer.cleanupStaleConnections(5);
}, 60000); // Every minute


*/

// ==================== Supabase Realtime Alternative ====================
/*
// If using Supabase Realtime instead of custom WebSocket:

export function subscribeToCQMessages(userId: string, callback: (message: any) => void) {
  return supabase
    .channel(`cq_messages:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'cq_messages',
        filter: `to_user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToPresence(userId: string, callback: (status: any) => void) {
  return supabase
    .channel(`cq_presence:${userId}`)
    .on('presence', { event: 'sync' }, callback)
    .subscribe();
}
*/
