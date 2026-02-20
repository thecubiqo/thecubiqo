// Printify integration configuration API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPrintifyStatus } from '@/lib/integrations/printify';

/**
 * GET /api/integrations/printify
 * Get Printify integration configuration and status
 */
export async function GET(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 },
      );
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get integration config
    const { data: config, error } = await sb
      .from('integration_configs')
      .select('*')
      .eq('site_id', siteId)
      .eq('provider', 'printify')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get status if integration is configured
    let status = null;
    if (config && config.enabled) {
      status = await getPrintifyStatus(siteId);
    }

    return NextResponse.json({
      config: config || null,
      status: status || { connected: false },
    });
  } catch (error) {
    console.error('Printify integration GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/integrations/printify
 * Configure Printify integration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteId, apiToken, apiVersion, enabled = true } = body;

    if (!siteId || !apiToken) {
      return NextResponse.json(
        { error: 'siteId and apiToken are required' },
        { status: 400 },
      );
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Upsert integration config
    const { data, error } = await sb
      .from('integration_configs')
      .upsert(
        {
          site_id: siteId,
          provider: 'printify',
          config: {
            apiToken,
            apiVersion: apiVersion || 'v1',
          },
          enabled,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'site_id,provider',
        },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: data });
  } catch (error) {
    console.error('Printify integration POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/integrations/printify
 * Remove Printify integration
 */
export async function DELETE(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 },
      );
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await sb
      .from('integration_configs')
      .delete()
      .eq('site_id', siteId)
      .eq('provider', 'printify');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Printify integration DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
