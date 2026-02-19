import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
    try {
        const { command, experimentId } = await req.json()
        const supabase = await createClient()
        const db = supabase as unknown as SupabaseClient<Database>

        // 1. Get current experiment
        const { data: experiment, error: fetchError } = await (db as any)
            .from('experiments')
            .select('*')
            .eq('id', experimentId)
            .single()

        if (fetchError || !experiment) {
            return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
        }

        // 2. "CubiQo Agent" Intent Parsing (Simplified for demo, but extensible)
        // In a full implementation, this would call an LLM to parse the intent.
        // For now, we'll use a rule-based parser that handles typical "design" requests.

        const metadata = (experiment.metadata as any) || {}
        const assets = metadata.assets || {}
        let responseMessage = ""

        const cmd = command.toLowerCase()

        if (cmd.includes('neon') || cmd.includes('glow')) {
            metadata.theme = 'neon'
            metadata.effects = [...(metadata.effects || []), 'glow']
            responseMessage = "Applying Neuro-Neon aesthetic to Variant B. Pulsing glow active."
        } else if (cmd.includes('minimal')) {
            metadata.theme = 'minimal'
            metadata.effects = []
            responseMessage = "Clean flow initiated. Minimalist constraints applied to Variant B."
        } else if (cmd.includes('blur')) {
            metadata.effects = [...(metadata.effects || []), 'glassmorphism']
            responseMessage = "Glassmorphism layer injected. Variant B blurred."
        } else if (cmd.includes('design') && (cmd.includes('b') || cmd.includes('challenger'))) {
            // Assume they mean general design update
            metadata.status = 'design_syncing'
            responseMessage = "Design sync initiated. I'm preparing the Variant B layout."
        } else {
            // Default "Thinking" response
            responseMessage = "Intent received. I'm calculating the optimal design matrix for this variation."
        }

        // 3. Update metadata
        const { error: updateError } = await (db as any)
            .from('experiments')
            .update({ metadata })
            .eq('id', experimentId)

        if (updateError) {
            throw updateError
        }

        return NextResponse.json({
            success: true,
            message: responseMessage,
            metadata
        })

    } catch (error: any) {
        console.error('Agentic Command Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
