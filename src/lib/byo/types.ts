/**
 * BYO (Bring Your Own) API Keys Types
 */

export interface BYOConfig {
  enabled: boolean
  claudeApiKey: string | null
  openaiApiKey?: string | null
}

export const BYO_STORAGE_KEY = 'cubiqo_byo_config'

export const defaultBYOConfig: BYOConfig = {
  enabled: false,
  claudeApiKey: null,
  openaiApiKey: null,
}
