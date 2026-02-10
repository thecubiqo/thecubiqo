'use client'

import { createClient } from '@/lib/supabase/client'
import { DatabaseWithAbTesting } from '@/types/database.types'

export async function updateExperimentMetadata(experimentId: string, metadata: any) {
    const supabase = createClient()
    const { error } = await supabase
        .from('experiments')
        .update({ metadata })
        .eq('id', experimentId)

    if (error) {
        console.error('Error updating metadata:', error)
        throw error
    }
}
