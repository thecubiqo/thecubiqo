/**
 * Journal Entries API Route
 * CRUD operations for journal entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { JournalService } from '@/lib/journal/journal-service';
import { routeAIRequest } from '@/lib/ai/router';
import type { CreateEntryInput, SearchFilters } from '@/lib/journal/types';

/**
 * GET /api/journal/entries
 * List journal entries with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
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
    const colorCategory = searchParams.get('colorCategory');
    const searchQuery = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    if (colorCategory) {
      query = query.eq('color_category', colorCategory);
    }

    if (searchQuery) {
      query = query.textSearch('content', searchQuery);
    }

    const { data: entries, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ entries });

  } catch (error) {
    console.error('Journal API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/journal/entries
 * Create a new journal entry
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateEntryInput = await request.json();
    const { content, type, colorCategory, mood, audioUrl, transcription } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content required' },
        { status: 400 }
      );
    }

    // Detect color category if not provided
    let detectedColor = colorCategory;
    if (!detectedColor) {
      // Use AI to detect color
      const aiModel = {
        generateText: async ({ prompt }: any) => {
          const result = await routeAIRequest({
            systemPrompt: prompt,
            messages: [],
            forceCloud: false,
          });
          return result.content || 'YELLOW';
        },
      };

      detectedColor = await JournalService.detectColorCategory(content, aiModel);
    }

    // Analyze sentiment
    const aiModel = {
      generateText: async ({ prompt }: any) => {
        const result = await routeAIRequest({
          systemPrompt: prompt,
          messages: [],
          forceCloud: false,
        });
        return result.content || '0';
      },
    };

    const sentiment = await JournalService.analyzeSentiment(content, aiModel);

    // Extract keywords
    const keywords = JournalService.extractKeywords(content);

    // Build metadata
    const metadata = JournalService.buildMetadata(content, sentiment);

    // Get current date and time
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const timestamp = now.toISOString();

    // Insert entry
    const { data: entry, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        date,
        timestamp,
        type,
        content,
        color_category: detectedColor,
        mood,
        keywords,
        audio_url: audioUrl,
        transcription,
        metadata,
      })
      .select()
      .single();

    if (error) {

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Update or create daily summary
    await updateDailySummary(supabase, user.id, date);

    return NextResponse.json({ entry }, { status: 201 });

  } catch (error) {
    console.error('Journal API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Update daily summary
 */
async function updateDailySummary(supabase: any, userId: string, date: string) {
  // Get all entries for this day
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);

  if (!entries || entries.length === 0) return;

  // Generate summary
  const summary = JournalService.generateDailySummary(entries);

  // Upsert summary
  await supabase
    .from('daily_summaries')
    .upsert({
      user_id: userId,
      date,
      ...summary,
    }, {
      onConflict: 'user_id,date',
    });
}
