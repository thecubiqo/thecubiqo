// Epic 1: Organizations API - List & Create
// Author: @blossom (Backend Developer)
// Route: GET /api/orgs - List user's organizations
// Route: POST /api/orgs - Create new organization

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/permissions';

/**
 * GET /api/orgs
 * List all organizations user is a member of
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const supabase = (await createClient()) as any;

    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*, org_members!inner(role)')
      .eq('org_members.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    const orgsWithRole = orgs.map((org: any) => ({
      ...org,
      role: org.org_members[0]?.role,
      org_members: undefined,
    }));

    return NextResponse.json({ organizations: orgsWithRole });
  } catch (error) {
    console.error('GET /api/orgs error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/orgs
 * Create a new organization
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { name, slug, billing_tier } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
    }

    const supabase = (await createClient()) as any;

    const { data: org, error: createError } = await supabase
      .from('organizations')
      .insert({ name: name.trim(), slug: orgSlug, billing_tier: billing_tier || 'free' })
      .select()
      .single();

    if (createError) {
      console.error('Error creating organization:', createError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    await supabase.from('audit_logs').insert({
      org_id: org.id,
      user_id: userId,
      action: 'organization.created',
      resource_type: 'organization',
      resource_id: org.id,
      metadata: { name: org.name, slug: org.slug },
    });

    return NextResponse.json({ organization: org }, { status: 201 });
  } catch (error) {
    console.error('POST /api/orgs error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
