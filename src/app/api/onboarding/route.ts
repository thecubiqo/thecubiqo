import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ENV } from '@/lib/config/env';

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const config = body.config || {};
        const skipped = body.skipped || false;

        // Use update statement on profiles to inject onboarding data.
        const { error: dbError } = await supabase
            .from('profiles')
            .update({
                onboarding_data: config,
                onboarding_completed: true,
            })
            .eq('id', user.id);

        if (dbError) {
            throw new Error(dbError.message);
        }

        return NextResponse.json({ success: true, user_id: user.id });
    } catch (error: any) {
        console.error('Onboarding update error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
