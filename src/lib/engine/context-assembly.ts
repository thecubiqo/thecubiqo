import { Message } from '@/types/session'
import { ToolDefinition } from '@/types/tool'
import { ModelConfig } from '@/types/agent'
import { countConversationTokens } from '@/lib/utils/token-counter'
import { searchMemory, MemorySearchResult } from './memory'

export interface AssembleOptions {
  history: Message[]
  tools: ToolDefinition[]
  userPrompt: string
  includeMemory?: boolean
}

export interface AssembledContext {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  systemPrompt: string
  tokenEstimate: number
  memoryHits: number
}

export class ContextAssembler {
  private agentId: string
  private soul: string
  private workspace: string
  private model: ModelConfig

  constructor(config: {
    agentId: string
    soul: string
    workspace: string
    model: ModelConfig
  }) {
    this.agentId = config.agentId
    this.soul = config.soul
    this.workspace = config.workspace
    this.model = config.model
  }

  private buildSystemPrompt(tools: ToolDefinition[]): string {
    let prompt = this.soul + '\n\n'
    prompt += '# Available Tools\n'
    tools.forEach((tool) => {
      prompt += `- ${tool.name}: ${tool.description}\n`
    })
    prompt += '\n# Workspace\n'
    prompt += `Your workspace is at: ${this.workspace}\n`
    prompt += 'All file operations are relative to this directory.\n'
    return prompt
  }

  private async retrieveMemories(userPrompt: string): Promise<MemorySearchResult[]> {
    try {
      const memories = await searchMemory(this.agentId, userPrompt, { limit: 5 })
      return memories
    } catch (error) {
      console.error('Failed to retrieve memories:', error)
      return []
    }
  }

  async assemble(options: AssembleOptions): Promise<AssembledContext> {
    const { history, tools, userPrompt, includeMemory = true } = options

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(tools)

    // Retrieve relevant memories if enabled
    let memories: MemorySearchResult[] = []
    if (includeMemory) {
      memories = await this.retrieveMemories(userPrompt)
    }

    // Construct messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ]

    // Add history
    history.forEach((msg) => {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      })
    })

    // Add user prompt
    messages.push({ role: 'user', content: userPrompt })

    // Calculate token estimate
    const tokenEstimate = countConversationTokens(
      messages.map(m => ({ role: m.role, content: m.content }))
    )

    return {
      messages,
      systemPrompt,
      tokenEstimate,
      memoryHits: memories.length
    }
  }
}
