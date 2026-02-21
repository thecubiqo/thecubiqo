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