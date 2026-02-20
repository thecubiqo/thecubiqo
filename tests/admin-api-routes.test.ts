/**
 * API Routes Unit Tests
 * Tests the new tools, channels, and admin API route logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SUPPORTED_CHANNELS,
  isChannelConnected,
  isValidChannelType,
  getAllChannelTypes,
} from '@/lib/channels';

// ----- Channels utility tests -----

describe('Channels Utility', () => {
  describe('SUPPORTED_CHANNELS', () => {
    it('should define all 4 channel types', () => {
      expect(Object.keys(SUPPORTED_CHANNELS)).toEqual(['telegram', 'discord', 'slack', 'email']);
    });

    it('should have correct structure for each channel', () => {
      for (const [key, channel] of Object.entries(SUPPORTED_CHANNELS)) {
        expect(channel).toHaveProperty('type', key);
        expect(channel).toHaveProperty('name');
        expect(channel).toHaveProperty('description');
        expect(channel).toHaveProperty('envVars');
        expect(Array.isArray(channel.envVars)).toBe(true);
        expect(channel.envVars.length).toBeGreaterThan(0);
      }
    });

    it('telegram should check TELEGRAM_BOT_TOKEN', () => {
      expect(SUPPORTED_CHANNELS.telegram.envVars).toContain('TELEGRAM_BOT_TOKEN');
    });

    it('discord should check DISCORD_BOT_TOKEN', () => {
      expect(SUPPORTED_CHANNELS.discord.envVars).toContain('DISCORD_BOT_TOKEN');
    });

    it('slack should check SLACK_BOT_TOKEN', () => {
      expect(SUPPORTED_CHANNELS.slack.envVars).toContain('SLACK_BOT_TOKEN');
    });

    it('email should check EMAIL_SMTP_HOST or SENDGRID_API_KEY', () => {
      expect(SUPPORTED_CHANNELS.email.envVars).toContain('EMAIL_SMTP_HOST');
      expect(SUPPORTED_CHANNELS.email.envVars).toContain('SENDGRID_API_KEY');
    });
  });

  describe('isValidChannelType', () => {
    it('should return true for valid channel types', () => {
      expect(isValidChannelType('telegram')).toBe(true);
      expect(isValidChannelType('discord')).toBe(true);
      expect(isValidChannelType('slack')).toBe(true);
      expect(isValidChannelType('email')).toBe(true);
    });

    it('should return false for invalid channel types', () => {
      expect(isValidChannelType('sms')).toBe(false);
      expect(isValidChannelType('whatsapp')).toBe(false);
      expect(isValidChannelType('')).toBe(false);
      expect(isValidChannelType('TELEGRAM')).toBe(false);
    });
  });

  describe('getAllChannelTypes', () => {
    it('should return all 4 channel types', () => {
      const types = getAllChannelTypes();
      expect(types).toHaveLength(4);
      expect(types).toContain('telegram');
      expect(types).toContain('discord');
      expect(types).toContain('slack');
      expect(types).toContain('email');
    });
  });

  describe('isChannelConnected', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    it('should return false when env var is not set', () => {
      vi.stubEnv('TELEGRAM_BOT_TOKEN', '');
      expect(isChannelConnected('telegram')).toBe(false);
    });

    it('should return true when env var is set', () => {
      vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-token-123');
      expect(isChannelConnected('telegram')).toBe(true);
    });

    it('should return true for email when SENDGRID_API_KEY is set', () => {
      vi.stubEnv('SENDGRID_API_KEY', 'SG.test-key');
      expect(isChannelConnected('email')).toBe(true);
    });
  });
});

