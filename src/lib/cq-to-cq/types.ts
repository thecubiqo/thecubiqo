/**
 * CQ-to-CQ Messaging System Types
 * Module #9: Direct CubiQo-to-CubiQo communication
 */

export type CQNumberStatus = 'active' | 'expired' | 'rotating' | 'blocked';

export interface CQNumber {
  id: string; // Internal database ID
  cqNumber: string; // The actual CQ# (e.g., "CQ-8F3A-2K9B")
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  status: CQNumberStatus;
  rotationInterval: number; // milliseconds (default 30 days)
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromCQNumber: string;
  toCQNumber: string;
  status: FriendRequestStatus;
  requestedAt: Date;
  respondedAt?: Date;
  message?: string; // Optional introduction message
}

export interface CQContact {
  id: string;
  userId: string; // Owner of the contact list
  contactUserId: string; // The friend
  contactCQNumber: string; // Their current CQ#
  displayName?: string; // Custom nickname
  addedAt: Date;
  lastMessageAt?: Date;
  isPinned: boolean;
  isMuted: boolean;
  isBlocked: boolean;
}

export type MessageType = 'text' | 'voice' | 'file' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface CQMessage {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  type: MessageType;
  content: string; // Text content or file URL
  voiceUrl?: string; // For voice messages
  voiceDuration?: number; // seconds
  synthesizedAudioUrl?: string; // CubiQo voice reading the message
  fileMetadata?: {
    filename: string;
    size: number;
    mimeType: string;
    url: string;
  };
  status: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  isDeleted: boolean;
  replyToId?: string; // For threaded conversations
}

export interface CQConversation {
  id: string;
  participantIds: [string, string]; // Always 2 users (1-to-1)
  createdAt: Date;
  lastMessageAt?: Date;
  lastMessage?: string;
  unreadCount: Record<string, number>; // userId -> count
  isArchived: Record<string, boolean>; // userId -> archived status
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'initiating' | 'ringing' | 'active' | 'ended' | 'missed' | 'rejected';
export type CameraFacingMode = 'user' | 'environment';

export interface CQCall {
  id: string;
  conversationId: string;
  initiatorId: string;
  recipientId: string;
  type: CallType;
  status: CallStatus;
  startedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  duration?: number; // seconds
  webrtcOffer?: string;
  webrtcAnswer?: string;
  iceCandidates?: any[];
}

export interface ScreenShareSession {
  id: string;
  callId: string;
  sharerId: string;
  startedAt: Date;
  endedAt?: Date;
  streamId: string;
}

export interface CQNotification {
  id: string;
  userId: string;
  type: 'friend_request' | 'message' | 'call' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface PresenceStatus {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  customMessage?: string;
}

// WebSocket message types
export type WSMessageType =
  | 'message'
  | 'message_status'
  | 'typing'
  | 'presence'
  | 'call_signal'
  | 'call_ice_candidate'
  | 'friend_request'
  | 'contact_updated';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  timestamp: Date;
}

// Privacy settings
export interface CQPrivacySettings {
  userId: string;
  whoCanAddMe: 'anyone' | 'friends_of_friends' | 'nobody';
  whoCanCallMe: 'anyone' | 'contacts_only';
  whoCanSeeOnlineStatus: 'everyone' | 'contacts_only' | 'nobody';
  readReceipts: boolean;
  typingIndicators: boolean;
  autoRotateCQ: boolean;
  rotationIntervalDays: number;
}

// Voice synthesis configuration
export interface VoiceSynthesisConfig {
  userId: string;
  cubiQoVoiceId: string; // ElevenLabs or other TTS voice ID
  voiceSettings: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  enableAutoRead: boolean; // Auto-read messages aloud
  readOnlyWhenActive: boolean; // Only read when CubiQo is active
}

// Premium feature flag
export interface CQPremiumStatus {
  userId: string;
  isPremium: boolean;
  premiumUntil?: Date;
  features: {
    cqMessaging: boolean;
    voiceCalls: boolean;
    videoCalls: boolean;
    screenSharing: boolean;
    fileSharing: boolean;
    customVoice: boolean;
  };
}
