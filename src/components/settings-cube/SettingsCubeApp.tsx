'use client'

/**
 * Settings Cube App
 * Main component combining 3D cube with command interface
 */

import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei'
import { SettingsCube } from './SettingsCube'
import { CommandInput } from './CommandInput'
import { parseCommand, executeCommand } from '@/lib/settings-cube/commands'
import { DEFAULT_CONFIG } from '@/lib/settings-cube/types'
import type { CubeConfig, SettingsCommand } from '@/lib/settings-cube/types'

export function SettingsCubeApp() {
  const [config, setConfig] = useState<CubeConfig>(DEFAULT_CONFIG)
  const [commands, setCommands] = useState<SettingsCommand[]>([])

  const handleExecute = useCallback((input: string) => {
    const newCommand: SettingsCommand = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      code: input,
      status: 'executing',
    }

    // Add command immediately with 'executing' status
    setCommands(prev => [...prev, newCommand])

    // Execute after short delay for visual effect
    setTimeout(() => {
      const parsed = parseCommand(input)

      if (!parsed) {
        // Parse error
        setCommands(prev =>
          prev.map(cmd =>
            cmd.id === newCommand.id ? { ...cmd, status: 'error' } : cmd
          )
        )
        return
      }

      const newConfig = executeCommand(parsed, config)

      if (newConfig) {
        // Success
        setConfig(newConfig)
        setCommands(prev =>
          prev.map(cmd =>
            cmd.id === newCommand.id ? { ...cmd, status: 'success' } : cmd
          )
        )
      } else {
        // Unknown command or invalid args
        setCommands(prev =>
          prev.map(cmd =>
            cmd.id === newCommand.id ? { ...cmd, status: 'error' } : cmd
          )
        )
      }
    }, 300)
  }, [config])

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-green-900/50 bg-black/80">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wider">Settings Cube</h1>
            <p className="text-xs text-green-600/80 mt-1">
              Real-time configuration interface
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">color:</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor:
                    config.color === 'RED' ? '#c2185b' :
                    config.color === 'YELLOW' ? '#ffa000' :
                    config.color === 'GREEN_BLUE' ? '#00897b' :
                    '#ff6f00',
                }}
              >
                {config.color}
              </span>
            </div>
            <div className="text-green-600/60 text-xs mt-1">
              animation: {config.animation}
            </div>
          </div>
        </div>
      </header>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: '#000' }}
        >
          <ambientLight intensity={0.4} />
          <spotLight
            position={[5, 8, 5]}
            intensity={0.6}
            castShadow
          />
          <spotLight
            position={[-5, 5, 5]}
            intensity={0.3}
            color="#00ff00"
          />

          <SettingsCube config={config} commands={commands} />

          <ContactShadows
            position={[0, -1.8, 0]}
            opacity={0.4}
            scale={6}
            blur={2}
            far={4}
          />

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={4}
            maxDistance={10}
            autoRotate={false}
          />

          <Environment preset="night" />
        </Canvas>

        {/* Command count indicator */}
        <div className="absolute top-4 left-4 text-xs text-green-600/60">
          {commands.length} commands executed
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 text-xs text-green-600/40">
          Drag to rotate | Scroll to zoom
        </div>
      </div>

      {/* Command Input */}
      <CommandInput onExecute={handleExecute} />
    </div>
  )
}
