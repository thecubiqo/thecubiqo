/**
 * Memory Stats API Route
 * Get statistics about user's conscious memories
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { MemoryStats, MemoryType, MemoryImportance } from '@/lib/conscious-memory/types';

/**
 * GET /api/memory/stats
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

    // Get all memories
    const { data: memories, error } = await supabase
      .from('conscious_memories')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!memories || memories.length === 0) {
      return NextResponse.json({
        stats: {
          totalMemories: 0,
          byType: {
            factual: 0,
            preference: 0,
            emotional: 0,
            goal: 0,
            relationship: 0,
            context: 0,
          },
          byImportance: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
          },
          mostAccessed: [],
          recentlyCreated: [],
          clusters: [],
        },
      });
    }

    // Calculate stats
    const byType: Record<MemoryType, number> = {
      factual: 0,
      preference: 0,
      emotional: 0,
      goal: 0,
      relationship: 0,
      context: 0,
    };

    const byImportance: Record<MemoryImportance, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const memory of memories) {
      byType[memory.type as MemoryType]++;
      byImportance[memory.importance as MemoryImportance]++;
    }

    // Most accessed
    const mostAccessed = [...memories]
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, 5);

    // Recently created
    const recentlyCreated = [...memories]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const stats: MemoryStats = {
      totalMemories: memories.length,
      byType,
      byImportance,
      mostAccessed,
      recentlyCreated,
      clusters: [], // TODO: Implement clustering
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Get memory stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
