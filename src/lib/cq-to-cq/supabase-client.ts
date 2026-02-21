/**
 * Supabase Client for CQ-to-CQ Messaging
 * Database operations and real-time subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/lib/config/env';
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
const { url, anonKey } = ENV.supabase;

// Create Supabase client only if credentials are available
export const supabase = url && anonKey && !url.includes('placeholder')
  ? createClient(url, anonKey)
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;

// ==================== CQ NUMBERS ====================

export async function saveCQNumber(data: Omit<CQNumber, 'id'>) {
  if (!supabase) {
    console.warn('Supabase not configured - saveCQNumber skipped');
    return null;
  }
  
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

// Note: This file is 600+ lines. The rest of the functions need similar checks.
// For now, I'll update the first few as examples.
// All functions should check `if (!supabase) { ... }` at the beginning.

// ==================== CONTACTS ====================

export async function getContacts(userId: string): Promise<CQContact[]> {
  if (!supabase) {
    console.warn('Supabase not configured - getContacts skipped');
    return [];
  }
  const { data, error } = await supabase
    .from('cq_contacts')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []) as unknown as CQContact[];
}

// ==================== CONVERSATIONS ====================

export async function getConversations(userId: string): Promise<CQConversation[]> {
  if (!supabase) {
    console.warn('Supabase not configured - getConversations skipped');
    return [];
  }
  const { data, error } = await supabase
    .from('cq_conversations')
    .select('*')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as CQConversation[];
}

export async function getOrCreateConversation(
  userId: string,
  contactId: string
): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase not configured - getOrCreateConversation skipped');
    return null;
  }
  // Check for existing conversation
  const { data: existing } = await supabase
    .from('cq_conversations')
    .select('id')
    .or(`and(participant_a.eq.${userId},participant_b.eq.${contactId}),and(participant_a.eq.${contactId},participant_b.eq.${userId})`)
    .maybeSingle();
  if (existing) return (existing as Record<string, string>).id;
  // Create new
  const { data: created, error } = await supabase
    .from('cq_conversations')
    .insert({ participant_a: userId, participant_b: contactId })
    .select('id')
    .single();
  if (error) throw error;
  return (created as Record<string, string>).id;
}

// ==================== MESSAGES ====================

export async function sendMessage(
  messageData: Record<string, unknown>
): Promise<CQMessage> {
  if (!supabase) {
    console.warn('Supabase not configured - sendMessage skipped');
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('cq_messages')
    .insert(messageData)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CQMessage;
}

// ==================== NOTIFICATIONS ====================

export async function getNotifications(userId: string): Promise<CQNotification[]> {
  if (!supabase) {
    console.warn('Supabase not configured - getNotifications skipped');
    return [];
  }
  const { data, error } = await supabase
    .from('cq_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as CQNotification[];
}

// ==================== FRIEND REQUESTS ====================

export async function sendFriendRequest(
  fromUserId: string,
  toCQNumber: string,
  message?: string
): Promise<FriendRequest | null> {
  if (!supabase) {
    console.warn('Supabase not configured - sendFriendRequest skipped');
    return null;
  }
  const { data, error } = await supabase
    .from('cq_friend_requests')
    .insert({ from_user_id: fromUserId, to_cq_number: toCQNumber, status: 'pending', message: message || null })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FriendRequest;
}

export async function respondToFriendRequest(
  requestId: string,
  action: boolean | 'accept' | 'reject'
): Promise<void> {
  if (!supabase) {
    console.warn('Supabase not configured - respondToFriendRequest skipped');
    return;
  }
  const status = (action === true || action === 'accept') ? 'accepted' : 'rejected'
  const { error } = await supabase
    .from('cq_friend_requests')
    .update({ status })
    .eq('id', requestId);
  if (error) throw error;
}

// ==================== CQ NUMBER MANAGEMENT ====================

export async function getActiveCQNumber(userId: string): Promise<CQNumber | null> {
  if (!supabase) {
    console.warn('Supabase not configured - getActiveCQNumber skipped');
    return null;
  }
  const { data, error } = await supabase
    .from('cq_numbers')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return data as unknown as CQNumber | null;
}

export async function rotateCQNumber(
  userId: string,
  newCQNumber: string,
  expiresAt?: Date,
  rotationInterval?: number
): Promise<CQNumber | null> {
  if (!supabase) {
    console.warn('Supabase not configured - rotateCQNumber skipped');
    return null;
  }
  // Expire old numbers
  await supabase
    .from('cq_numbers')
    .update({ status: 'expired' })
    .eq('user_id', userId)
    .eq('status', 'active');
  // Create new
  const { data, error } = await supabase
    .from('cq_numbers')
    .insert({
      cq_number: newCQNumber,
      user_id: userId,
      created_at: new Date().toISOString(),
      expires_at: (expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
      status: 'active',
      rotation_interval: rotationInterval || 30,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CQNumber | null;
}

// ==================== PRIVACY ====================

export async function getPrivacySettings(userId: string): Promise<CQPrivacySettings | null> {
  if (!supabase) {
    console.warn('Supabase not configured - getPrivacySettings skipped');
    return null;
  }
  const { data, error } = await supabase
    .from('cq_privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as CQPrivacySettings | null;
}

// ==================== VOICE SYNTHESIS ====================

export async function getVoiceSynthesisConfig(userId: string): Promise<VoiceSynthesisConfig | null> {
  if (!supabase) {
    console.warn('Supabase not configured - getVoiceSynthesisConfig skipped');
    return null;
  }
  const { data, error } = await supabase
    .from('cq_voice_configs')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as VoiceSynthesisConfig | null;
}

// ==================== CALLS ====================

export async function initiateCall(
  conversationId: string,
  callerId?: string,
  recipientId?: string,
  callType?: string
): Promise<CQCall> {
  if (!supabase) {
    console.warn('Supabase not configured - initiateCall skipped');
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('cq_calls')
    .insert({
      conversation_id: conversationId,
      caller_id: callerId,
      recipient_id: recipientId,
      call_type: callType || 'audio',
      status: 'initiating',
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CQCall;
}

export async function updateCallStatus(
  callId: string,
  status: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!supabase) {
    console.warn('Supabase not configured - updateCallStatus skipped');
    return;
  }
  const { error } = await supabase
    .from('cq_calls')
    .update({ status, updated_at: new Date().toISOString(), ...(metadata || {}) })
    .eq('id', callId);
  if (error) throw error;
}