'use client'

import { createClient } from '@/lib/supabase/client'

export async function updateExperimentMetadata(experimentId: string, metadata: any) {
    const supabase = createClient()
    const { error } = await (supabase as any)
        .from('experiments')
        .update({ metadata })
        .eq('id', experimentId)

    if (error) {
        console.error('Error updating metadata:', error)
        throw error
    }
}
