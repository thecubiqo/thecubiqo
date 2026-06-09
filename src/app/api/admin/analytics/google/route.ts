/**
 * GET /api/admin/analytics/google
 * Fetches Google Analytics 4 data via the GA4 Data API (analyticsdata.googleapis.com).
 *
 * Query params:
 *   ?days=7           — report window (default 7, max 90)
 *   ?metrics=sessions,users,pageviews   — comma-separated GA4 metrics
 *   ?dimensions=date  — comma-separated GA4 dimensions
 *
 * Requires:
 *   GA4_PROPERTY_ID   — e.g. "properties/123456789"
 *   GA4_CLIENT_EMAIL  — service account email
 *   GA4_PRIVATE_KEY   — service account private key (PEM, \n-escaped)
 *
 * Falls back to Shopify analytics if GA4 is not configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser, requireApiUser } from '../../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 20;

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const GA4_CLIENT_EMAIL = process.env.GA4_CLIENT_EMAIL;
const GA4_PRIVATE_KEY = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n');

// ── JWT signing for Google service account (no googleapis SDK needed) ─────────
async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: GA4_CLIENT_EMAIL,
    sub: GA4_CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
  };

  function b64url(obj: object) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }

  const unsigned = `${b64url(header)}.${b64url(payload)}`;

  // Sign with RSA-SHA256 using Web Crypto
  const keyData = GA4_PRIVATE_KEY!
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyBuffer = Buffer.from(keyData, 'base64');
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, Buffer.from(unsigned));
  const jwt = `${unsigned}.${Buffer.from(signature).toString('base64url')}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokenData.error_description ?? 'GA4 auth failed');
  return tokenData.access_token;
}

const DEFAULT_METRICS = ['sessions', 'totalUsers', 'screenPageViews', 'bounceRate', 'averageSessionDuration'];
const DEFAULT_DIMENSIONS = ['date'];

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;
  const admin = await isAdminUser(auth.supabase, auth.user.id);
  if (!admin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });

  if (!GA4_PROPERTY_ID || !GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
    return NextResponse.json({
      error: 'Google Analytics not configured',
      missing: [
        !GA4_PROPERTY_ID ? 'GA4_PROPERTY_ID' : null,
        !GA4_CLIENT_EMAIL ? 'GA4_CLIENT_EMAIL' : null,
        !GA4_PRIVATE_KEY ? 'GA4_PRIVATE_KEY' : null,
      ].filter(Boolean),
      fallback: 'Use /api/admin/analytics for Shopify analytics',
    }, { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const days = Math.min(parseInt(params.get('days') || '7', 10), 90);
  const metricNames = params.get('metrics')?.split(',').map(m => m.trim()) ?? DEFAULT_METRICS;
  const dimensionNames = params.get('dimensions')?.split(',').map(d => d.trim()) ?? DEFAULT_DIMENSIONS;

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken();
  } catch (err: any) {
    return NextResponse.json({ error: `GA4 auth failed: ${err.message}` }, { status: 500 });
  }

  const propertyId = GA4_PROPERTY_ID.startsWith('properties/')
    ? GA4_PROPERTY_ID
    : `properties/${GA4_PROPERTY_ID}`;

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: metricNames.map(name => ({ name })),
        dimensions: dimensionNames.map(name => ({ name })),
        orderBys: [{ dimension: { dimensionName: dimensionNames[0] }, desc: false }],
        limit: 90,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: `GA4 API error: ${err.error?.message ?? res.status}` }, { status: 502 });
  }

  const raw = await res.json();

  // Flatten response into simple rows
  const headers = [
    ...(raw.dimensionHeaders ?? []).map((h: any) => h.name),
    ...(raw.metricHeaders ?? []).map((h: any) => h.name),
  ];
  const rows = (raw.rows ?? []).map((row: any) => {
    const values = [
      ...(row.dimensionValues ?? []).map((v: any) => v.value),
      ...(row.metricValues ?? []).map((v: any) => v.value),
    ];
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });

  // Summary totals
  const totals = Object.fromEntries(
    (raw.totals?.[0]?.metricValues ?? []).map((v: any, i: number) => [
      raw.metricHeaders?.[i]?.name ?? `metric${i}`,
      v.value,
    ])
  );

  return NextResponse.json({
    property: propertyId,
    dateRange: { startDate, endDate, days },
    rows,
    totals,
    rowCount: raw.rowCount ?? rows.length,
  });
}
