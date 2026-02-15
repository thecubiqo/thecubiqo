/**
 * Design Toggles CRUD API
 * Admin endpoint for managing design and feature toggles
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DesignToggle {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: 'design' | 'feature' | 'experiment';
  is_enabled: boolean;
  config: Record<string, any>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/admin/designs
 * List all design toggles (grouped by category)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch all design toggles
    const { data: toggles, error } = await supabase
      .from('design_toggles')
      .select('*')
      .order('category', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching design toggles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch design toggles' },
        { status: 500 }
      );
    }

    // Group by category
    const grouped = {
      design: [] as DesignToggle[],
      feature: [] as DesignToggle[],
      experiment: [] as DesignToggle[],
    };

    toggles?.forEach((toggle) => {
      if (toggle.category in grouped) {
        grouped[toggle.category as keyof typeof grouped].push(toggle);
      }
    });

    return NextResponse.json({
      toggles: toggles || [],
      grouped,
      count: toggles?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/designs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/designs?id=<toggle-id>
 * Update a toggle's is_enabled status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const adminEmails = ['aditya@cubiqo.ai'];
    if (!profile || !adminEmails.includes(profile.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get toggle ID from query params
    const toggleId = request.nextUrl.searchParams.get('id');
    if (!toggleId) {
      return NextResponse.json(
        { error: 'Toggle ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { is_enabled } = body;

    if (typeof is_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'is_enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Update toggle
    const { data: toggle, error } = await supabase
      .from('design_toggles')
      .update({
        is_enabled,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', toggleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating toggle:', error);
      return NextResponse.json(
        { error: 'Failed to update toggle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ toggle });
  } catch (error) {
    console.error('Error in PATCH /api/admin/designs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/designs
 * Create a new toggle (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const adminEmails = ['aditya@cubiqo.ai'];
    if (!profile || !adminEmails.includes(profile.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, display_name, description, category, is_enabled, config } = body;

    // Validate required fields
    if (!name || !display_name || !category) {
      return NextResponse.json(
        { error: 'name, display_name, and category are required' },
        { status: 400 }
      );
    }

    if (!['design', 'feature', 'experiment'].includes(category)) {
      return NextResponse.json(
        { error: 'category must be design, feature, or experiment' },
        { status: 400 }
      );
    }

    // Create toggle
    const { data: toggle, error } = await supabase
      .from('design_toggles')
      .insert({
        name,
        display_name,
        description: description || null,
        category,
        is_enabled: is_enabled ?? true,
        config: config || {},
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating toggle:', error);
      return NextResponse.json(
        { error: 'Failed to create toggle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ toggle }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/designs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
