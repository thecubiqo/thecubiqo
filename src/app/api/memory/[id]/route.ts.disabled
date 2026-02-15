/**
 * Single Memory API Route
 * GET, PATCH, DELETE for specific memory
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ConsciousMemoryService } from '@/lib/conscious-memory/memory-service';
import type { UpdateMemoryInput } from '@/lib/conscious-memory/types';

/**
 * GET /api/memory/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: memory, error } = await supabase
      .from('conscious_memories')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    // Track access
    const updates = ConsciousMemoryService.trackAccess(memory);
    await supabase
      .from('conscious_memories')
      .update(updates)
      .eq('id', id);

    return NextResponse.json({ memory: { ...memory, ...updates } });

  } catch (error) {
    console.error('Get memory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/memory/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: UpdateMemoryInput = await request.json();

    // Check memory exists
    const { data: existing, error: fetchError } = await supabase
      .from('conscious_memories')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    // Build updates
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.content !== undefined) {
      updates.content = body.content;
    }

    if (body.importance !== undefined) {
      updates.importance = body.importance;
    }

    if (body.tags !== undefined) {
      updates.tags = body.tags;
    }

    if (body.verified !== undefined) {
      updates.verified = body.verified;
    }

    // Update memory
    const { data: memory, error } = await supabase
      .from('conscious_memories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ memory });

  } catch (error) {
    console.error('Update memory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memory/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('conscious_memories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete memory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
