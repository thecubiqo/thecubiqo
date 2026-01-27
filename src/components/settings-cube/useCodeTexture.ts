'use client'

/**
 * useCodeTexture Hook
 * Creates dynamic canvas texture with command history
 */

import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { SettingsCommand, CubeConfig } from '@/lib/settings-cube/types'

interface UseCodeTextureOptions {
  commands: SettingsCommand[]
  config?: CubeConfig
  type: 'commands' | 'config'
}

export function useCodeTexture({ commands, config, type }: UseCodeTextureOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  // Create canvas once
  const canvas = useMemo(() => {
    if (typeof document === 'undefined') return null
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    canvasRef.current = c
    return c
  }, [])

  // Create texture once
  const texture = useMemo(() => {
    if (!canvas) return null
    const t = new THREE.CanvasTexture(canvas)
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    textureRef.current = t
    return t
  }, [canvas])

  // Update canvas when data changes
  useEffect(() => {
    if (!canvas || !texture) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear with dark background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 512, 512)

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 255, 0, 0.03)'
    ctx.fillRect(0, 0, 512, 512)

    // Scanline effect
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)'
    for (let y = 0; y < 512; y += 4) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(512, y)
      ctx.stroke()
    }

    if (type === 'commands') {
      drawCommands(ctx, commands)
    } else if (type === 'config' && config) {
      drawConfig(ctx, config)
    }

    // Mark texture for update
    texture.needsUpdate = true
  }, [commands, config, type, canvas, texture])

  return texture
}

function drawCommands(ctx: CanvasRenderingContext2D, commands: SettingsCommand[]) {
  // Header
  ctx.fillStyle = '#666666'
  ctx.font = '12px monospace'
  ctx.fillText('// command_history.log', 20, 25)

  // Draw last 15 commands
  const displayCommands = commands.slice(-15)
  displayCommands.forEach((cmd, i) => {
    const y = 50 + i * 28

    // Status indicator
    ctx.fillStyle =
      cmd.status === 'success' ? '#00ff00' :
      cmd.status === 'error' ? '#ff4444' :
      cmd.status === 'executing' ? '#ffff00' :
      '#888888'
    ctx.fillText(cmd.status === 'executing' ? '>' : cmd.status === 'success' ? '✓' : cmd.status === 'error' ? '✗' : '○', 20, y)

    // Timestamp
    ctx.fillStyle = '#444444'
    ctx.font = '10px monospace'
    const time = cmd.timestamp.toLocaleTimeString('en-US', { hour12: false })
    ctx.fillText(time.split(':').slice(0, 2).join(':'), 40, y)

    // Command text
    ctx.fillStyle = '#00ff00'
    ctx.font = '13px monospace'
    const displayCode = cmd.code.length > 28 ? cmd.code.slice(0, 25) + '...' : cmd.code
    ctx.fillText(displayCode, 85, y)
  })

  // Cursor blink
  if (displayCommands.length < 15) {
    const cursorY = 50 + displayCommands.length * 28
    ctx.fillStyle = '#00ff00'
    ctx.fillText('_', 20, cursorY)
  }
}

function drawConfig(ctx: CanvasRenderingContext2D, config: CubeConfig) {
  // Header
  ctx.fillStyle = '#666666'
  ctx.font = '12px monospace'
  ctx.fillText('// cubiqo.config.ts', 20, 25)

  // Config object
  ctx.fillStyle = '#00ff00'
  ctx.font = '13px monospace'

  const lines = [
    'export const config = {',
    `  color: '${config.color}',`,
    `  animation: '${config.animation}',`,
    '  voice: {',
    `    accent: '${config.voice.accent}',`,
    `    speed: ${config.voice.speed},`,
    '  },',
    `  theme: '${config.theme}',`,
    '};',
  ]

  lines.forEach((line, i) => {
    const y = 50 + i * 28

    // Syntax highlighting
    if (line.includes('export') || line.includes('const')) {
      ctx.fillStyle = '#ff79c6' // Pink for keywords
    } else if (line.includes(':')) {
      ctx.fillStyle = '#8be9fd' // Cyan for keys
    } else {
      ctx.fillStyle = '#00ff00'
    }

    // Draw line with proper indentation
    ctx.fillText(line, 20, y)
  })

  // Status line
  ctx.fillStyle = '#444444'
  ctx.font = '10px monospace'
  ctx.fillText(`Last updated: ${new Date().toLocaleTimeString()}`, 20, 320)
}
