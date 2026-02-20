/**
 * Playbook Schema - Validation for Integration Playbooks
 * 
 * Defines the structure and validation rules for integration playbooks.
 * 
 * @module emergent/integrations/playbook-schema
 */

import { z } from 'zod'

/**
 * Playbook step schema
 */
export const PlaybookStepSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['http', 'transform', 'condition', 'loop', 'secret']),
  config: z.record(z.unknown())
})

/**
 * HTTP step configuration
 */
export const HttpStepConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  timeout: z.number().min(1000).max(60000).optional()
})

/**
 * Transform step configuration
 */
export const TransformStepConfigSchema = z.object({
  input: z.string(),
  output: z.string(),
  transform: z.string() // JavaScript code
})

/**
 * Condition step configuration
 */
export const ConditionStepConfigSchema = z.object({
  condition: z.string(), // JavaScript expression
  onTrue: z.array(PlaybookStepSchema),
  onFalse: z.array(PlaybookStepSchema).optional()
})

/**
 * Loop step configuration
 */
export const LoopStepConfigSchema = z.object({
  collection: z.string(),
  steps: z.array(PlaybookStepSchema)
})

/**
 * Secret step configuration
 */
export const SecretStepConfigSchema = z.object({
  secretKey: z.string(),
  outputVar: z.string()
})

/**
 * Complete playbook schema
 */
export const PlaybookSchema = z.object({
  name: z.string().min(1).max(100),
  service: z.string().min(1).max(50),
  description: z.string().max(500),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  author: z.string().optional(),
  instructions: z.string(),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    required: z.boolean(),
    default: z.unknown().optional(),
    description: z.string().optional()
  })),
  steps: z.array(PlaybookStepSchema),
  errorHandling: z.object({
    retryCount: z.number().min(0).max(5).optional(),
    retryDelay: z.number().min(1000).max(60000).optional(),
    fallback: z.array(PlaybookStepSchema).optional()
  }).optional()
})

/**
 * Validate playbook structure
 */
export function validatePlaybook(playbook: unknown): z.infer<typeof PlaybookSchema> {
  return PlaybookSchema.parse(playbook)
}

/**
 * Validate playbook step
 */
export function validateStep(step: unknown): z.infer<typeof PlaybookStepSchema> {
  return PlaybookStepSchema.parse(step)
}

/**
 * Get step config schema by type
 */
export function getStepConfigSchema(type: string) {
  switch (type) {
    case 'http':
      return HttpStepConfigSchema
    case 'transform':
      return TransformStepConfigSchema
    case 'condition':
      return ConditionStepConfigSchema
    case 'loop':
      return LoopStepConfigSchema
    case 'secret':
      return SecretStepConfigSchema
    default:
      throw new Error(`Unknown step type: ${type}`)
  }
}
