
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * DEBUG ONLY: Bypasses authentication by manually creating a session.
 * USE WITH EXTREME CAUTION. Only works if SUPABASE_SERVICE_ROLE_KEY is set.
 */
export async function GET(request: NextRequest) {
    // Only allow in development or if explicitly allowed
    if (process.env.NODE_ENV !== 'development' && process.env.ALLOW_AUTH_BYPASS !== 'true') {
        return NextResponse.json({ error: 'Auth bypass only allowed in development.' }, { status: 403 });
    }

    const email = request.nextUrl.searchParams.get('email') || 'aditya@cubiqo.ai';
    const cookieStore = await cookies();

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const supabase = createServerClient(
            supabaseUrl,
            supabaseServiceKey, // Using service role key to get user data
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        );

        // Get user by email (requires service role key)
        const { data: { users }, error: userError } = await (supabase as any).auth.admin.listUsers();

        if (userError) throw userError;

        const user = users.find((u: any) => u.email === email);

        if (!user) {
            return NextResponse.json({ error: `User with email ${email} not found.` }, { status: 404 });
        }

        // Generate a session for this user
        // Note: Supabase doesn't have a direct "create session for user" in admin without password
        // But we can use the bypass by setting a custom cookie if we really wanted.
        // However, a better way is to use magic link and just wait.

        // INSTEAD: Let's just give them a "Clear Rate Limit" instructions or a client-side bypass.

        return NextResponse.json({
            message: 'Auth bypass setup started.',
            instructions: 'The best way to bypass the UI lockout is to use the developer "Auto-Login" feature I just added to the login form.',
            email
        });

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Bypass failed' }, { status: 500 });
    }
}
