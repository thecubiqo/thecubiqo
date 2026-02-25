import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Fetch current feature flags (runtime configuration)
    const { data: featureFlags, error: flagsError } = await (supabase as any)
      .from('feature_flags')
      .select('*')
      .order('name', { ascending: true });

    if (flagsError) {
      throw new Error(`Failed to fetch feature flags: ${flagsError.message}`);
    }

    // Build configuration object
    const config = {
      featureFlags: featureFlags || [],
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
      },
      system: {
        maxAgentConcurrency: parseInt(process.env.MAX_AGENT_CONCURRENCY || '5'),
        defaultModel: process.env.DEFAULT_AI_MODEL || 'gpt-4',
        enableCompaction: process.env.ENABLE_COMPACTION !== 'false',
        enableSelfHeal: process.env.ENABLE_SELF_HEAL !== 'false',
      },
    };

    return NextResponse.json({
      config,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Admin config GET error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch config',
        config: {},
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    // Update feature flags if provided
    if (body.featureFlags && Array.isArray(body.featureFlags)) {
      for (const flag of body.featureFlags) {
        if (!flag.name) continue;

        // Upsert feature flag
        const { error: upsertError } = await (supabase as any)
          .from('feature_flags')
          .upsert({
            name: flag.name,
            enabled: flag.enabled !== undefined ? flag.enabled : true,
            description: flag.description || null,
            config: flag.config || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'name',
          });

        if (upsertError) {
          throw new Error(`Failed to update feature flag ${flag.name}: ${upsertError.message}`);
        }
      }
    }

    // Note: Environment variables are read-only at runtime
    // System config changes would require a redeploy or use feature_flags table

    // Return updated config
    const { data: updatedFlags, error: fetchError } = await (supabase as any)
      .from('feature_flags')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch updated feature flags: ${fetchError.message}`);
    }

    return NextResponse.json({
      success: true,
      config: {
        featureFlags: updatedFlags || [],
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Admin config POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update config',
      },
      { status: 500 }
    );
  }
}
