import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing, missingMigrationResponse, cleanEnv } from '../../_lib/supabase-admin';
import { assertSafeUrl } from '../../_lib/ssrf-guard';
import { createBrowserSession, closeBrowserSession } from '../../_lib/browser-sessions';
import { writeAudit } from '../../_lib/v2-actions';
import { tailorApplicationForJob } from '../../_lib/llm-tailoring';
import { resolveJobProviderForUrl } from '@/next/lib/jobs/job-provider-registry';
import { cfg } from '@/next/lib/config/runtime';

export const runtime = 'nodejs';
export const maxDuration = 60;

function detectPlatform(url: string): string {
  return resolveJobProviderForUrl(url)?.id || 'company_site';
}

function extractJdKeywords(description: string, skills: unknown): string[] {
  const text = String(description || '').toLowerCase();
  const skillMatches = Array.isArray(skills)
    ? skills
        .map(skill => String(skill || '').trim())
        .filter(skill => skill && text.includes(skill.toLowerCase()))
    : [];
  const titleWords = String(description || '')
    .match(/\b[A-Z][A-Za-z+#.]{2,}\b/g)
    ?.filter(word => !['The', 'And', 'For', 'With', 'This', 'That'].includes(word))
    .slice(0, 8) || [];
  return Array.from(new Set([...skillMatches, ...titleWords])).slice(0, 20);
}

async function getProfileData(auth: any) {
  const { data: profile } = await auth.supabase
    .from('job_profiles')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  const { data: resume } = await auth.supabase
    .from('resume_versions')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: answers } = await auth.supabase
    .from('application_answers')
    .select('question, answer, platform_hint')
    .eq('user_id', auth.user.id)
    .limit(cfg.applicationAnswersBatch);

  return { profile, resume, answers: answers || [] };
}

function buildProfileInstruction(profile: any, resume: any, answers: any[]) {
  const name = profile?.full_name || 'Applicant';
  const phone = profile?.phone || '';
  const email = profile?.email || '';
  const city = profile?.city || 'Remote';
  const locationPreference = [
    ...(Array.isArray(profile?.preferred_locations) ? profile.preferred_locations : []),
    ...(Array.isArray(profile?.work_modes) ? profile.work_modes : [])
  ].map(item => String(item || '').trim()).filter(Boolean).join(', ') || city;
  const linkedinUrl = profile?.linkedin_url || '';
  const uscStatus = profile?.usc ? 'U.S. Citizen — no sponsorship required' : '';
  const salary = profile?.desired_salary || '';
  const availability = profile?.availability || '2 weeks notice';

  const answerLines = answers.map(a => `- ${a.question}: ${a.answer}`).join('\n');

  return `
Applicant profile (use exactly as provided):
Name: ${name}${uscStatus ? ` | ${uscStatus}` : ''}
Email: ${email}
Phone: ${phone}
Location preference: ${locationPreference}
LinkedIn: ${linkedinUrl}
${salary ? `Desired salary: ${salary}` : ''}
Availability: ${availability}

Pre-answered application questions:
${answerLines || '- Work authorization: Yes, U.S. Citizen\n- Sponsorship required: No\n- Remote: Yes\n- Willing to relocate: No'}

Resume summary (use as reference for experience fields):
${(resume?.resume_content || resume?.content || '').slice(0, 800)}
`.trim();
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const listingId = body.listing_id ? String(body.listing_id) : null;
  const jobUrl = body.job_url ? String(body.job_url) : null;
  const requestedMode = body.mode === 'submit' ? 'submit' : 'review';
  const mode = 'review'; // hard stop: this route prepares the application and never clicks final submit

  if (!listingId && !jobUrl) {
    return NextResponse.json({ error: 'listing_id or job_url required' }, { status: 400 });
  }

  // Load the job listing
  let listing: any = null;
  if (listingId) {
    const { data } = await auth.supabase
      .from('job_listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    listing = data;
  }

  const targetUrl = jobUrl || listing?.source_url;
  if (!targetUrl) return NextResponse.json({ error: 'No job URL available' }, { status: 400 });

  // SSRF guard: job_url is caller-controlled and drives a real cloud browser.
  // Block internal/metadata/private targets so this can't be turned into a
  // server-side request-forgery / internal-network drive primitive. Public
  // career sites (the intended use) pass through unchanged.
  const safeTarget = await assertSafeUrl(targetUrl, { allowHttp: true });
  if (!safeTarget.ok) {
    return NextResponse.json({ error: `Job URL not allowed (${safeTarget.reason})` }, { status: 400 });
  }
  const navUrl = safeTarget.url.toString();

  const platform = detectPlatform(targetUrl);

  // Check Browserbase config
  const bbKey = cleanEnv(process.env.BROWSERBASE_API_KEY);
  const bbProject = cleanEnv(process.env.BROWSERBASE_PROJECT_ID);
  if (!bbKey || !bbProject) {
    return NextResponse.json({
      error: 'BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID required for browser automation',
      platform
    }, { status: 501 });
  }

  const { profile, resume, answers } = await getProfileData(auth);

  // Auto-tailor a resume version if not already done. This appends a new
  // version only; the base resume is never updated or overwritten.
  let tailoredResume = resume;
  let tailoringPreview: Record<string, unknown> | null = null;
  let tailoredResumeVersionId: string | null = null;
  if (listing && listing.description && (!listing.metadata?.tailoring_status || listing.metadata?.tailoring_status === 'pending')) {
    try {
      const tailoring = await tailorApplicationForJob({
        jobTitle: listing.title,
        jobCompany: listing.company || '',
        jobDescription: listing.description,
        baseResume: resume?.resume_content || resume?.content || '',
        profileRoles: Array.isArray(profile?.target_roles) ? profile.target_roles : [],
        profileSkills: profile?.skills || [],
      });

      tailoringPreview = {
        suggestedName: `${listing.title} @ ${listing.company} — tailored`,
        targetRole: listing.title,
        resumeContent: tailoring.tailoredResumeSummary,
        atsScore: tailoring.score,
        scoreSummary: tailoring.scoreSummary,
        coverLetter: tailoring.coverLetter,
        tailoringSource: tailoring.tailoringSource,
        saveRequiresAction: 'resume_version_write'
      };
      const jdKeywords = extractJdKeywords(listing.description, profile?.skills);
      tailoredResume = {
        ...resume,
        resume_content: tailoring.tailoredResumeSummary,
        content: tailoring.tailoredResumeSummary,
        cover_letter: tailoring.coverLetter,
        ats_score: tailoring.score
      };

      const { data: savedResume } = await auth.supabase
        .from('resume_versions')
        .insert({
          user_id: auth.user.id,
          job_profile_id: profile?.id || null,
          name: String(tailoringPreview.suggestedName),
          resume_content: tailoring.tailoredResumeSummary,
          content: tailoring.tailoredResumeSummary,
          resume_format: 'plain_text',
          target_role: listing.title,
          company: listing.company || null,
          match_score: tailoring.score,
          jd_keywords: jdKeywords,
          cover_letter: tailoring.coverLetter,
          cover_letter_content: tailoring.coverLetter,
          ats_score: tailoring.score,
          change_summary: tailoring.scoreSummary,
          diff_preview: {
            before: { resumeVersionId: resume?.id || null },
            after: {
              targetRole: listing.title,
              company: listing.company || null,
              matchScore: tailoring.score,
              jdKeywords
            }
          },
          source_payload: {
            source: 'easy_apply_tailoring',
            jobListingId: listing.id,
            tailoringSource: tailoring.tailoringSource,
            appendOnly: true
          },
          metadata: {
            job_listing_id: listing.id,
            company: listing.company || null,
            match_score: tailoring.score,
            jd_keywords: jdKeywords,
            cover_letter_content: tailoring.coverLetter,
            tailoring_source: tailoring.tailoringSource
          }
        })
        .select('id')
        .single();

      tailoredResumeVersionId = savedResume?.id || null;

      if (listingId) {
        await auth.supabase
          .from('job_listings')
          .update({
            metadata: {
              ...(listing.metadata || {}),
              tailoring_status: 'preview_ready',
              tailoring_preview: tailoringPreview,
              ats_score: tailoring.score,
              tailored_resume_id: tailoredResumeVersionId,
              resume_version_write_required: !tailoredResumeVersionId
            },
            status: tailoredResumeVersionId ? 'ready_to_apply' : 'ready'
          })
          .eq('id', listingId);
      }
    } catch { /* tailoring failure is non-fatal */ }
  }

  const profileInstruction = buildProfileInstruction(profile, tailoredResume || resume, answers);

  // Mark as applying
  if (listingId) {
    await auth.supabase
      .from('job_listings')
      .update({ status: 'applying', updated_at: new Date().toISOString() })
      .eq('id', listingId);
  }

  const sessionId = crypto.randomUUID();

  // Create browser session
  const sessionResult = await createBrowserSession(auth, '' as string, {
    url: navUrl,
    browser_session_id: sessionId,
    session_mode: 'persistent'
  });
  if ('error' in sessionResult && sessionResult.error) {
    return NextResponse.json({ error: 'Browser session failed to open' }, { status: 500 });
  }

  let screenshotUrl: string | null = null;
  let applyStatus: 'ready_to_submit' | 'failed' = 'ready_to_submit';
  let applyError: string | null = null;

  try {
    const { Stagehand } = await import('@browserbasehq/stagehand');
    const stagehand = new Stagehand({ env: 'BROWSERBASE', apiKey: bbKey, projectId: bbProject, verbose: 0 } as any);
    await stagehand.init();

    const page = (stagehand as any).page;
    await page.goto(navUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

    // Platform-specific Easy Apply
    if (platform === 'linkedin') {
      await (stagehand as any).act('Find and click the Easy Apply button. Do not click the final Submit button yet.');
      await (stagehand as any).act(`Fill in all visible application form fields using this profile data:\n${profileInstruction}\nDo not submit yet.`);
      await (stagehand as any).act('Click Next or Continue until you reach the final Review step. Stop before Submit application.');
    } else if (platform === 'indeed') {
      await (stagehand as any).act('Find and click the Apply Now or Indeed Apply button.');
      await (stagehand as any).act(`Fill all required fields:\n${profileInstruction}`);
      await (stagehand as any).act('Proceed through all steps until the final review. Stop before submitting.');
    } else if (platform === 'dice') {
      await (stagehand as any).act('Click Apply or Easy Apply button.');
      await (stagehand as any).act(`Complete all required fields using this profile data:\n${profileInstruction}\nStop before the final submit button.`);
    } else {
      // Generic ATS/company-site fallback. This is intentionally broad so the
      // user can bring any career-site URL; the final submit still stays human.
      await (stagehand as any).act('Find and click the Apply button or Apply for this job.');
      await (stagehand as any).act(`Fill all required application fields using this profile data:\n${profileInstruction}\nStop at the final review or submit screen without submitting.`);
    }

    // Capture screenshot
    const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });
    if (screenshot) {
      const screenshotBuffer = Buffer.from(screenshot as string, 'base64');
      const path = `screenshots/job-apply/${auth.user.id}/${sessionId}.png`;
      const { data: stored } = await auth.supabase.storage
        .from('cubiqo-uploads')
        .upload(path, screenshotBuffer, { contentType: 'image/png', upsert: true });
      if (stored) {
        const { data: pub } = auth.supabase.storage.from('cubiqo-uploads').getPublicUrl(path);
        screenshotUrl = pub.publicUrl;
      }
    }

    await stagehand.close();
  } catch (err: any) {
    applyStatus = 'failed';
    applyError = err.message || 'Apply automation failed';
  }

  // Save application record
  const { data: application } = await auth.supabase
    .from('job_applications')
    .insert({
      user_id: auth.user.id,
      listing_id: listingId || null,
      platform,
      browser_session_id: sessionId,
      job_url: targetUrl,
      job_title: listing?.title || null,
      company: listing?.company || null,
      apply_url: targetUrl,
      status: applyStatus,
      screenshot_url: screenshotUrl,
      error: applyError,
      submitted_at: null,
      metadata: {
        mode,
        requested_mode: requestedMode,
        final_submit_blocked: requestedMode === 'submit',
        session_id: sessionId,
        tailoring_preview: tailoringPreview,
        tailored_resume_id: tailoredResumeVersionId,
        resume_version_write_required: Boolean(tailoringPreview && !tailoredResumeVersionId)
      }
    })
    .select('id, status, screenshot_url, submitted_at')
    .single();

  // Update listing status
  if (listingId) {
    await auth.supabase
      .from('job_listings')
      .update({
        status: applyStatus === 'failed' ? 'failed' : 'ready_to_submit',
        metadata: {
          ...(listing?.metadata || {}),
          tracker_status: applyStatus === 'failed' ? 'failed' : 'ready_to_submit',
          tailored_resume_id: tailoredResumeVersionId || listing?.metadata?.tailored_resume_id || null,
          tailoring_status: tailoredResumeVersionId ? 'saved' : listing?.metadata?.tailoring_status || null,
          tailoring_preview: tailoringPreview || listing?.metadata?.tailoring_preview || null
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);
  }

  await writeAudit(auth, {
    actionType: 'job_easy_apply',
    toolName: 'job_easy_apply',
    status: applyStatus === 'failed' ? 'failed' : 'completed',
    message: `Application staged for review on ${platform}; final submit requires a user action`,
    result: { applicationId: application?.id, screenshotUrl, platform, mode, resumeVersionSaved: Boolean(tailoredResumeVersionId), tailoredResumeVersionId },
    screenshotUrl: screenshotUrl || undefined
  });

  await closeBrowserSession(auth, sessionId, {
    status: applyStatus === 'failed' ? 'failed' : 'closed',
    reason: 'job_easy_apply_done'
  }).catch(() => null);

  return NextResponse.json({
    applied: false,
    status: applyStatus,
    platform,
    application: application || null,
    screenshotUrl,
    error: applyError,
    listingId,
    mode,
    requestedMode,
    tailoringPreview,
    resumeVersionSaved: Boolean(tailoredResumeVersionId),
    tailoredResumeVersionId,
    finalSubmitBlocked: requestedMode === 'submit'
  });
}
