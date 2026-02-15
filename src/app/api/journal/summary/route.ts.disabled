/**
 * Daily Summary API Route
 * Get daily summaries with optional date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/journal/summary
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const date = searchParams.get('date'); // Single date

    let query = supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (date) {
      // Get single day summary
      query = query.eq('date', date).single();
      
      const { data: summary, error } = await query;

      if (error || !summary) {
        return NextResponse.json(
          { error: 'Summary not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ summary });
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data: summaries, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ summaries });

  } catch (error) {
    console.error('Get summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
