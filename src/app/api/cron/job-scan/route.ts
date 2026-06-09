import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, cleanEnv, requireApiUser } from '../../_lib/supabase-admin';
import { isAuthorizedCron } from '../../_lib/cron-auth';
import { buildProviderSearchUrl, enabledScanProviders, type JobProvider } from '@/next/lib/jobs/job-provider-registry';
import { getModel, getScoringParams } from '@/next/lib/config/llm';
import { cfg } from '@/next/lib/config/runtime';

export const runtime = 'nodejs';
export const maxDuration = 120;
const RECENCY_TEXT: Record<string, string> = {
  '24h': 'posted in the last 24 hours',
  '3d': 'posted in the last 3 days',
  '7d': 'posted in the last 7 days',
  '30d': 'posted in the last 30 days',
  any: ''
};

function asArray(value: unknown) {
  return Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean) : [];
}

function buildScanContext(profile: Record<string, any>) {
  const targetRoles = asArray(profile.target_roles);
  const skills = asArray(profile.skills).slice(0, cfg.jobScanSkillLimit);
  const preferredLocations = asArray(profile.preferred_locations);
  const workModes = asArray(profile.work_modes);
  const metadata = profile.metadata || {};
  const recency = String(metadata.scan_recency || '24h').trim() || '24h';
  const recencyText = RECENCY_TEXT[recency] ?? RECENCY_TEXT['24h'];

  if (!targetRoles.length && !skills.length) {
    return {
      ok: false as const,
      reason: 'Job scan needs at least one target role or skill in the saved job profile.',
      missing: ['target_roles_or_skills']
    };
  }

  const roleSkillQuery = [...targetRoles.slice(0, cfg.jobScanRoleLimit), ...skills.slice(0, 2)].join(' ');
  const location = [...preferredLocations.slice(0, 1), ...workModes.slice(0, 1)].join(' ') || 'open location';
  const query = [roleSkillQuery, recencyText].filter(Boolean).join(' ');

  return {
    ok: true as const,
    query,
    location,
    recency,
    targetRoles,
    skills,
    preferredLocations,
    workModes
  };
}

async function recordScanRun(
  admin: any,
  input: {
    userId: string;
    platform: string;
    listingsFound: number;
    listingsSaved: number;
    scoreThreshold: number;
    metadata?: Record<string, unknown>;
  }
) {
  await admin
    .from('job_scan_runs')
    .insert({
      user_id: input.userId,
      platform: input.platform,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      jobs_found: input.listingsFound,
      listings_found: input.listingsFound,
      listings_saved: input.listingsSaved,
      score_threshold: input.scoreThreshold,
      metadata: input.metadata || {}
    })
    .throwOnError()
    .catch(() => null);
}

async function scoreListing(listing: Record<string, any>, profile: Record<string, any>): Promise<number> {
  const openaiKey = cleanEnv(process.env.OPENAI_API_KEY);
  if (!openaiKey) return 50;

  try {
    const prompt = `Score this job listing (0-100) against the candidate profile. Return only a number.

Profile:
- Target roles: ${(profile.target_roles || []).join(', ')}
- Skills: ${(profile.skills || []).join(', ')}
- Locations: ${(profile.preferred_locations || []).join(', ')}
- Work modes: ${(profile.work_modes || []).join(', ')}

Listing:
- Title: ${listing.title}
- Company: ${listing.company}
- Location: ${listing.location || 'unknown'}
- Description: ${String(listing.description || '').slice(0, cfg.jobDescPromptLimit)}`;
    const params = getScoringParams();

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: getModel('scoring'),
        messages: [{ role: 'user', content: prompt }],
        max_tokens: params.maxTokens,
        temperature: params.temperature
      })
    });
    if (!res.ok) return 50;
    const json = await res.json();
    const score = parseInt(json.choices?.[0]?.message?.content?.trim() || '50', 10);
    return isNaN(score) ? 50 : Math.max(0, Math.min(100, score));
  } catch {
    return 50;
  }
}

