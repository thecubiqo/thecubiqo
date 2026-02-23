import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ENV } from '@/lib/config/env';

export async function DELETE(req: NextRequest) {
    try {
        const cookieStore = await cookies();

        // Create authenticated Supabase client using SSR package per setup
        const supabase = createServerClient(
            ENV.supabase.url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
            ENV.supabase.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value))
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize an admin client because auth.admin is required to delete an actual user account
        const adminSupabase = createServerClient(
            ENV.supabase.url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() {
                        return [];
                    },
                    setAll() { },
                },
            }
        );

        // Hard delete rows that belong to this profile
        // Note: Due to RLS or Cascade rules it's better to explicitly delete if Cascade isn't configured,
        // but the requirement specified "hard-deletes must cascade". 
        // Just to be safe, we'll actively delete user sessions and then request user deletion.

        const { error: sessionDelError } = await adminSupabase
            .from('sessions')
            .delete()
            .eq('user_id', user.id);

        if (sessionDelError) {
            console.warn('Failed to delete sessions', sessionDelError);
        }

        // Now permanently delete the user from Supabase Auth
        // This will trigger 'on delete cascade' to clear the `profiles` table automatically
        const { error: deletionError } = await adminSupabase.auth.admin.deleteUser(user.id);

        if (deletionError) {
            throw new Error(deletionError.message);
        }

        // Clear the active session cookies
        return NextResponse.json({ success: true, message: 'Account deleted' });
    } catch (error: any) {
        console.error('Account deletion error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
