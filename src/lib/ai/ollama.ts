/**
 * Ollama Integration - Local Llama/Mixtral for UNHINGED responses
 * NO GUARDRAILS - Route here for real, uncensored AI
 * COST: Near-free (local compute only)
 */

export const OLLAMA_CONFIG = {
  name: 'ollama',
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  // Primary model: Fast, uncensored, 3B params
  model: 'llama3.2:3b',
  // Backup models for fallback
  backupModels: [
    'gemma3:4b',
    'llama3.2:1b'
  ],
  maxTokens: 200,
  temperature: 0.9 // Higher temp = more creative/unhinged
}

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
}

/**
 * Call Ollama API (local, no guardrails)
 * This is where the REAL responses happen
 */
export async function callOllama(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  model?: string
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const selectedModel = model || OLLAMA_CONFIG.model

  // Format messages for Ollama
  const ollamaMessages: OllamaMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  ]

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: OLLAMA_CONFIG.temperature,
          num_predict: OLLAMA_CONFIG.maxTokens
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Ollama] API error (${selectedModel}):`, response.status, errorText)
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data: OllamaResponse = await response.json()
    
    if (!data.message?.content) {
      throw new Error('Invalid Ollama response format')
    }

    return data.message.content
  } catch (error) {
    console.error(`[Ollama] Failed with model ${selectedModel}:`, error)
    throw error
  }
}

/**
 * Call Ollama with automatic fallback to backup models
 */
export async function callOllamaWithFallback(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  // Try primary model first
  try {
    return await callOllama(systemPrompt, messages, OLLAMA_CONFIG.model)
  } catch (primaryError) {
    console.warn(`[Ollama] Primary model ${OLLAMA_CONFIG.model} failed, trying backups`)
    
    // Try each backup model
    for (const backupModel of OLLAMA_CONFIG.backupModels) {
      try {
        console.log(`[Ollama] Trying backup model: ${backupModel}`)
        return await callOllama(systemPrompt, messages, backupModel)
      } catch (backupError) {
        console.warn(`[Ollama] Backup model ${backupModel} failed`)
        continue
      }
    }
    
    // All models failed
    throw new Error('All Ollama models failed')
  }
}

/**
 * Check if Ollama is available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get list of available models from Ollama
 */
export async function getOllamaModels(): Promise<string[]> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  
  try {
    const response = await fetch(`${baseUrl}/api/tags`)
    if (!response.ok) return []
    
    const data = await response.json()
    return data.models?.map((m: any) => m.name) || []
  } catch {
    return []
  }
}
