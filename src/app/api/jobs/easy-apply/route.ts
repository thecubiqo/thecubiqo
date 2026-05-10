import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing, missingMigrationResponse, cleanEnv } from '../../_lib/supabase-admin';
import { createBrowserSession, closeBrowserSession } from '../../_lib/browser-sessions';
import { writeAudit } from '../../_lib/v2-actions';
import { tailorApplicationForJob } from '../../_lib/llm-tailoring';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Supported platforms for Easy Apply / one-click flows
const EASY_APPLY_PLATFORMS = ['linkedin', 'indeed', 'dice', 'monster'];

function detectPlatform(url: string): string {
  const h = new URL(url).hostname.toLowerCase();
  if (h.includes('linkedin')) return 'linkedin';
  if (h.includes('indeed')) return 'indeed';
  if (h.includes('dice')) return 'dice';
  if (h.includes('monster')) return 'monster';
  if (h.includes('greenhouse')) return 'greenhouse';
  if (h.includes('lever')) return 'lever';
  if (h.includes('workday')) return 'workday';
  return 'ats';
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
    .limit(50);

  return { profile, resume, answers: answers || [] };
}

function buildProfileInstruction(profile: any, resume: any, answers: any[]) {
  const name = profile?.full_name || 'Applicant';
  const phone = profile?.phone || '';
  const email = profile?.email || '';
  const city = profile?.city || 'Remote';
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
Location preference: Remote, US
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
  const mode = (body.mode === 'submit') ? 'submit' : 'review'; // review = stop before submit

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

  // Auto-tailor resume if not already done
  let tailoredResume = resume;
  if (listing && listing.description && (!listing.metadata?.tailoring_status || listing.metadata?.tailoring_status === 'pending')) {
    try {
      const tailoring = await tailorApplicationForJob({
        jobTitle: listing.title,
        jobCompany: listing.company || '',
        jobDescription: listing.description,
        baseResume: resume?.resume_content || resume?.content || '',
        profileRoles: profile?.target_roles || ['Business Analyst'],
        profileSkills: profile?.skills || [],
      });

      // Save tailored resume version
      const { data: savedResume } = await auth.supabase
        .from('resume_versions')
        .insert({
          user_id: auth.user.id,
          name: `${listing.title} @ ${listing.company} — tailored`,
          target_role: listing.title,
          resume_content: tailoring.tailoredResumeSummary,
          ats_score: tailoring.score,
          cover_letter: tailoring.coverLetter,
          metadata: { listing_id: listingId, tailoring_source: tailoring.tailoringSource }
        })
        .select('*')
        .single();

      if (savedResume) {
        tailoredResume = savedResume;
        await auth.supabase
          .from('job_listings')
          .update({
            metadata: {
              ...(listing.metadata || {}),
              tailoring_status: 'done',
              tailored_resume_id: savedResume.id,
              ats_score: tailoring.score
            },
            status: 'ready'
          })
          .eq('id', listingId!);
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
    url: targetUrl,
    browser_session_id: sessionId,
    session_mode: 'persistent'
  });
  if ('error' in sessionResult && sessionResult.error) {
    return NextResponse.json({ error: 'Browser session failed to open' }, { status: 500 });
  }

  let screenshotUrl: string | null = null;
  let applyStatus: 'ready_to_submit' | 'submitted' | 'failed' = 'ready_to_submit';
  let applyError: string | null = null;

  try {
    const { auditedSocialAct, captureQueueReceipt } = await import('../../actions/social-post-queue/platforms/shared');
    const { Stagehand } = await import('@browserbasehq/stagehand');
    const stagehand = new Stagehand({ env: 'BROWSERBASE', apiKey: bbKey, projectId: bbProject, verbose: 0 } as any);
    await stagehand.init();

    const page = (stagehand as any).page;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

    // Platform-specific Easy Apply
    if (platform === 'linkedin') {
      await (stagehand as any).act('Find and click the Easy Apply button. Do not click the final Submit button yet.');
      await (stagehand as any).act(`Fill in all visible application form fields using this profile data:\n${profileInstruction}\nDo not submit yet.`);
      await (stagehand as any).act('Click Next or Continue until you reach the final Review step. Stop before Submit application.');

      if (mode === 'submit') {
        await (stagehand as any).act('Click Submit application now. This is explicitly authorized.');
        applyStatus = 'submitted';
      }
    } else if (platform === 'indeed') {
      await (stagehand as any).act('Find and click the Apply Now or Indeed Apply button.');
      await (stagehand as any).act(`Fill all required fields:\n${profileInstruction}`);
      await (stagehand as any).act('Proceed through all steps until the final review.');
      if (mode === 'submit') {
        await (stagehand as any).act('Submit the application now. This is explicitly authorized.');
        applyStatus = 'submitted';
      }
    } else if (platform === 'dice') {
      await (stagehand as any).act('Click Apply or Easy Apply button.');
      await (stagehand as any).act(`Complete all required fields:\n${profileInstruction}`);
      if (mode === 'submit') {
        await (stagehand as any).act('Submit the application. This is explicitly authorized.');
        applyStatus = 'submitted';
      }
    } else {
      // Generic ATS fallback
      await (stagehand as any).act('Find and click the Apply button or Apply for this job.');
      await (stagehand as any).act(`Fill all required application fields:\n${profileInstruction}`);
      if (mode === 'submit') {
        await (stagehand as any).act('Submit the application now. This is explicitly authorized.');
        applyStatus = 'submitted';
      }
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
      apply_url: targetUrl,
      status: applyStatus,
      screenshot_url: screenshotUrl,
      error: applyError,
      submitted_at: applyStatus === 'submitted' ? new Date().toISOString() : null,
      metadata: { mode, session_id: sessionId, tailored_resume_id: tailoredResume?.id }
    })
    .select('id, status, screenshot_url, submitted_at')
    .single();

  // Update listing status
  if (listingId) {
    await auth.supabase
      .from('job_listings')
      .update({
        status: applyStatus === 'submitted' ? 'submitted' : applyStatus === 'failed' ? 'failed' : 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);
  }

  await writeAudit(auth, {
    actionType: 'job_easy_apply',
    toolName: 'job_easy_apply',
    status: applyStatus === 'failed' ? 'failed' : 'completed',
    message: applyStatus === 'submitted'
      ? `Auto-applied to ${listing?.title || 'job'} @ ${listing?.company || 'company'} via ${platform}`
      : `Application staged for review on ${platform}`,
    result: { applicationId: application?.id, screenshotUrl, platform, mode },
    screenshotUrl: screenshotUrl || undefined
  });

  await closeBrowserSession(auth, sessionId, {
    status: applyStatus === 'failed' ? 'failed' : 'closed',
    reason: 'job_easy_apply_done'
  }).catch(() => null);

  return NextResponse.json({
    applied: applyStatus === 'submitted',
    status: applyStatus,
    platform,
    application: application || null,
    screenshotUrl,
    error: applyError,
    listingId,
    mode
  });
}
