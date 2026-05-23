import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

export const runtime = 'nodejs';

const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

type RegistryPlatformRow = {
  platform: string;
  display_name: string;
  description: string | null;
  adapter_type: string;
  category: string | null;
  phase: number | null;
  priority: string | null;
  detection_risk: string | null;
  tos_risk: boolean | null;
  never_automate_writes: boolean | null;
  logo_url: string | null;
};

type UserConnectorRow = {
  platform: string;
  status: string | null;
  health_status: string | null;
  last_health_check_at: string | null;
};

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const [{ data: registry, error: registryError }, { data: userConnectors, error: userError }] = await Promise.all([
    auth.supabase
      .from('connector_registry')
      .select('platform,display_name,description,adapter_type,category,phase,priority,detection_risk,tos_risk,never_automate_writes,logo_url')
      .eq('is_active', true),
    auth.supabase
      .from('user_connectors')
      .select('platform,status,health_status,last_health_check_at')
      .eq('user_id', auth.user.id),
  ]);

  if (safeTableMissing(registryError)) {
    return NextResponse.json({ connectors: [], migrationPending: true });
  }
  if (registryError) return NextResponse.json({ error: registryError.message }, { status: 500 });
  if (userError && !safeTableMissing(userError)) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const connectedMap = new Map<string, UserConnectorRow>(
    ((userConnectors || []) as UserConnectorRow[]).map(connector => [connector.platform, connector]),
  );
  const connectors = ((registry || []) as RegistryPlatformRow[])
    .map(platform => {
      const userConnector = connectedMap.get(platform.platform);
      return {
        platform: platform.platform,
        displayName: platform.display_name,
        description: platform.description || '',
        adapterType: platform.adapter_type,
        category: platform.category || 'productivity',
        phase: platform.phase || 3,
        priority: platform.priority || 'medium',
        detectionRisk: platform.detection_risk || 'zero',
        tosRisk: Boolean(platform.tos_risk),
        neverAutomateWrites: Boolean(platform.never_automate_writes),
        logoUrl: platform.logo_url || null,
        connected: Boolean(userConnector && userConnector.status === 'active'),
        healthStatus: userConnector?.health_status || 'unknown',
        lastChecked: userConnector?.last_health_check_at || null,
      };
    })
    .sort((a: { phase: number | null; priority: string | null }, b: { phase: number | null; priority: string | null }) =>
      Number(a.phase) - Number(b.phase) || (priorityOrder[String(a.priority)] ?? 9) - (priorityOrder[String(b.priority)] ?? 9),
    );

  return NextResponse.json({ connectors });
}
