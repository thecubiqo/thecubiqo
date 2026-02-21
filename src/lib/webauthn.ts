import { createClient } from '@supabase/supabase-js'
import { ENV } from '@/lib/config/env'

// Use a service role client for authenticator management to bypass RLS for inserts/updates
// and to access auth.users
const supabaseAdmin = createClient(
    ENV.supabase.url || 'https://placeholder.supabase.co',
    ENV.supabase.serviceRoleKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export interface Authenticator {
    id: string
    user_id: string
    credential_id: string
    credential_public_key: string
    counter: number
    transports?: string[]
}

export async function getUserAuthenticators(userId: string): Promise<Authenticator[]> {
    const { data, error } = await supabaseAdmin
        .from('user_authenticators')
        .select('*')
        .eq('user_id', userId)

    if (error) throw error
    return data || []
}

export async function getAuthenticatorByCredentialId(credentialId: string): Promise<Authenticator | null> {
    const { data, error } = await supabaseAdmin
        .from('user_authenticators')
        .select('*')
        .eq('credential_id', credentialId)
        .single()

    if (error) return null
    return data
}

export async function saveAuthenticator(authenticator: Omit<Authenticator, 'id'>) {
    const { data, error } = await supabaseAdmin
        .from('user_authenticators')
        .insert(authenticator)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateAuthenticatorCounter(credentialId: string, newCounter: number) {
    const { error } = await supabaseAdmin
        .from('user_authenticators')
        .update({ counter: newCounter, updated_at: new Date().toISOString() })
        .eq('credential_id', credentialId)

    if (error) throw error
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
    // This requires access to auth.users which is restricted.
    // We can use listUsers() to find by email if we have service role
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) return null

    // This is inefficient for large userbases, but Supabase Admin API doesn't have "getUserByEmail"
    // Wait, listUsers supports searching?
    // Actually, listUsers() returns pages.
    // Better way: use RPC or assume the client sends the ID if logged in.
    // For LOGIN, we need to find the user by their authenticator credential ID, which we do via getAuthenticatorByCredentialId.
    // So we don't strictly need getUserIdByEmail for login if we key off the credential.
    return null
}
