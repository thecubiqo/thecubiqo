'use client'

/**
 * LandingModelFooter
 * 
 * Displays AI model providers in the landing page footer.
 * Controlled by feature flag `ui.showLandingModelFooter` (default: false)
 * 
 * Related PR: #36 (AI model footer on landing)
 */

import React from 'react'
import { motion } from 'framer-motion'

interface LandingModelFooterProps {
  /** Custom model list (defaults to standard providers) */
  models?: string[]
  /** Custom class name for styling */
  className?: string
}

const DEFAULT_MODELS = [
  'OpenAI',
  'Anthropic',
  'Meta Llama',
  'Mistral',
  'Gemini',
  'DeepSeek'
]

export function LandingModelFooter({ 
  models = DEFAULT_MODELS,
  className = ''
}: LandingModelFooterProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      transition={{ delay: 2, duration: 2 }}
      className={`absolute bottom-8 w-full text-center ${className}`}
    >
      <div className="flex justify-center items-center space-x-8 md:space-x-16 text-sm md:text-base font-light tracking-[0.2em] text-gray-400 uppercase">
        {models.map((model, index) => (
          <span key={index}>{model}</span>
        ))}
      </div>
    </motion.div>
  )
}
