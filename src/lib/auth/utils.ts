/**
 * Auth utility functions
 */

/**
 * Checks if an error message indicates a rate limit error
 */
export function isRateLimitError(message: string | null | undefined): boolean {
  if (!message) return false
  return message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('too many')
}
