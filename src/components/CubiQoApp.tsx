'use client'

/**
 * CubiQoApp - Main application with Cube + Chat + Auth
 */

import { useState, useCallback, useEffect } from 'react'
import { CubeScene } from './cube'
import { ChatContainer } from './chat'
import { LoginForm, AuthStatus } from './auth'
import { AuthButton } from './AuthButton.client'
import { CubeControls, type CubeShape } from './CubeControls'
import { useSession } from '@/hooks/useSession'
import { useAuth } from '@/hooks/useAuth'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './cube/Cube'

// LocalStorage keys
const STORAGE_KEYS = {
  CUBE_SIZE: 'cubiqo_cube_size',
  SHAPE_TYPE: 'cubiqo_shape_type',
  SHOW_EYES: 'cubiqo_show_eyes',
}

export function CubiQoApp() {
  const { session, isGuest } = useSession()
  const { user, isAuthenticated, signOut } = useAuth()
  const [colorName, setColorName] = useState<ColorName>('ORANGE')
  const [animationState, setAnimationState] = useState<AnimationState>('idle')
  const [showAuth, setShowAuth] = useState(false)

  // Cube customization state
  const [cubeSize, setCubeSize] = useState<number>(1.0)
  const [shapeType, setShapeType] = useState<CubeShape>('energy')
  const [showEyes, setShowEyes] = useState<boolean>(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem(STORAGE_KEYS.CUBE_SIZE)
      const savedShape = localStorage.getItem(STORAGE_KEYS.SHAPE_TYPE)
      const savedEyes = localStorage.getItem(STORAGE_KEYS.SHOW_EYES)

      if (savedSize) setCubeSize(parseFloat(savedSize))
      if (savedShape) setShapeType(savedShape as CubeShape)
      if (savedEyes) setShowEyes(savedEyes === 'true')
    }
  }, [])

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CUBE_SIZE, cubeSize.toString())
      localStorage.setItem(STORAGE_KEYS.SHAPE_TYPE, shapeType)
      localStorage.setItem(STORAGE_KEYS.SHOW_EYES, showEyes.toString())
    }
  }, [cubeSize, shapeType, showEyes])

  const handleColorChange = useCallback((newColor: ColorName) => {
    setColorName(newColor)
  }, [])

  const handleSpeakingChange = useCallback((isSpeaking: boolean) => {
    setAnimationState(isSpeaking ? 'speaking' : 'idle')
  }, [])

  const handleSizeChange = useCallback((size: number) => {
    setCubeSize(size)
  }, [])

  const handleShapeChange = useCallback((shape: CubeShape) => {
    setShapeType(shape)
  }, [])

  const handleEyesToggle = useCallback((show: boolean) => {
    setShowEyes(show)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              CubiQo
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              One Mind. Many Dimensions.
            </p>
          </div>

          {/* User Status */}
          <div className="flex items-center gap-3">
            <AuthButton
              onSignInClick={() => setShowAuth(!showAuth)}
              onUserClick={() => signOut()}
              isDark={false}
            />
          </div>
        </div>

        {/* Auth Panel (collapsible) */}
        {showAuth && !isAuthenticated && (
          <div className="mb-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  Session Status
                </h3>
                <AuthStatus />
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  Sign In with Magic Link
                </h3>
                <LoginForm />
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Cube + Chat */}
        <div className="grid lg:grid-cols-2 gap-4 max-w-6xl mx-auto">
          {/* Cube Section */}
          <div>
            <div className="w-full h-[300px] lg:h-[400px] rounded-lg overflow-hidden bg-black">
              <CubeScene
                colorName={colorName}
                animationState={animationState}
              />
            </div>

            {/* Color Indicator */}
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Mood:</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{
                  backgroundColor:
                    colorName === 'RED' ? '#C2185B' :
                      colorName === 'YELLOW' ? '#FFA000' :
                        colorName === 'GREEN_BLUE' ? '#00897B' :
                          '#FF6F00'
                }}
              >
                {colorName === 'GREEN_BLUE' ? 'Sattva' :
                  colorName === 'ORANGE' ? 'Fourth Way' :
                    colorName === 'RED' ? 'Tamas' : 'Rajas'}
              </span>
              {isGuest && (
                <span className="text-xs text-zinc-400">(Guest)</span>
              )}
            </div>

            {/* Cube Controls */}
            {/* Cube Controls - Disabled for Energy Cube
            <CubeControls
              cubeSize={cubeSize}
              onSizeChange={handleSizeChange}
              shapeType={shapeType}
              onShapeChange={handleShapeChange}
              showEyes={showEyes}
              onEyesToggle={handleEyesToggle}
            />
            */}
          </div>

          {/* Chat Section */}
          <div>
            <ChatContainer
              sessionId={session?.id ?? null}
              currentColor={colorName}
              onColorChange={handleColorChange}
              onSpeakingChange={handleSpeakingChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-zinc-400">
          🎤 Voice input available in Chrome • Responses are spoken aloud
        </div>
      </main>
    </div>
  )
}
