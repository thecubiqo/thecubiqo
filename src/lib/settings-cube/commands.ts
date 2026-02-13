/**
 * Settings Cube Commands
 * Parse and execute cube configuration commands
 */

import type { CubeConfig } from './types'

export interface ParsedCommand {
  name: string
  args: unknown[]
}

/**
 * Parse command string into name and arguments
 * Example: "cubiqo.color.lock('RED')" => { name: 'cubiqo.color.lock', args: ['RED'] }
 */
export function parseCommand(input: string): ParsedCommand | null {
  const match = input.match(/^([\w.]+)\((.*)?\)$/)
  if (!match) return null

  const name = match[1]
  const argsStr = match[2]?.trim() || ''

  if (!argsStr) {
    return { name, args: [] }
  }

  try {
    // Replace single quotes with double quotes for JSON parsing
    const jsonStr = `[${argsStr.replace(/'/g, '"')}]`
    const args = JSON.parse(jsonStr)
    return { name, args }
  } catch {
    return null
  }
}

/**
 * Execute a parsed command and return updated config
 */
export function executeCommand(
  parsed: ParsedCommand,
  config: CubeConfig
): CubeConfig | null {
  switch (parsed.name) {
    case 'cubiqo.color.lock': {
      const color = parsed.args[0] as CubeConfig['color']
      if (['RED', 'YELLOW', 'GREEN_BLUE', 'ORANGE'].includes(color)) {
        return { ...config, color }
      }
      return null
    }

    case 'cubiqo.animation.set': {
      const animation = parsed.args[0] as CubeConfig['animation']
      if (['idle', 'listening', 'thinking', 'speaking'].includes(animation)) {
        return { ...config, animation }
      }
      return null
    }

    case 'cubiqo.voice.set': {
      const voice = parsed.args[0] as Partial<CubeConfig['voice']>
      if (typeof voice === 'object') {
        return { ...config, voice: { ...config.voice, ...voice } }
      }
      return null
    }

    case 'cubiqo.theme.set': {
      const theme = parsed.args[0] as CubeConfig['theme']
      if (['dark', 'light'].includes(theme)) {
        return { ...config, theme }
      }
      return null
    }

    case 'cubiqo.reset': {
      return {
        color: 'ORANGE',
        animation: 'idle',
        voice: { accent: 'american', speed: 1.0 },
        theme: 'dark',
      }
    }

    default:
      return null
  }
}
