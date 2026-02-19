import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-guard'
import type { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export const POST = withAdminAuth(async (req, { supabase }) => {
    const { command, experimentId } = await req.json()
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
    const metadata = (experiment.metadata as any) || {}
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
        metadata.status = 'design_syncing'
        responseMessage = "Design sync initiated. I'm preparing the Variant B layout."
    } else {
        responseMessage = "Intent received. I'm calculating the optimal design matrix for this variation."
    }

    // 3. Update metadata
    const { error: updateError } = await (db as any)
        .from('experiments')
        .update({ metadata })
        .eq('id', experimentId)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        message: responseMessage,
        metadata
    })
})
