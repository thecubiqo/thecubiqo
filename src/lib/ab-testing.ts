import { createClient } from '@/lib/supabase/server'
import { DatabaseWithAbTesting } from '@/types/database.types'
import { cookies } from 'next/headers'
import { SupabaseClient } from '@supabase/supabase-js'

type ExperimentVariant = string | null

// Helper to get typed client
async function getDb() {
    const supabase = await createClient()
    return supabase as unknown as SupabaseClient<DatabaseWithAbTesting>
}

/**
 * Server-side function to get or assign a variant for a user/session
 */
export async function getExperimentVariant(experimentName: string): Promise<ExperimentVariant> {
    try {
        const supabase = await getDb()

        // 1. Get the experiment definition
        const { data: experiment, error: expError } = await supabase
            .from('experiments')
            .select('*')
            .eq('name', experimentName)
            .eq('status', 'active')
            .single()

        if (expError || !experiment) {
            console.warn(`Experiment ${experimentName} not found or inactive`)
            return null // Return default/control behavior
        }

        // 2. Identify the user (Auth ID or Session cookie)
        const { data: { user } } = await supabase.auth.getUser()
        const cookieStore = await cookies()
        let sessionId = cookieStore.get('cubiqo_session')?.value

        // If no session ID and no user, we can't reliably track. 
        // In a real app, we might generate a session ID here and set a cookie, 
        // but for now let's rely on existing session mechanisms or just return null.
        if (!sessionId && !user) {
            // Fallback: generate a temp session ID just for this request scope if needed, 
            // but better to just return first variant (Control) without persisting to avoid junk data
            const variants = experiment.variants as string[]
            return variants[0]
        }

        // 3. Check for existing assignment
        let query = supabase
            .from('experiment_assignments')
            .select('variant')
            .eq('experiment_id', experiment.id)

        if (user) {
            query = query.eq('user_id', user.id)
        } else {
            query = query.eq('session_id', sessionId!)
        }

        const { data: existingAssignment } = await query.single()

        if (existingAssignment) {
            return existingAssignment.variant
        }

        // 4. Assign a new variant (Random for now)
        const variants = experiment.variants as string[]
        const randomIndex = Math.floor(Math.random() * variants.length)
        const selectedVariant = variants[randomIndex]

        // 5. Persist assignment
        // Use upsert to handle race conditions safely
        await supabase.from('experiment_assignments').upsert({
            experiment_id: experiment.id,
            user_id: user?.id,
            session_id: user ? undefined : sessionId, // Prefer user_id if available
            variant: selectedVariant
        }, { onConflict: user ? 'experiment_id, user_id' : 'experiment_id, session_id' })

        return selectedVariant

    } catch (error) {
        console.error('Error in getExperimentVariant:', error)
        return null
    }
}

/**
 * Client-side helper to track events via API
 */
export async function trackExperimentEvent(experimentName: string, eventName: string, value: number = 1) {
    try {
        await fetch('/api/experiments/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ experimentName, eventName, value })
        })
    } catch (error) {
        console.error('Failed to track experiment event:', error)
    }
}
