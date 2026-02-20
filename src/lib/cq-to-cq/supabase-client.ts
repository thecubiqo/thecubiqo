/**
 * Supabase Client for CQ-to-CQ Messaging
 * Database operations and real-time subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CQNumber,
  FriendRequest,
  CQContact,
  CQConversation,
  CQMessage,
  CQCall,
  CQNotification,
  CQPrivacySettings,
  VoiceSynthesisConfig,
  CQPremiumStatus,
} from './types';

// Initialize Supabase client (configure with your project URL and key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== CQ NUMBERS ====================

export async function saveCQNumber(data: Omit<CQNumber, 'id'>) {
  const { data: result, error } = await supabase
    .from('cq_numbers')
    .insert({
      cq_number: data.cqNumber,
      user_id: data.userId,
      created_at: data.createdAt.toISOString(),
      expires_at: data.expiresAt.toISOString(),
      status: data.status,
      rotation_interval: data.rotationInterval,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getActiveCQNumber(userId: string): Promise<CQNumber | null> {
  const { data, error } = await supabase
    .from('cq_numbers')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) return null;
  
  return {
    id: data.id,
    cqNumber: data.cq_number,
    userId: data.user_id,
    createdAt: new Date(data.created_at),
    expiresAt: new Date(data.expires_at),
    status: data.status,
    rotationInterval: data.rotation_interval,
  };
}

export async function getUserByCQNumber(cqNumber: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('cq_numbers')
    .select('user_id')
    .eq('cq_number', cqNumber)
    .eq('status', 'active')
    .single();

  if (error) return null;
  return data?.user_id || null;
}

export async function rotateCQNumber(
  userId: string,
  newCQNumber: string,
  expiresAt: Date,
  rotationInterval: number
) {
  // Mark old CQ# as expired and create new one atomically via Promise.all
  // The unique partial index on (user_id) WHERE status='active' ensures
  // only one active CQ# per user at the database level
  const [, newRecord] = await Promise.all([
    supabase
      .from('cq_numbers')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active'),
    saveCQNumber({
      cqNumber: newCQNumber,
      userId,
      createdAt: new Date(),
      expiresAt,
      status: 'active',
      rotationInterval,
    }),
  ]);

  return newRecord;
}

// ==================== FRIEND REQUESTS ====================

export async function sendFriendRequest(
  fromUserId: string,
  toCQNumber: string,
  message?: string
) {
  // Resolve both CQ numbers in parallel for efficiency
  const [toUserId, fromCQNumber] = await Promise.all([
    getUserByCQNumber(toCQNumber),
    getActiveCQNumber(fromUserId),
  ]);

  if (!toUserId) throw new Error('CQ# not found');
  if (!fromCQNumber) throw new Error('Sender CQ# not found');

  const { data, error } = await supabase
    .from('cq_friend_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      from_cq_number: fromCQNumber.cqNumber,
      to_cq_number: toCQNumber,
      status: 'pending',
      message,
      requested_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function respondToFriendRequest(
  requestId: string,
  accept: boolean
) {
  const status = accept ? 'accepted' : 'rejected';
  
  const { data, error } = await supabase
    .from('cq_friend_requests')
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;

  // If accepted, create bidirectional contacts
  if (accept && data) {
    await Promise.all([
      createContact(data.from_user_id, data.to_user_id, data.to_cq_number),
      createContact(data.to_user_id, data.from_user_id, data.from_cq_number),
    ]);
  }

  return data;
}

export async function getPendingFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('cq_friend_requests')
    .select('*')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ==================== CONTACTS ====================

export async function createContact(
  userId: string,
  contactUserId: string,
  contactCQNumber: string
) {
  const { data, error } = await supabase
    .from('cq_contacts')
    .insert({
      user_id: userId,
      contact_user_id: contactUserId,
      contact_cq_number: contactCQNumber,
      added_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getContacts(userId: string) {
  const { data, error } = await supabase
    .from('cq_contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_blocked', false)
    .order('is_pinned', { ascending: false })
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data;
}

export async function updateContact(
  contactId: string,
  updates: Partial<CQContact>
) {
  const { data, error } = await supabase
    .from('cq_contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContact(userId: string, contactUserId: string) {
  const { error } = await supabase
    .from('cq_contacts')
    .delete()
    .eq('user_id', userId)
    .eq('contact_user_id', contactUserId);

  if (error) throw error;
}

export async function isContact(userId: string, otherUserId: string): Promise<boolean> {
  const { data } = await supabase
    .from('cq_contacts')
    .select('id')
    .eq('user_id', userId)
    .eq('contact_user_id', otherUserId)
    .eq('is_blocked', false)
    .single();

  return !!data;
}

// ==================== CONVERSATIONS ====================

export async function getOrCreateConversation(
  userId1: string,
  userId2: string
): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    user_1: userId1,
    user_2: userId2,
  });

  if (error) throw error;
  return data;
}

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from('cq_conversations')
    .select('*')
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data;
}

export async function markConversationAsRead(
  conversationId: string,
  userId: string
) {
  // Batch both updates in parallel for efficiency
  const [messageResult, convResult] = await Promise.all([
    supabase
      .from('cq_messages')
      .update({ read_at: new Date().toISOString(), status: 'read' })
      .eq('conversation_id', conversationId)
      .eq('to_user_id', userId)
      .is('read_at', null),
    supabase
      .from('cq_conversations')
      .update({
        unread_counts: {},
      })
      .eq('id', conversationId),
  ]);

  if (messageResult.error) throw messageResult.error;
  if (convResult.error) throw convResult.error;
}

// ==================== MESSAGES ====================

export async function sendMessage(data: Omit<CQMessage, 'id' | 'sentAt' | 'status'>) {
  const { data: result, error } = await supabase
    .from('cq_messages')
    .insert({
      conversation_id: data.conversationId,
      from_user_id: data.fromUserId,
      to_user_id: data.toUserId,
      type: data.type,
      content: data.content,
      voice_url: data.voiceUrl,
      voice_duration: data.voiceDuration,
      synthesized_audio_url: data.synthesizedAudioUrl,
      file_metadata: data.fileMetadata,
      reply_to_id: data.replyToId,
      sent_at: new Date().toISOString(),
      status: 'sent',
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getMessages(
  conversationId: string,
  limit: number = 50,
  before?: Date
) {
  let query = supabase
    .from('cq_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('sent_at', before.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function updateMessageStatus(
  messageId: string,
  status: CQMessage['status'],
  timestamp?: Date
) {
  const updates: any = { status };

  if (status === 'delivered') {
    updates.delivered_at = timestamp?.toISOString() || new Date().toISOString();
  } else if (status === 'read') {
    updates.read_at = timestamp?.toISOString() || new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('cq_messages')
    .update(updates)
    .eq('id', messageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMessage(messageId: string, userId: string) {
  const { data, error } = await supabase
    .from('cq_messages')
    .update({ is_deleted: true })
    .eq('id', messageId)
    .eq('from_user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== CALLS ====================

export async function initiateCall(
  conversationId: string,
  initiatorId: string,
  recipientId: string,
  type: 'audio' | 'video'
) {
  const { data, error } = await supabase
    .from('cq_calls')
    .insert({
      conversation_id: conversationId,
      initiator_id: initiatorId,
      recipient_id: recipientId,
      type,
      status: 'ringing',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCallStatus(
  callId: string,
  status: CQCall['status'],
  additionalData?: Partial<CQCall>
) {
  const updates: any = { status, ...additionalData };

  if (status === 'active' && !additionalData?.answeredAt) {
    updates.answered_at = new Date().toISOString();
  } else if (status === 'ended' && !additionalData?.endedAt) {
    updates.ended_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('cq_calls')
    .update(updates)
    .eq('id', callId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== NOTIFICATIONS ====================

export async function createNotification(data: Omit<CQNotification, 'id' | 'createdAt'>) {
  const { data: result, error } = await supabase
    .from('cq_notifications')
    .insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data,
      read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getNotifications(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('cq_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('cq_notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

// ==================== SETTINGS ====================

export async function getPrivacySettings(userId: string): Promise<CQPrivacySettings> {
  const { data, error } = await supabase
    .from('cq_privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Return defaults
    return {
      userId,
      whoCanAddMe: 'anyone',
      whoCanCallMe: 'contacts_only',
      whoCanSeeOnlineStatus: 'contacts_only',
      readReceipts: true,
      typingIndicators: true,
      autoRotateCQ: true,
      rotationIntervalDays: 30,
    };
  }

  return {
    userId: data.user_id,
    whoCanAddMe: data.who_can_add_me,
    whoCanCallMe: data.who_can_call_me,
    whoCanSeeOnlineStatus: data.who_can_see_online_status,
    readReceipts: data.read_receipts,
    typingIndicators: data.typing_indicators,
    autoRotateCQ: data.auto_rotate_cq,
    rotationIntervalDays: data.rotation_interval_days,
  };
}

export async function updatePrivacySettings(
  userId: string,
  settings: Partial<CQPrivacySettings>
) {
  const { data, error } = await supabase
    .from('cq_privacy_settings')
    .upsert({
      user_id: userId,
      who_can_add_me: settings.whoCanAddMe,
      who_can_call_me: settings.whoCanCallMe,
      who_can_see_online_status: settings.whoCanSeeOnlineStatus,
      read_receipts: settings.readReceipts,
      typing_indicators: settings.typingIndicators,
      auto_rotate_cq: settings.autoRotateCQ,
      rotation_interval_days: settings.rotationIntervalDays,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVoiceSynthesisConfig(
  userId: string
): Promise<VoiceSynthesisConfig | null> {
  const { data, error } = await supabase
    .from('cq_voice_synthesis')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;

  return {
    userId: data.user_id,
    cubiQoVoiceId: data.cubiqo_voice_id,
    voiceSettings: data.voice_settings,
    enableAutoRead: data.enable_auto_read,
    readOnlyWhenActive: data.read_only_when_active,
  };
}

export async function getPremiumStatus(userId: string): Promise<CQPremiumStatus> {
  const { data, error } = await supabase
    .from('cq_premium_status')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      userId,
      isPremium: false,
      features: {
        cqMessaging: false,
        voiceCalls: false,
        videoCalls: false,
        screenSharing: false,
        fileSharing: false,
        customVoice: false,
      },
    };
  }

  return {
    userId: data.user_id,
    isPremium: data.is_premium,
    premiumUntil: data.premium_until ? new Date(data.premium_until) : undefined,
    features: data.features,
  };
}
