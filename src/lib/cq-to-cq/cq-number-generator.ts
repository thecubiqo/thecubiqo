/**
 * CQ Number Generator
 * Generates unique, time-bound, rotating CQ# identifiers
 * Format: CQ-XXXX-XXXX (e.g., CQ-8F3A-2K9B)
 */

import { CQNumber, CQNumberStatus } from './types';

const CQ_PREFIX = 'CQ';
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, I, 1)
const SEGMENT_LENGTH = 4;
const NUM_SEGMENTS = 2;
const DEFAULT_ROTATION_DAYS = 30;

/**
 * Generate a random CQ# string
 */
export function generateCQNumberString(): string {
  const segments: string[] = [];
  
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    let segment = '';
    for (let j = 0; j < SEGMENT_LENGTH; j++) {
      const randomIndex = Math.floor(Math.random() * CHARSET.length);
      segment += CHARSET[randomIndex];
    }
    segments.push(segment);
  }
  
  return `${CQ_PREFIX}-${segments.join('-')}`;
}

/**
 * Validate CQ# format
 */
export function isValidCQNumber(cqNumber: string): boolean {
  const pattern = new RegExp(
    `^${CQ_PREFIX}-[${CHARSET}]{${SEGMENT_LENGTH}}-[${CHARSET}]{${SEGMENT_LENGTH}}$`
  );
  return pattern.test(cqNumber);
}

/**
 * Generate a new CQ number object for a user
 */
export function createCQNumber(
  userId: string,
  rotationIntervalDays: number = DEFAULT_ROTATION_DAYS
): Omit<CQNumber, 'id'> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + rotationIntervalDays * 24 * 60 * 60 * 1000);
  
  return {
    cqNumber: generateCQNumberString(),
    userId,
    createdAt: now,
    expiresAt,
    status: 'active',
    rotationInterval: rotationIntervalDays * 24 * 60 * 60 * 1000,
  };
}

/**
 * Check if a CQ# needs rotation
 */
export function shouldRotateCQNumber(cqNumber: CQNumber): boolean {
  if (cqNumber.status === 'blocked') return false;
  
  const now = new Date();
  const timeUntilExpiry = cqNumber.expiresAt.getTime() - now.getTime();
  
  // Start rotation process 24 hours before expiry
  const rotationThreshold = 24 * 60 * 60 * 1000;
  
  return timeUntilExpiry <= rotationThreshold;
}

/**
 * Check if a CQ# has expired
 */
export function isCQNumberExpired(cqNumber: CQNumber): boolean {
  return new Date() > cqNumber.expiresAt;
}

/**
 * Get time remaining until rotation
 */
export function getTimeUntilRotation(cqNumber: CQNumber): number {
  const now = new Date();
  return Math.max(0, cqNumber.expiresAt.getTime() - now.getTime());
}

/**
 * Format time remaining as human-readable string
 */
export function formatRotationTime(milliseconds: number): string {
  const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
  const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return 'less than 1 hour';
}

/**
 * Generate collision-resistant hash for global uniqueness
 * Combines timestamp, random data, and optional user salt
 */
export function generateCQHash(userId?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const userSalt = userId ? userId.substring(0, 8) : '';
  
  return `${timestamp}-${random}-${userSalt}`.substring(0, 32);
}

/**
 * Calculate entropy of CQ# system
 * Total possible combinations: CHARSET^(SEGMENT_LENGTH * NUM_SEGMENTS)
 */
export function getCQNumberEntropy(): {
  totalCombinations: number;
  bitsOfEntropy: number;
} {
  const totalCombinations = Math.pow(CHARSET.length, SEGMENT_LENGTH * NUM_SEGMENTS);
  const bitsOfEntropy = Math.log2(totalCombinations);
  
  return {
    totalCombinations,
    bitsOfEntropy,
  };
}

/**
 * Format CQ# for display with optional masking
 */
export function formatCQNumber(cqNumber: string, masked: boolean = false): string {
  if (!isValidCQNumber(cqNumber)) {
    return cqNumber;
  }
  
  if (masked) {
    // Show only last 4 characters: CQ-****-2K9B
    const parts = cqNumber.split('-');
    return `${parts[0]}-****-${parts[2]}`;
  }
  
  return cqNumber;
}

/**
 * Parse CQ# from user input (handles various formats)
 */
export function parseCQNumberInput(input: string): string | null {
  // Remove whitespace and convert to uppercase
  let cleaned = input.trim().toUpperCase().replace(/\s/g, '');
  
  // Add CQ- prefix if missing
  if (!cleaned.startsWith(CQ_PREFIX)) {
    cleaned = `${CQ_PREFIX}-${cleaned}`;
  }
  
  // Add hyphens if missing
  if (!cleaned.includes('-')) {
    // Assume format: CQXXXXXXXX
    const withoutPrefix = cleaned.substring(CQ_PREFIX.length);
    if (withoutPrefix.length === SEGMENT_LENGTH * NUM_SEGMENTS) {
      const segments = [
        withoutPrefix.substring(0, SEGMENT_LENGTH),
        withoutPrefix.substring(SEGMENT_LENGTH),
      ];
      cleaned = `${CQ_PREFIX}-${segments.join('-')}`;
    }
  }
  
  // Validate and return
  return isValidCQNumber(cleaned) ? cleaned : null;
}

/**
 * Generate QR code data for CQ#
 */
export function generateCQNumberQRData(cqNumber: string, displayName?: string): string {
  const data = {
    type: 'cubiqo_cq',
    cq: cqNumber,
    name: displayName,
    version: 1,
  };
  
  return JSON.stringify(data);
}

/**
 * Generate shareable CQ# link
 */
export function generateCQNumberLink(cqNumber: string): string {
  return `https://cubiqo.com/add/${cqNumber}`;
}
