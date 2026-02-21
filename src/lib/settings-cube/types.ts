/**
 * Settings Cube Types
 */

export interface SettingsCommand {
  id: string
  timestamp: Date
  code: string
  status: 'pending' | 'executing' | 'success' | 'error'
}

export interface CubeConfig {
  color: 'RED' | 'YELLOW' | 'TEAL' | 'ORANGE'
  animation: 'idle' | 'listening' | 'thinking' | 'speaking'
  voice: {
    accent: string
    speed: number
  }
  theme: 'dark' | 'light'
}

export const DEFAULT_CONFIG: CubeConfig = {
  color: 'ORANGE',
  animation: 'idle',
  voice: { accent: 'american', speed: 1.0 },
  theme: 'dark',
}
