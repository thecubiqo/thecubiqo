/**
 * POST /api/agent/location          — store user's current coords + reverse geocode
 * GET  /api/agent/location          — read stored location
 * POST /api/agent/location/geofence — register a geofence trigger
 *
 * The client calls navigator.geolocation.getCurrentPosition, then POSTs the
 * coords here. We reverse-geocode via Nominatim (free, no API key needed) and
 * store in user_ai_profile.location_context.
 *
 * Geofences are stored in user_geofences and checked by the agent-worker cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 15;

const coordSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),  // metres
  altitude: z.number().optional(),
});

const geofenceSchema = z.object({
  name: z.string().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMetres: z.number().min(50).max(50_000).default(500),
  onEnter: z.string().max(400).optional(),   // action/reminder text
  onExit: z.string().max(400).optional(),
  active: z.boolean().default(true),
});

// ── Haversine distance (metres) ───────────────────────────────────────────────
function haversineMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Reverse geocode via Nominatim ─────────────────────────────────────────────
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: { 'User-Agent': 'CubiQo/1.0 (aditya@cubiqo.ai)' },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const data = await res.json();
    const addr = data.address ?? {};
    return [addr.city || addr.town || addr.village, addr.country].filter(Boolean).join(', ')
      || data.display_name?.split(',').slice(0, 2).join(', ')
      || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

// ── GET: read stored location ─────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data } = await auth.supabase
    .from('user_ai_profile')
    .select('location_context, last_updated')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  const { data: geofences } = await auth.supabase
    .from('user_geofences')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('active', true)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    location: data?.location_context ?? null,
    geofences: geofences ?? [],
  });
}

// ── POST: update location ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const isGeofence = url.pathname.endsWith('/geofence');

  if (isGeofence) {
    // Register a geofence
    const parsed = geofenceSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid geofence body', issues: parsed.error.flatten() }, { status: 400 });
    }
    // Map camelCase schema fields to snake_case columns explicitly — a blind
    // spread would write `radiusMetres/onEnter/onExit` (non-existent columns)
    // and leave radius_metres NULL.
    const { data, error } = await auth.supabase
      .from('user_geofences')
      .insert({
        user_id: auth.user.id,
        name: parsed.data.name,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        radius_metres: parsed.data.radiusMetres,
        on_enter: parsed.data.onEnter ?? null,
        on_exit: parsed.data.onExit ?? null,
        active: parsed.data.active,
      })
      .select('id, name, radius_metres, latitude, longitude, active')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, geofence: data });
  }

  // Store current position
  const parsed = coordSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coords', issues: parsed.error.flatten() }, { status: 400 });
  }

  const { latitude, longitude, accuracy, altitude } = parsed.data;
  const label = await reverseGeocode(latitude, longitude);

  const locationContext = {
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    altitude: altitude ?? null,
    label,
    updatedAt: new Date().toISOString(),
  };

  await auth.supabase
    .from('user_ai_profile')
    .upsert({
      user_id: auth.user.id,
      location_context: locationContext,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  // Check active geofences against new position
  const { data: geofences } = await auth.supabase
    .from('user_geofences')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('active', true);

  const triggered: Array<{ id: string; name: string; event: 'enter' | 'exit'; message: string }> = [];

  for (const gf of geofences ?? []) {
    const dist = haversineMetres(latitude, longitude, gf.latitude, gf.longitude);
    const inside = dist <= (gf.radius_metres ?? 500);
    const wasInside = gf.last_state === 'inside';

    if (inside && !wasInside && gf.on_enter) {
      triggered.push({ id: gf.id, name: gf.name, event: 'enter', message: gf.on_enter });
      await auth.supabase.from('user_geofences').update({ last_state: 'inside' }).eq('id', gf.id);
    } else if (!inside && wasInside && gf.on_exit) {
      triggered.push({ id: gf.id, name: gf.name, event: 'exit', message: gf.on_exit });
      await auth.supabase.from('user_geofences').update({ last_state: 'outside' }).eq('id', gf.id);
    }
  }

  // Write triggered geofence events as memory
  for (const trig of triggered) {
    await auth.supabase.from('memory_events').insert({
      user_id: auth.user.id,
      event_type: 'preference',
      summary: `Geofence "${trig.name}" ${trig.event}: ${trig.message}`,
      keywords: ['geofence', trig.event, trig.name],
      weight: 2,
    }).catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    location: locationContext,
    geofencesTriggered: triggered,
  });
}
