/**
 * Conscious Memory API Route
 * CRUD operations for persistent memories
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ConsciousMemoryService } from '@/lib/conscious-memory/memory-service';
import { routeAIRequest } from '@/lib/ai/router';
import type { CreateMemoryInput, MemoryQuery } from '@/lib/conscious-memory/types';

/**
 * GET /api/memory
 * List or search memories
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
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const tags = searchParams.get('tags')?.split(',');
    const minImportance = searchParams.get('minImportance');
    const limit = parseInt(searchParams.get('limit') || '50');

    let dbQuery = supabase
      .from('conscious_memories')
      .select('*')
      .eq('user_id', user.id)
      .order('importance', { ascending: false })
      .order('last_accessed', { ascending: false })
      .limit(limit);

    if (type) {
      dbQuery = dbQuery.eq('type', type);
    }

    if (minImportance) {
      dbQuery = dbQuery.gte('importance', minImportance);
    }

    const { data: memories, error } = await dbQuery;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If there's a search query, use AI to rank
    if (query && memories && memories.length > 0) {
      const aiModel = {
        generateText: async ({ prompt }: any) => {
          const result = await routeAIRequest({
            systemPrompt: prompt,
            messages: [],
            forceCloud: false,
          });
          return result.content || '[]';
        },
      };

      const searchResults = await ConsciousMemoryService.searchMemories(
        { query, type: type as any, tags, minImportance: minImportance as any, limit },
        memories,
        aiModel
      );

      return NextResponse.json({ results: searchResults });
    }

    return NextResponse.json({ memories });

  } catch (error) {
    console.error('Memory API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memory
 * Create a new memory
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

    const body: CreateMemoryInput = await request.json();
    const {
      type,
      content,
      importance = 'medium',
      context,
      tags = [],
      sourceConversationId,
      sourceMessageId,
      expiresAt,
    } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type required' },
        { status: 400 }
      );
    }

    // Insert memory
    const { data: memory, error } = await supabase
      .from('conscious_memories')
      .insert({
        user_id: user.id,
        type,
        content,
        importance,
        context,
        tags,
        related_memories: [],
        source_conversation_id: sourceConversationId,
        source_message_id: sourceMessageId,
        verified: false,
        last_accessed: new Date().toISOString(),
        access_count: 0,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ memory }, { status: 201 });

  } catch (error) {
    console.error('Memory API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
