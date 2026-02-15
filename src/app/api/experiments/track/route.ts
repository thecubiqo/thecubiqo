import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { experimentName, eventName, value } = await req.json();

        if (!experimentName || !eventName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();
        // Use supabase directly;

        // 1. Get experiment ID
        const { data: experiment } = await (supabase as any)
            .from('experiments')
            .select('id')
            .eq('name', experimentName)
            .single();

        if (!experiment) {
            return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
        }

        // 2. Identify User/Session
        const { data: { user } } = await supabase.auth.getUser();
        const sessionId = req.cookies.get('cubiqo_session')?.value;

        if (!user && !sessionId) {
            return NextResponse.json({ error: 'No user context identified' }, { status: 400 });
        }

        // 3. Find current variant assignment
        // We need to know which variant they are assigned to associate the event correctly
        let query = (supabase as any)
            .from('experiment_assignments')
            .select('variant')
            .eq('experiment_id', experiment.id);

        if (user) {
            query = query.eq('user_id', user.id);
        } else {
            query = query.eq('session_id', sessionId!);
        }

        const { data: assignment } = await query.single();

        if (!assignment) {
            // If they send an event but aren't assigned, we can either ignore or auto-assign.
            // For analytics purity, better to ignore or log as 'unassigned' if possible, 
            // but here we'll just return 400.
            return NextResponse.json({ error: 'User not assigned to experiment' }, { status: 400 });
        }

        // 4. Record Event
        const { error } = await (supabase as any).from('experiment_events').insert({
            experiment_id: experiment.id,
            variant: assignment.variant,
            event_name: eventName,
            value: value || 1,
            user_id: user?.id,
            session_id: user ? undefined : sessionId,
        });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Track API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
