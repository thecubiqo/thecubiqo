/**
 * Single Journal Entry API Route
 * GET, PATCH, DELETE for specific entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateEntryInput } from '@/lib/journal/types';

/**
 * GET /api/journal/entries/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: entryId } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: entry, error } = await supabase
      .from('journal_entries' as any)
      .select('*')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single();

    if (error || !entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });

  } catch (error) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/journal/entries/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: entryId } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: UpdateEntryInput = await request.json();

    // Get existing entry
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_entries' as any)
      .select('*')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.content !== undefined) {
      updates.content = body.content;
      // Increment edit count
      updates.metadata = {
        ...((existingEntry as any)?.metadata || {}),
        editCount: (((existingEntry as any)?.metadata?.editCount || 0) as number) + 1,
      };
    }

    if (body.colorCategory !== undefined) {
      updates.color_category = body.colorCategory;
    }

    if (body.mood !== undefined) {
      updates.mood = body.mood;
    }

    if (body.keywords !== undefined) {
      updates.keywords = body.keywords;
    }

    // Update entry
    const { data: entry, error } = await supabase
      .from('journal_entries' as any)
      .update(updates)
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry });

  } catch (error) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/journal/entries/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: entryId } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('journal_entries' as any)
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
