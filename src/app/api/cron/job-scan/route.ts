import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, cleanEnv, requireApiUser } from '../../_lib/supabase-admin';
import { JOB_SOURCES } from '../../_lib/job-workflows';

const CRON_SECRET = cleanEnv(process.env.CRON_SECRET);

const SEARCH_PLATFORMS = [
  { id: 'linkedin', searchUrl: 'https://www.linkedin.com/jobs/search/?keywords={query}&location={location}' },
  { id: 'indeed', searchUrl: 'https://www.indeed.com/jobs?q={query}&l={location}' },
  { id: 'dice', searchUrl: 'https://www.dice.com/jobs?q={query}&location={location}' },
  { id: 'monster', searchUrl: 'https://www.monster.com/jobs/search?q={query}&where={location}' },
  { id: 'ziprecruiter', searchUrl: 'https://www.ziprecruiter.com/jobs-search?search={query}&location={location}' },
  { id: 'wellfound', searchUrl: 'https://wellfound.com/jobs?query={query}&location={location}' },
  { id: 'greenhouse', searchUrl: 'https://www.google.com/search?q={query}+{location}+site%3Agreenhouse.io' },
  { id: 'lever', searchUrl: 'https://www.google.com/search?q={query}+{location}+site%3Alever.co' },
  { id: 'workday', searchUrl: 'https://www.google.com/search?q={query}+{location}+site%3Amyworkdayjobs.com' },
  { id: 'company_site', searchUrl: 'https://www.google.com/search?q={query}+{location}+careers+apply' }
] as const;

type SearchPlatform = typeof SEARCH_PLATFORMS[number];

function verifyCronSecret(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!CRON_SECRET) return false;
  return token === CRON_SECRET;
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
- Description: ${String(listing.description || '').slice(0, 500)}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cleanEnv(process.env.OPENAI_MODEL) || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0
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
  platform: SearchPlatform,
  threshold: number
): Promise<Array<Record<string, any>>> {
  const { Stagehand } = await import('@browserbasehq/stagehand');
  const apiKey = cleanEnv(process.env.BROWSERBASE_API_KEY);
  const projectId = cleanEnv(process.env.BROWSERBASE_PROJECT_ID);
  if (!apiKey || !projectId) return [];

  const targetRoles = Array.isArray(profile.target_roles) ? profile.target_roles.filter(Boolean) : [];
  const skills = Array.isArray(profile.skills) ? profile.skills.filter(Boolean).slice(0, 4) : [];
  const query = [...targetRoles.slice(0, 2), ...skills.slice(0, 2)].join(' ') || 'remote job';
  const location = (Array.isArray(profile.preferred_locations) ? profile.preferred_locations[0] : null) || 'Remote United States';
  const searchUrl = platform.searchUrl
    .replace('{query}', encodeURIComponent(query))
    .replace('{location}', encodeURIComponent(location));

  const stagehand = new Stagehand({ env: 'BROWSERBASE', apiKey, projectId, verbose: 0 } as any);
  const sessionId = `cron-job-scan-${userId}-${platform.id}-${Date.now()}`;

  try {
    await stagehand.init();
    await (stagehand as any).page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const extracted = await (stagehand as any).extract(
      'Extract all visible job listings. For each listing return: title, company, location, jobUrl, postedAt, and a brief description if visible. Return as JSON array.'
    );

    const listings = Array.isArray(extracted) ? extracted : (extracted as any)?.listings || [];
    const results: Array<Record<string, any>> = [];

    for (const listing of listings.slice(0, 15)) {
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
          description: String(listing.description || '').slice(0, 3000),
          status: 'discovered',
          metadata: {
            score,
            cron_discovered: true,
            query,
            search_url: searchUrl,
            posted_at: listing.postedAt || null
          }
        })
        .select('id')
        .single();

      if (saved) results.push({ id: saved.id, title: listing.title, score });
    }

    return results;
  } catch {
    return [];
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
      .select('id,user_id,target_roles,skills,preferred_locations,work_modes,metadata,score_threshold')
      .eq('user_id', auth.user.id)
      .limit(1);
    profiles = data || [];
  } else {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await admin
      .from('job_profiles')
      .select('id,user_id,target_roles,skills,preferred_locations,work_modes,metadata,score_threshold')
      .eq('scan_enabled', true)
      .limit(20);
    profiles = data || [];
  }

  if (!profiles.length) {
    return NextResponse.json({
      ran: 0,
      reason: isManual ? 'No job profile found for this user' : 'No profiles with scan_enabled=true'
    });
  }

  const results: Array<{ userId: string; found: number; platforms: string[] }> = [];

  for (const profile of profiles) {
    const threshold = Number(profile.score_threshold ?? profile.metadata?.score_threshold ?? 60);
    const enabledPlatforms = Array.isArray(profile.metadata?.scan_platforms)
      ? profile.metadata.scan_platforms.filter((id: unknown) => JOB_SOURCES.includes(String(id) as any))
      : ['linkedin', 'indeed', 'dice', 'monster', 'greenhouse', 'lever', 'workday'];
    const found: string[] = [];

    for (const platform of SEARCH_PLATFORMS.filter(p => enabledPlatforms.includes(p.id))) {
      const listings = await searchWithStagehand(admin, profile.user_id, profile, platform, threshold);
      if (listings.length) found.push(`${platform.id}:${listings.length}`);
    }

    results.push({ userId: profile.user_id, found: found.length, platforms: found });
  }

  return NextResponse.json({ ran: results.length, results });
}
