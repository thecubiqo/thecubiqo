// API: Flag overrides (toggle per-site / per-user)
import { NextRequest, NextResponse } from 'next/server';
import {
  setFlagOverride,
  getFlagOverrides,
  resolveFlag,
  resolveFlagsForSite,
  writeAuditLog,
} from '@/lib/founders-pass/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const flagId = searchParams.get('flagId');
    const siteId = searchParams.get('siteId');
    const flagKey = searchParams.get('key');

    // Resolve a single flag
    if (flagKey) {
      const value = await resolveFlag(flagKey, {
        siteId: siteId ?? undefined,
        userId: searchParams.get('userId') ?? undefined,
      });
      return NextResponse.json({ key: flagKey, enabled: value });
    }

    // Resolve all flags for a site
    if (siteId && !flagId) {
      const flags = await resolveFlagsForSite(
        siteId,
        searchParams.get('userId') ?? undefined,
      );
      return NextResponse.json({ flags });
    }

    // List overrides for a flag
    if (flagId) {
      const overrides = await getFlagOverrides(flagId);
      return NextResponse.json({ overrides });
    }

    return NextResponse.json({ error: 'flagId, siteId, or key required' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const override = await setFlagOverride(body.flag_id, {
      siteId: body.site_id,
      userId: body.user_id,
      enabled: body.enabled,
    });

    await writeAuditLog({
      actor_id: body.actor_id ?? null,
      action: 'flag.override_set',
      resource_type: 'flag_override',
      resource_id: override.id,
      details: { flag_id: body.flag_id, site_id: body.site_id, enabled: body.enabled },
    });

    return NextResponse.json({ override });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
