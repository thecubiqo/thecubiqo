/**
 * Validation Schemas using Zod
 * 
 * Centralized input validation schemas for API endpoints.
 * All user inputs MUST be validated before processing.
 * 
 * Usage:
 * ```typescript
 * import { journalEntrySchema } from '@/lib/validation/schemas'
 * 
 * const result = journalEntrySchema.safeParse(request.body)
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error.errors }, { status: 400 })
 * }
 * const validData = result.data
 * ```
 */

import { z } from 'zod'

/**
 * Common field validators
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')
export const emailSchema = z.string().email('Invalid email address')
export const urlSchema = z.string().url('Invalid URL format')

/**
 * Pagination schemas
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().optional()
})

/**
 * Date range filters
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  days: z.coerce.number().int().positive().max(365).optional()
})

/**
 * Journal Entry Validation
 */
export const journalEntrySchema = z.object({
  content: z.string()
    .min(1, 'Journal entry cannot be empty')
    .max(50000, 'Journal entry too long'),
  mood: z.enum(['happy', 'sad', 'neutral', 'anxious', 'excited', 'angry', 'calm'])
    .optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPrivate: z.boolean().default(true)
})

export const journalEntryUpdateSchema = journalEntrySchema.partial()

/**
 * Admin Analytics Query Params
 */
export const adminAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

/**
 * Feature Flag Validation
 */
export const featureFlagSchema = z.object({
  key: z.string()
    .min(1, 'Feature flag key required')
    .max(100, 'Key too long')
    .regex(/^[a-z0-9_-]+$/, 'Key must contain only lowercase letters, numbers, hyphens, and underscores'),
  enabled: z.boolean(),
  description: z.string().max(500).optional(),
  rolloutPercentage: z.number().min(0).max(100).optional()
})

/**
 * User Profile Validation
 */
export const userProfileSchema = z.object({
  displayName: z.string()
    .min(1, 'Display name required')
    .max(100, 'Display name too long')
    .optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatarUrl: urlSchema.optional(),
  timezone: z.string().max(50).optional()
})

/**
 * API Key Validation
 */
export const apiKeySchema = z.object({
  name: z.string()
    .min(1, 'API key name required')
    .max(100, 'Name too long'),
  scopes: z.array(z.string()).min(1, 'At least one scope required'),
  expiresAt: z.string().datetime().optional()
})

/**
 * Webhook Validation
 */
export const webhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.string()).min(1, 'At least one event required'),
  secret: z.string().min(16, 'Webhook secret must be at least 16 characters'),
  enabled: z.boolean().default(true)
})

/**
 * Message/Chat Validation
 */
export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long'),
  sessionId: uuidSchema.optional(),
  metadata: z.record(z.any()).optional()
})

/**
 * File Upload Validation
 */
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename required')
    .max(255, 'Filename too long'),
  contentType: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid content type'),
  size: z.number().positive().max(10 * 1024 * 1024, 'File too large (max 10MB)')
})

/**
 * Search Query Validation
 */
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, 'Search query required')
    .max(500, 'Search query too long'),
  filters: z.record(z.any()).optional(),
  ...paginationSchema.shape
})

/**
 * Helper function to validate and return errors
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Helper to extract and format validation errors for API responses
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
}
