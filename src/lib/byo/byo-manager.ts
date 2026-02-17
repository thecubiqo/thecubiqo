/**
 * BYO (Bring Your Own) API Keys Manager
 * 
 * Manages user's BYO API keys with encryption
 * Stores encrypted keys in Supabase user metadata
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Days 1-2: BYO AI Router Integration
 */

import { createClient } from '@/lib/supabase/server';
import { encryptKey, decryptKey, generatePassphrase } from './encryption';
import type { BYOConfig } from './types';

/**
 * User's BYO configuration with encrypted keys
 */
interface BYOStoredConfig {
  enabled: boolean;
  encryptedClaudeKey?: string;
  encryptedOpenAIKey?: string;
  encryptedGroqKey?: string;
  encryptedGoogleKey?: string;
  updatedAt: string;
}

/**
 * Get user's BYO configuration
 * Decrypts API keys on the fly
 */
export async function getBYOConfig(userId: string): Promise<BYOConfig | null> {
  try {
    const supabase = await createClient();

    // Get user metadata
    const { data: user, error } = await supabase
      .from('profiles')
      .select('byo_config')
      .eq('id', userId)
      .single();

    if (error || !user?.byo_config) {
      return null;
    }

    const storedConfig = user.byo_config as BYOStoredConfig;

    if (!storedConfig.enabled) {
      return {
        enabled: false,
        claudeApiKey: null,
        openaiApiKey: null,
      };
    }

    // Decrypt keys
    const passphrase = generatePassphrase(userId);

    const claudeApiKey = storedConfig.encryptedClaudeKey
      ? await decryptKey(storedConfig.encryptedClaudeKey, passphrase)
      : null;

    const openaiApiKey = storedConfig.encryptedOpenAIKey
      ? await decryptKey(storedConfig.encryptedOpenAIKey, passphrase)
      : null;

    return {
      enabled: true,
      claudeApiKey,
      openaiApiKey,
    };
  } catch (error) {
    console.error('[BYO Manager] Failed to get BYO config:', error);
    return null;
  }
}

/**
 * Save user's BYO configuration
 * Encrypts API keys before storing
 */
export async function saveBYOConfig(
  userId: string,
  config: BYOConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const passphrase = generatePassphrase(userId);

    // Encrypt keys
    const storedConfig: BYOStoredConfig = {
      enabled: config.enabled,
      updatedAt: new Date().toISOString(),
    };

    if (config.claudeApiKey) {
      storedConfig.encryptedClaudeKey = await encryptKey(
        config.claudeApiKey,
        passphrase
      );
    }

    if (config.openaiApiKey) {
      storedConfig.encryptedOpenAIKey = await encryptKey(
        config.openaiApiKey,
        passphrase
      );
    }

    // Save to user metadata
    const { error } = await supabase
      .from('profiles')
      .update({ byo_config: storedConfig })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[BYO Manager] Failed to save BYO config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save BYO config',
    };
  }
}

/**
 * Delete user's BYO configuration
 */
export async function deleteBYOConfig(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ byo_config: null })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[BYO Manager] Failed to delete BYO config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete BYO config',
    };
  }
}

/**
 * Validate API key format (basic check)
 */
export function validateAPIKey(provider: string, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  switch (provider) {
    case 'claude':
      // Claude keys start with 'sk-ant-'
      return apiKey.startsWith('sk-ant-');
    case 'openai':
      // OpenAI keys start with 'sk-'
      return apiKey.startsWith('sk-');
    case 'groq':
      // Groq keys start with 'gsk_'
      return apiKey.startsWith('gsk_');
    case 'google':
      // Google keys are typically longer alphanumeric
      return apiKey.length > 20;
    default:
      return true; // Allow other providers
  }
}

/**
 * Test API key by making a simple request
 * Returns true if key is valid
 */
export async function testAPIKey(
  provider: string,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic format validation first
    if (!validateAPIKey(provider, apiKey)) {
      return {
        valid: false,
        error: 'Invalid API key format',
      };
    }

    // TODO: Add actual API calls to test keys
    // For now, just validate format
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to test API key',
    };
  }
}
