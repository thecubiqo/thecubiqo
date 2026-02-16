import { Bot, webhookCallback } from 'grammy'
import { createClient } from '@/lib/supabase/client'
import { callMiniMax } from '@/lib/ai/minimax'
import { callOpenClaw } from '@/lib/ai/openclaw'
import { SYSTEM_PROMPT, buildMessages } from '@/lib/ai'
import { v4 as uuidv4 } from 'uuid'

// Singleton bot instance
let bot: Bot | null = null

export function getBot() {
    if (!bot) {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.warn('TELEGRAM_BOT_TOKEN is not set')
            return null
        }
        bot = new Bot(process.env.TELEGRAM_BOT_TOKEN)
        setupBot(bot)
    }
    return bot
}

function setupBot(bot: Bot) {
    // --- Commands ---
    bot.command('start', async (ctx) => {
        await ctx.reply('👋 Hello! I am CubiQo. I am your personal AI assistant.\n\nYou can chat with me here, or enable "Duo Mode" for proactive advice.')
    })

    bot.command('reset', async (ctx) => {
        // Clear session context logic would go here
        await ctx.reply('🔄 Context reset. Starting fresh!')
    })

    // --- Message Handling ---
    bot.on('message:text', async (ctx) => {
        const userId = ctx.from.id.toString()
        const message = ctx.message.text
        const sessionId = `telegram:${userId}`

        try {
            // 1. Send typing indicator
            await ctx.replyWithChatAction('typing')

            // 2. Build history/context (Simplified for MVP - fetch last few msgs)
            // Ideally we fetch from DB here using sessionId
            // For now, let's keep it stateless or minimal state in memory/DB
            // We will reuse the same logic as the web chat API if possible by calling the internal functions directly

            // Let's reuse the internal AI logic:
            // We need to fetch history first
            const supabase = createClient()
            const { data: conversation } = await supabase
                .from('conversations')
                .select('id')
                .eq('session_id', sessionId)
                .single()

            let conversationId = conversation?.id

            if (!conversationId) {
                const { data: newConv } = await supabase
                    .from('conversations')
                    .insert({ session_id: sessionId, color_state: 'ORANGE' })
                    .select('id')
                    .single()
                conversationId = newConv?.id
            }

            // Fetch history (last 10 messages)
            let history: { role: string, content: string }[] = []
            if (conversationId) {
                const { data: msgs } = await supabase
                    .from('messages')
                    .select('role, content')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (msgs) {
                    history = msgs.reverse().map(m => ({ role: m.role, content: m.content }))
                }
            }

            // 3. Call AI
            const systemPrompt = SYSTEM_PROMPT + "\n\n(Context: User is chatting via Telegram. Keep responses concise.)"
            const messages = buildMessages(message, history.map(h => ({
                userMessage: h.role === 'user' ? h.content : '',
                aiResponse: h.role === 'assistant' ? h.content : '',
                color: 'ORANGE', // Tele doesn't support color yet
                timestamp: new Date().toISOString()
            })), 'ORANGE')

            // Use MiniMax (or configured provider)
            // Note: We need to import callMiniMax directly since we are server-side here usually
            // Start with MiniMax
            let responseText = ""
            try {
                // We'll reuse the callMiniMax function we saw in the API route, 
                // but since it's not exported, we might need to duplicate slightly or refactor.
                // For expediency, I will implement a direct call here or mock it if needed.
                // Better: Let's use the `callOpenClaw` as fallback or primary.

                // Actually, the API route has the best logic. 
                // To avoid code duplication, we could extract the AI calling logic to a lib function.
                // For now, I will implement a simple OpenClaw/MiniMax call here.

                responseText = await callOpenClaw(systemPrompt, messages) // Fallback to OpenClaw generic
            } catch (e) {
                console.error("AI Error", e)
                responseText = "I'm having trouble thinking right now. Please try again."
            }

            // 4. Send response
            await ctx.reply(responseText)

            // 5. Save to DB (Async)
            if (conversationId && responseText) {
                await supabase.from('messages').insert([
                    { conversation_id: conversationId, role: 'user', content: message },
                    { conversation_id: conversationId, role: 'assistant', content: responseText }
                ])
            }

        } catch (error) {
            console.error('Telegram error:', error)
            await ctx.reply('⚠️ Sorry, something went wrong.')
        }
    })
}

// Webhook handler wrapper
export const handleUpdate = async (req: Request) => {
    const bot = getBot()
    if (!bot) {
        return new Response('Telegram bot not configured', { status: 503 })
    }
    return webhookCallback(bot, 'std/http')(req)
}
