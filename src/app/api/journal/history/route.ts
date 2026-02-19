/**
 * Journal History API
 * Fetches journal entries for authenticated users with pagination and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/journal/history
 * Fetch journal entries for the authenticated user
 * 
 * Query params:
 * - limit: Number of entries to return (default: 30, max: 100)
 * - offset: Pagination offset (default: 0)
 * - search: Optional text search across content
 * 
 * Returns:
 * - entries: Array of journal entries
 * - total: Total count of entries (for pagination)
 * - hasMore: Boolean indicating if more entries exist
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - Please sign in to view your journal history' 
        },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');
    const searchQuery = searchParams.get('search') || '';

    // Validate and cap limit
    const limit = Math.min(Math.max(limitParam, 1), 100);

    // Start building the query
    let query = supabase
      .from('journal_entries')
      .select('id, content, mood, color_state, word_count, duration_seconds, created_at', { count: 'exact' })
      .eq('user_id', user.id);

    // Add text search if provided
    if (searchQuery.trim()) {
      query = query.ilike('content', `%${searchQuery.trim()}%`);
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: entries, error: queryError, count } = await query;

    if (queryError) {
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch journal entries' 
        },
        { status: 500 }
      );
    }

    // Calculate if more entries exist
    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    return NextResponse.json({
      success: true,
      entries: entries || [],
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore,
        returned: entries?.length || 0
      },
      userId: user.id
    });

  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
