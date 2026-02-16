
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    CODING_AGENT_PROMPT,
    parseCodingMarkers,
    buildMessages,
    parseResponse,
    MINIMAX_CONFIG,
    type ChatRequest,
    type AIResponse
} from '@/lib/ai'
import { callOpenClaw } from '@/lib/ai/openclaw'
import { callMiniMax } from '@/lib/ai/minimax'

// Server-side Supabase client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL1 || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY1 || 'placeholder-key'
)

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest & { sessionId?: string; files?: Record<string, string> } = await request.json()
        const { message, conversationHistory = [], sessionId, files = {} } = body

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 })
        }

        // 1. Build context with virtual files
        const fileContext = Object.entries(files).map(([path, content]) =>
            `File: ${path}\n\`\`\`\n${content}\n\`\`\``
        ).join('\n\n')

        const fullSystemPrompt = CODING_AGENT_PROMPT +
            "\n\n--- CURRENT VIRTUAL WORKSPACE ---\n" +
            (fileContext || "(Workspace is empty)") +
            "\n\nRemember: When you write files using [FILE:write:...], they are saved to this virtual workspace."

        // 2. Call AI (MiniMax is best for coding)
        const messages = buildMessages(message, conversationHistory, 'RED') // Red for coding/focus mode

        let content = ""
        try {
            content = await callMiniMax(fullSystemPrompt, messages)
        } catch (e) {
            console.warn('MiniMax failed for coding, falling back to OpenClaw', e)
            content = await callOpenClaw(fullSystemPrompt, messages)
        }

        // 3. Parse and execute file operations
        const { text, codeBlocks } = parseCodingMarkers(content)
        const updatedFiles = { ...files }
        const operations: string[] = []

        for (const block of codeBlocks) {
            if (block.type === 'file') {
                if (block.operation === 'write' && block.path) {
                    updatedFiles[block.path] = block.code
                    operations.push(`wrote ${block.path}`)

                    // Persist to DB (VFS)
                    if (sessionId) {
                        const { error } = await supabaseAdmin
                            .from('memory')
                            .upsert({
                                session_id: sessionId,
                                zone: `vfs_${sessionId}`,
                                key: block.path,
                                value: block.code
                            }, { onConflict: 'session_id, zone, key' })

                        if (error) console.error('Failed to save VFS file', error)
                    }
                } else if (block.operation === 'delete' && block.path) {
                    delete updatedFiles[block.path]
                    operations.push(`deleted ${block.path}`)

                    if (sessionId) {
                        await supabaseAdmin
                            .from('memory')
                            .delete()
                            .eq('session_id', sessionId)
                            .eq('zone', `vfs_${sessionId}`)
                            .eq('key', block.path)
                    }
                }
            }
        }

        // 4. Return response + updated file state
        return NextResponse.json({
            response: text,
            files: updatedFiles,
            operations,
            provider: 'minimax'
        })

    } catch (error) {
        console.error('Coder API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
