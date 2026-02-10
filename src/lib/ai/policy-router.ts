
import { callMiniMax } from './minimax'
import { callOpenRouter, OpenRouterMessage } from './openrouter'
import { callOpenClaw } from './openclaw'

export type ZoneColor = 'YELLOW' | 'GREEN' | 'RED'

export interface RouterConfig {
    zone: ZoneColor
    reasoning?: boolean
    // Context for caching/logging
    userId?: string
    sessionId?: string
    isFounder?: boolean
}

// Model Definitions (Centralized)
const MODELS = {
    // Yellow Zone (Cheap/Fast)
    LLAMA_3_70B: 'meta-llama/llama-3.3-70b-instruct',
    QWEN_TURBO: 'qwen/qwen-turbo',
    HAIKU: 'anthropic/claude-3-haiku',

    // Green Zone (Task/Performance)
    MINIMAX_DEFAULT: 'minimax/abab6.5s-chat', // OpenRouter ID or use direct if preferred
    SONNET_3_5: 'anthropic/claude-3.5-sonnet',
    GPT_4O: 'openai/gpt-4o',
    DEEPSEEK_V3: 'deepseek/deepseek-chat',
    GEMINI_PRO_1_5: 'google/gemini-pro-1.5', // specific openrouter slug

    // Red Zone (Permissive)
    MIXTRAL_8X22B: 'mistralai/mixtral-8x22b-instruct',
    LLAMA_UNCENSORED: 'nousresearch/hermes-3-llama-3.1-405b',

    // Reasoning / High-End Fallback
    DEEPSEEK_R1: 'deepseek/deepseek-r1',
    OPUS_3: 'anthropic/claude-3-opus'
}

export class PolicyRouter {

    static async route(
        systemPrompt: string,
        messages: { role: string; content: string }[],
        config: RouterConfig
    ): Promise<string> {
        const { zone, reasoning = false, isFounder = false } = config

        // 0. Founder Escalation (Global): Direct to High-Efficiency Sonnet 3.5
        // This ensures founders always get the top model regardless of session color
        if (isFounder) {
            console.log('[PolicyRouter] Founder escalation -> Claude 3.5 Sonnet')
            const openRouterMsgs = this.formatMsgs(systemPrompt, messages)
            try {
                return (await callOpenRouter(MODELS.SONNET_3_5, openRouterMsgs)).content
            } catch (e) {
                console.warn('[Router] Founder escalation to Sonnet failed, falling back to zone routing...', e)
            }
        }

        // 1. Reasoning Flag Override
        if (reasoning) {
            console.log('[PolicyRouter] Reasoning Flag Active -> Blue Path')
            return this.executeReasoningPath(systemPrompt, messages)
        }

        // 2. Zone Routing
        switch (zone) {
            case 'YELLOW':
                return this.executeYellowPath(systemPrompt, messages)
            case 'RED':
                return this.executeRedPath(systemPrompt, messages)
            case 'GREEN':
            default:
                return this.executeGreenPath(systemPrompt, messages)
        }
    }

    // ------------------------------------------------------------------
    // Paths
    // ------------------------------------------------------------------

    // Yellow: Cheap/Fast -> Llama 3 -> Qwen -> Haiku
    private static async executeYellowPath(sys: string, msgs: any[]): Promise<string> {
        const openRouterMsgs = this.formatMsgs(sys, msgs)

        try {
            // Primary: Llama 3.3 70B
            return (await callOpenRouter(MODELS.LLAMA_3_70B, openRouterMsgs)).content
        } catch (e) {
            console.warn('[Router] Yellow primary failed, fallback to Qwen', e)
            try {
                // Fallback 1: Qwen Turbo
                return (await callOpenRouter(MODELS.QWEN_TURBO, openRouterMsgs)).content
            } catch (e2) {
                console.warn('[Router] Yellow secondary failed, fallback to Haiku', e2)
                // Fallback 2: Haiku
                return (await callOpenRouter(MODELS.HAIKU, openRouterMsgs)).content
            }
        }
    }

    // Green: Task -> MiniMax -> DeepSeek -> Gemini/Opus (Ultimate Fallback)
    private static async executeGreenPath(sys: string, msgs: any[]): Promise<string> {
        const openRouterMsgs = this.formatMsgs(sys, msgs)

        // 1. Primary: MiniMax
        if (process.env.MINIMAX_API_KEY) {
            try {
                return await callMiniMax(sys, msgs)
            } catch (e) {
                console.warn('[Router] Green primary (MiniMax) failed, escalating...', e)
            }
        }

        // 2. Secondary: DeepSeek V3
        try {
            return (await callOpenRouter(MODELS.DEEPSEEK_V3, openRouterMsgs)).content
        } catch (e) {
            console.warn('[Router] Green secondary failed, escalating to High-End', e)
        }

        // 3. Ultimate Fallback: Gemini Pro 1.5 or Opus
        try {
            return (await callOpenRouter(MODELS.GEMINI_PRO_1_5, openRouterMsgs)).content
        } catch (e) {
            console.warn('[Router] Gemini failed, LAST RESORT: OPUS', e)
            try {
                return (await callOpenRouter(MODELS.OPUS_3, openRouterMsgs)).content
            } catch (finalError) {
                console.error('[Router] ALL AI MODELS FAILED', finalError)
                return "I apologize, but my AI core is currently unreachable. Please check your API keys or try again later."
            }
        }
    }

    // Red: Sensitive -> Mixtral -> Llama Uncensored -> Green Path
    private static async executeRedPath(sys: string, msgs: any[]): Promise<string> {
        const openRouterMsgs = this.formatMsgs(sys, msgs)

        try {
            // Primary: Mixtral (Permissive)
            return (await callOpenRouter(MODELS.MIXTRAL_8X22B, openRouterMsgs)).content
        } catch (e) {
            console.warn('[Router] Red primary failed, fallback to Llama Uncensored', e)
            try {
                return (await callOpenRouter(MODELS.LLAMA_UNCENSORED, openRouterMsgs)).content
            } catch (e2) {
                console.warn('[Router] Red path failed completely, escalating to Green Path', e2)
                return this.executeGreenPath(sys, msgs)
            }
        }
    }

    // Reasoning: DeepSeek R1 -> Opus
    private static async executeReasoningPath(sys: string, msgs: any[]): Promise<string> {
        const openRouterMsgs = this.formatMsgs(sys, msgs)

        try {
            return (await callOpenRouter(MODELS.DEEPSEEK_R1, openRouterMsgs)).content
        } catch (e) {
            console.warn('[Router] Reasoning primary failed, fallback to Opus', e)
            return (await callOpenRouter(MODELS.OPUS_3, openRouterMsgs)).content
        }
    }

    // Helper
    private static formatMsgs(sys: string, msgs: any[]): OpenRouterMessage[] {
        return [
            { role: 'system', content: sys },
            ...msgs.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }))
        ]
    }
}
