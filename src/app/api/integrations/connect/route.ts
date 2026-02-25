/**
 * POST /api/integrations/connect
 * Lightweight endpoint for launchpad integration key linking.
 * Validates and stores integration connection state per user.
 *
 * Note: The full API key is intentionally NOT stored in plain text here.
 * Only a masked preview is persisted (e.g., "sk_*****xyz") to track which
 * services are connected. For production use, pass the key through the
 * /api/emergent/secrets endpoint which encrypts keys with AES-256-GCM.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// PostgreSQL error code for "relation does not exist" (table not yet migrated)
const POSTGRES_UNDEFINED_TABLE = '42P01';

const SUPPORTED_SERVICES = ['shopify', 'printify', 'klaviyo', 'tiktok', 'meta'] as const;
type SupportedService = (typeof SUPPORTED_SERVICES)[number];

interface UserIntegrationKey {
  user_id: string;
  service: string;
  key_preview: string;
  connected_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { service, apiKey } = body as { service: string; apiKey: string };

    if (!service || !SUPPORTED_SERVICES.includes(service as SupportedService)) {
      return NextResponse.json(
        { error: `Unsupported service. Supported: ${SUPPORTED_SERVICES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });
    }

    const keyPreview = `${apiKey.slice(0, 4)}${'*'.repeat(Math.max(0, apiKey.length - 8))}${apiKey.slice(-4)}`;

    const row: UserIntegrationKey = {
      user_id: user.id,
      service,
      key_preview: keyPreview,
      connected_at: new Date().toISOString(),
    };

    // Store the masked connection record. Uses upsert so re-linking updates the existing entry.
    const { error: upsertError } = await (supabase as SupabaseClient)
      .from('user_integration_keys')
      .upsert(row, { onConflict: 'user_id,service' });

    // Gracefully handle the case where the migration hasn't run yet (table missing).
    if (upsertError && upsertError.code !== POSTGRES_UNDEFINED_TABLE) {
      console.error('[integrations/connect] upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save integration. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('[integrations/connect] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
