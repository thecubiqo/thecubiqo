/**
 * Journal Stats API Route
 * Get statistics and analytics for user's journal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { JournalService } from '@/lib/journal/journal-service';

/**
 * GET /api/journal/stats
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

    // Get all entries
    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id);

    if (entriesError) {
      return NextResponse.json(
        { error: entriesError.message },
        { status: 500 }
      );
    }

    // Get all summaries
    const { data: summaries, error: summariesError } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(90); // Last 90 days

    if (summariesError) {
      return NextResponse.json(
        { error: summariesError.message },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = JournalService.calculateStats(entries || [], summaries || []);

    // Get today's prompt
    const todayPrompt = JournalService.getPromptForTime();

    return NextResponse.json({
      stats,
      todayPrompt,
    });

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