async function searchWithStagehand(
  admin: any,
  userId: string,
  profile: Record<string, any>,
  platform: JobProvider,
  threshold: number
): Promise<{ saved: Array<Record<string, any>>; extractedCount: number; skippedReason?: string; searchUrl?: string; query?: string }> {
  const { Stagehand } = await import('@browserbasehq/stagehand');
  const apiKey = cleanEnv(process.env.BROWSERBASE_API_KEY);
  const projectId = cleanEnv(process.env.BROWSERBASE_PROJECT_ID);
  if (!apiKey || !projectId) return { saved: [], extractedCount: 0, skippedReason: 'browserbase_not_configured' };

  const context = buildScanContext(profile);
  if (!context.ok) return { saved: [], extractedCount: 0, skippedReason: context.reason };

  const searchUrl = buildProviderSearchUrl(platform, context.query, context.location);

  const stagehand = new Stagehand({ env: 'BROWSERBASE', apiKey, projectId, verbose: 0 } as any);

  try {
    await stagehand.init();
    await (stagehand as any).page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const extracted = await (stagehand as any).extract(
      'Extract all visible job listings. For each listing return: title, company, location, jobUrl, postedAt, and a brief description if visible. Return as JSON array.'
    );

    const listings = Array.isArray(extracted) ? extracted : (extracted as any)?.listings || [];
    const results: Array<Record<string, any>> = [];

    for (const listing of listings.slice(0, cfg.jobScanBatchSize)) {
      const score = await scoreListing(listing, profile);
      if (score < threshold) continue;

      const { data: existing } = await admin
        .from('job_listings')
        .select('id')
        .eq('user_id', userId)
        .eq('source_platform', platform.id)
        .eq('source_url', listing.jobUrl || '')
        .maybeSingle();

      if (existing) continue;

      const { data: saved } = await admin
        .from('job_listings')
        .insert({
          user_id: userId,
          source_platform: platform.id,
          source_url: listing.jobUrl || null,
          title: String(listing.title || '').slice(0, 500),
          company: String(listing.company || '').slice(0, 200),
          location: String(listing.location || '').slice(0, 200),
          description: String(listing.description || '').slice(0, cfg.jobDescStorageLimit),
          status: 'discovered',
          metadata: {
            score,
            cron_discovered: true,
            query: context.query,
            search_url: searchUrl,
            posted_at: listing.postedAt || null,
            scan_recency: context.recency
          }
        })
        .select('id')
        .single();

      if (saved) results.push({ id: saved.id, title: listing.title, score });
    }

    return { saved: results, extractedCount: listings.length, searchUrl, query: context.query };
  } catch (error) {
    return {
      saved: [],
      extractedCount: 0,
      skippedReason: error instanceof Error ? error.message : 'scan_failed',
      searchUrl,
      query: context.query
    };
  } finally {
    try { await stagehand.close(); } catch { /* ignore */ }
  }
}

export async function GET(request: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });

  const browserbaseConfigured = !!(
    cleanEnv(process.env.BROWSERBASE_API_KEY) &&
    cleanEnv(process.env.BROWSERBASE_PROJECT_ID)
  );

  if (!browserbaseConfigured) {
    return NextResponse.json({
      skipped: true,
      reason: 'Browserbase credentials not configured — job scan requires BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID'
    });
  }

  const isManual = request.headers.get('x-cubiqo-manual') === '1';
  let profiles: any[] = [];

  if (isManual) {
    const auth = await requireApiUser(request);
    if (auth.error) return auth.error;

    const { data } = await admin
      .from('job_profiles')
      .select('id,user_id,target_roles,skills,preferred_locations,work_modes,metadata,scan_enabled,score_threshold')
      .eq('user_id', auth.user.id)
      .limit(1);
    profiles = data || [];
  } else {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await admin
      .from('job_profiles')
      .select('id,user_id,target_roles,skills,preferred_locations,work_modes,metadata,scan_enabled,score_threshold')
      .eq('scan_enabled', true)
      .limit(cfg.jobScanProfilesBatch);
    profiles = data || [];
  }

  if (!profiles.length) {
    return NextResponse.json({
      ran: 0,
      reason: isManual ? 'No job profile found for this user' : 'No profiles with scan_enabled=true'
    });
  }

  const results: Array<{
    userId: string;
    scanned: boolean;
    listingsFound: number;
    listingsSaved: number;
    platforms: string[];
    skipped?: string;
  }> = [];

  for (const profile of profiles) {
    const threshold = Number(profile.score_threshold ?? profile.metadata?.score_threshold ?? 60);
    const context = buildScanContext(profile);
    if (!context.ok) {
      await recordScanRun(admin, {
        userId: profile.user_id,
        platform: 'profile',
        listingsFound: 0,
        listingsSaved: 0,
        scoreThreshold: threshold,
        metadata: { skipped: true, reason: context.reason, missing: context.missing }
      });
      results.push({
        userId: profile.user_id,
        scanned: false,
        listingsFound: 0,
        listingsSaved: 0,
        platforms: [],
        skipped: context.reason
      });
      continue;
    }

    const found: string[] = [];
    let listingsFound = 0;
    let listingsSaved = 0;

    for (const platform of enabledScanProviders(profile.metadata?.scan_platforms)) {
      const scan = await searchWithStagehand(admin, profile.user_id, profile, platform, threshold);
      listingsFound += scan.extractedCount;
      listingsSaved += scan.saved.length;
      found.push(`${platform.id}:${scan.saved.length}`);
      await recordScanRun(admin, {
        userId: profile.user_id,
        platform: platform.id,
        listingsFound: scan.extractedCount,
        listingsSaved: scan.saved.length,
        scoreThreshold: threshold,
        metadata: {
          query: scan.query,
          search_url: scan.searchUrl,
          skipped_reason: scan.skippedReason || null,
          scan_recency: context.recency
        }
      });
    }

    results.push({ userId: profile.user_id, scanned: true, listingsFound, listingsSaved, platforms: found });
  }

  return NextResponse.json({ ran: results.length, results });
}
