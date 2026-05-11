import { NextResponse } from 'next/server';
import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';
import { getActiveBrowserSession, normalizeBrowserSessionId } from './browser-sessions';
import { tailorApplicationForJob } from './llm-tailoring';

export const JOB_ACTION_TYPES = [
  'job_search_save',
  'job_application_prepare',
  'job_application_submit_approved'
] as const;

export type JobActionType = typeof JOB_ACTION_TYPES[number];

export const JOB_SOURCES = [
  'linkedin',
  'indeed',
  'dice',
  'monster',
  'greenhouse',
  'lever',
  'workday',
  'ziprecruiter',
  'wellfound',
  'company_site',
  'ats',
  'other'
] as const;
type JobSource = typeof JOB_SOURCES[number];

type JobErrorResult = { error: Response | Error };
type JobBlockedResult = { blocked: string; status?: number };

export function isJobAction(actionType: string): actionType is JobActionType {
  return JOB_ACTION_TYPES.includes(actionType as JobActionType);
}

function normalizeText(value: unknown, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function normalizeNullableText(value: unknown, max = 500) {
  const text = normalizeText(value, max);
  return text || null;
}

function normalizeJsonObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeJsonArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20);
}

function normalizeAnswerRows(value: unknown) {
  return normalizeJsonArray(value)
    .map(answer => normalizeJsonObject(answer))
    .map((answer, index) => ({
      question: normalizeText(answer.question, 300) || `Application question ${index + 1}`,
      answer: normalizeText(answer.answer, 1200),
      platformHint: normalizeText(answer.platform_hint || answer.platformHint, 80) || 'all',
      source: normalizeText(answer.source, 80) || 'saved_answer'
    }))
    .filter(answer => answer.question && answer.answer);
}

export function normalizeJobSource(value: unknown, urlValue?: unknown): JobSource | null {
  const direct = normalizeText(value, 40).toLowerCase();
  if (JOB_SOURCES.includes(direct as JobSource)) return direct as JobSource;

  const url = normalizeText(urlValue, 1000).toLowerCase();
  if (url.includes('linkedin.')) return 'linkedin';
  if (url.includes('indeed.')) return 'indeed';
  if (url.includes('dice.')) return 'dice';
  if (url.includes('monster.')) return 'monster';
  if (url.includes('greenhouse.')) return 'greenhouse';
  if (url.includes('lever.')) return 'lever';
  if (url.includes('workday.')) return 'workday';
  if (url.includes('ziprecruiter.')) return 'ziprecruiter';
  if (url.includes('wellfound.')) return 'wellfound';
  if (url) return 'company_site';
  return null;
}

function normalizeUrl(value: unknown) {
  const raw = normalizeText(value, 1200);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalizePostedAt(value: unknown) {
  const raw = normalizeText(value, 80);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapJobListing(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    browserSessionId: row.browser_session_id,
    sourcePlatform: row.source_platform,
    sourceUrl: row.source_url,
    externalId: row.external_id,
    title: row.title,
    company: row.company,
    location: row.location,
    description: row.description,
    employmentType: row.employment_type,
    compensation: row.compensation,
    postedAt: row.posted_at,
    discoveredAt: row.discovered_at,
    applyUrl: row.apply_url,
    status: row.status,
    raw: row.raw || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapApplicationReview(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    submitApprovalId: row.submit_approval_id,
    browserSessionId: row.browser_session_id,
    jobListingId: row.job_listing_id,
    sourcePlatform: row.source_platform,
    targetUrl: row.target_url,
    status: row.status,
    candidateName: row.candidate_name,
    candidateEmail: row.candidate_email,
    candidatePhone: row.candidate_phone,
    resumeSummary: row.resume_summary,
    coverLetter: row.cover_letter,
    answers: row.answers || [],
    submissionPayload: row.submission_payload || {},
    externalSubmissionPerformed: Boolean(row.external_submission_performed),
    preparedAt: row.prepared_at,
    approvedAt: row.approved_at,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapJobApplication(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    browserSessionId: row.browser_session_id,
    platform: row.platform,
    jobUrl: row.job_url,
    jobTitle: row.job_title,
    company: row.company,
    status: row.status,
    screenshotUrl: row.screenshot_url,
    accessibilityTreeSnapshot: row.accessibility_tree_snapshot || null,
    error: row.error,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    cancelledAt: row.cancelled_at
  };
}

async function requireActiveBrowserSessionIfProvided(
  auth: ApiUserContext,
  browserSessionId: string
): Promise<{ browserSessionId: string | null } | JobErrorResult | JobBlockedResult> {
  if (!browserSessionId) return { browserSessionId: null };
  const sessionResult = await getActiveBrowserSession(auth, browserSessionId);
  if ('error' in sessionResult && sessionResult.error) return sessionResult;
  if ('blocked' in sessionResult && sessionResult.blocked) {
    return { blocked: sessionResult.blocked, status: 404 };
  }
  return { browserSessionId };
}

function normalizeListingInput(input: unknown, defaultSource: JobSource | null, fallbackUrl?: unknown) {
  const item = normalizeJsonObject(input);
  const sourceUrl = normalizeUrl(
    item.source_url ||
      item.sourceUrl ||
      item.url ||
      item.jobUrl ||
      item.apply_url ||
      item.applyUrl ||
      fallbackUrl
  );
  const sourcePlatform = normalizeJobSource(item.source_platform || item.sourcePlatform || item.platform || defaultSource, sourceUrl);
  const title = normalizeText(item.title || item.role || item.position, 220);
  const company = normalizeText(item.company || item.company_name || item.companyName || item.employer, 220);

  if (!sourcePlatform || !title || !company) return null;

  return {
    source_platform: sourcePlatform,
    source_url: sourceUrl,
    external_id: normalizeNullableText(item.external_id || item.externalId || item.job_id || item.jobId, 180),
    title,
    company,
    location: normalizeNullableText(item.location, 220),
    description: normalizeNullableText(item.description || item.summary, 5000),
    employment_type: normalizeNullableText(item.employment_type || item.employmentType || item.type, 160),
    compensation: normalizeNullableText(item.compensation || item.salary || item.pay, 160),
    posted_at: normalizePostedAt(item.posted_at || item.postedAt || item.datePosted),
    apply_url: normalizeUrl(item.apply_url || item.applyUrl || item.apply || sourceUrl),
    raw: item
  };
}

export async function saveJobSearch(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>
): Promise<{ listings: ReturnType<typeof mapJobListing>[]; browserSessionId: string | null } | JobErrorResult | JobBlockedResult> {
  const browserSessionId = normalizeBrowserSessionId(payload.browserSessionId ?? payload.browser_session_id);
  const sessionCheck = await requireActiveBrowserSessionIfProvided(auth, browserSessionId);
  if (!('browserSessionId' in sessionCheck)) return sessionCheck;

  const defaultSource = normalizeJobSource(
    payload.sourcePlatform || payload.source_platform || payload.platform,
    payload.sourceUrl || payload.source_url || payload.url
  );
  const rawListings = Array.isArray(payload.listings)
    ? payload.listings
    : Array.isArray(payload.extractedListings)
      ? payload.extractedListings
      : [];

  const rows = rawListings
    .map(item => normalizeListingInput(item, defaultSource, payload.sourceUrl || payload.source_url || payload.url))
    .filter(Boolean)
    .slice(0, 25)
    .map(item => ({
      ...item,
      user_id: auth.user.id,
      approval_id: approvalId,
      browser_session_id: sessionCheck.browserSessionId
    }));

  if (!rows.length) {
    return {
      blocked: 'No valid job listings were found in the payload. Each listing needs a title, company, and recognizable job URL or platform.',
      status: 400
    };
  }

  const { data, error } = await auth.supabase
    .from('job_listings')
    .insert(rows)
    .select('id,approval_id,browser_session_id,source_platform,source_url,external_id,title,company,location,description,employment_type,compensation,posted_at,discovered_at,apply_url,status,raw,created_at,updated_at');

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('job-workflows', 'job_listings') };
    return { error };
  }

  return {
    listings: (data || []).map(mapJobListing),
    browserSessionId: sessionCheck.browserSessionId
  };
}

export async function listJobWorkflowState(auth: ApiUserContext): Promise<{
  listings: ReturnType<typeof mapJobListing>[];
  reviews: ReturnType<typeof mapApplicationReview>[];
  applications: ReturnType<typeof mapJobApplication>[];
} | JobErrorResult> {
  const [listingsResult, reviewsResult, applicationsResult] = await Promise.all([
    auth.supabase
      .from('job_listings')
      .select('id,approval_id,browser_session_id,source_platform,source_url,external_id,title,company,location,description,employment_type,compensation,posted_at,discovered_at,apply_url,status,raw,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    auth.supabase
      .from('job_application_reviews')
      .select('id,approval_id,submit_approval_id,browser_session_id,job_listing_id,source_platform,target_url,status,candidate_name,candidate_email,candidate_phone,resume_summary,cover_letter,answers,submission_payload,external_submission_performed,prepared_at,approved_at,submitted_at,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    auth.supabase
      .from('job_applications')
      .select('id,approval_id,browser_session_id,platform,job_url,job_title,company,status,screenshot_url,accessibility_tree_snapshot,error,metadata,created_at,updated_at,submitted_at,cancelled_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  if (listingsResult.error) {
    if (safeTableMissing(listingsResult.error)) return { error: missingMigrationResponse('job-workflows', 'job_listings') };
    return { error: listingsResult.error };
  }
  if (reviewsResult.error) {
    if (safeTableMissing(reviewsResult.error)) return { error: missingMigrationResponse('job-workflows', 'job_application_reviews') };
    return { error: reviewsResult.error };
  }
  if (applicationsResult.error) {
    if (safeTableMissing(applicationsResult.error)) return { error: missingMigrationResponse('job-apply', 'job_applications') };
    return { error: applicationsResult.error };
  }

  return {
    listings: (listingsResult.data || []).map(mapJobListing),
    reviews: (reviewsResult.data || []).map(mapApplicationReview),
    applications: (applicationsResult.data || []).map(mapJobApplication)
  };
}

async function loadJobListing(auth: ApiUserContext, jobListingId: string) {
  const { data, error } = await auth.supabase
    .from('job_listings')
    .select('id,approval_id,browser_session_id,source_platform,source_url,external_id,title,company,location,description,employment_type,compensation,posted_at,discovered_at,apply_url,status,raw,created_at,updated_at')
    .eq('id', jobListingId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('job-workflows', 'job_listings') };
    return { error };
  }
  if (!data) return { blocked: 'Job listing not found', status: 404 };
  return { listing: mapJobListing(data) };
}

function buildSubmissionPayload(listing: ReturnType<typeof mapJobListing>, payload: Record<string, unknown>) {
  const candidate = normalizeJsonObject(payload.candidate);
  const answers = normalizeAnswerRows(payload.answers);
  const applicationPacket = normalizeJsonObject(payload.applicationPacket || payload.application_packet);
  const review = {
    sourcePlatform: listing.sourcePlatform,
    targetUrl: normalizeUrl(payload.targetUrl || payload.target_url || listing.applyUrl || listing.sourceUrl),
    job: {
      title: listing.title,
      company: listing.company,
      location: listing.location,
      sourceUrl: listing.sourceUrl,
      applyUrl: listing.applyUrl
    },
    candidate: {
      name: normalizeNullableText(payload.candidateName || payload.candidate_name || candidate.name, 180),
      email: normalizeNullableText(payload.candidateEmail || payload.candidate_email || candidate.email, 240),
      phone: normalizeNullableText(payload.candidatePhone || payload.candidate_phone || candidate.phone, 80)
    },
    resumeSummary: normalizeNullableText(payload.resumeSummary || payload.resume_summary, 5000),
    coverLetter: normalizeNullableText(payload.coverLetter || payload.cover_letter, 8000),
    answers,
    recruiterMessage: normalizeNullableText(payload.recruiterMessage || payload.recruiter_message || applicationPacket.recruiterMessage || applicationPacket.recruiter_message, 3000),
    missingAnswerPrompts: normalizeJsonArray(payload.missingAnswerPrompts || payload.missing_answer_prompts || applicationPacket.missingAnswerPrompts || applicationPacket.missing_answer_prompts).map(item => normalizeJsonObject(item)),
    applicationPacket,
    attachments: normalizeJsonArray(payload.attachments).map(item => normalizeJsonObject(item)),
    disclaimer: 'Review only. CubiQo will not submit this to a job board without a later explicit approval and visible runtime.'
  };

  return review;
}

function profileField(profile: Record<string, any> | null | undefined, key: string) {
  return normalizeText(profile?.[key] ?? profile?.profile_payload?.[key] ?? profile?.metadata?.[key], 500);
}

function buildRecruiterMessage(input: {
  listing: ReturnType<typeof mapJobListing>;
  profile: Record<string, any> | null;
  autoTailoring: { score?: number; scoreSummary?: string; tailoredResumeSummary?: string };
}) {
  const firstRole = Array.isArray(input.profile?.target_roles) ? input.profile?.target_roles?.[0] : '';
  const skills = Array.isArray(input.profile?.skills) ? input.profile.skills.slice(0, 3).filter(Boolean).join(', ') : '';
  const fit = input.autoTailoring.score
    ? `The role looks like a ${input.autoTailoring.score}% fit based on my profile and the job description.`
    : 'The role aligns with my current career target and experience.';
  const roleLine = firstRole ? `I have been targeting ${firstRole} roles` : 'I am exploring roles aligned with this opportunity';
  const skillLine = skills ? `, with recent focus on ${skills}` : '';

  return [
    `Hi ${input.listing.company || 'there'} team,`,
    `${roleLine}${skillLine}. ${fit}`,
    `I am interested in the ${input.listing.title} role and would appreciate consideration for the next step.`,
    'Best regards'
  ].join('\n');
}

function buildMissingAnswerPrompts(listing: ReturnType<typeof mapJobListing>, profile: Record<string, any> | null, savedAnswers: Array<Record<string, any>>) {
  const lowerDescription = `${listing.description || ''} ${listing.raw ? JSON.stringify(listing.raw) : ''}`.toLowerCase();
  const savedText = savedAnswers.map(answer => `${answer.question || ''} ${answer.answer || ''}`).join(' ').toLowerCase();
  const prompts: Array<{ field: string; question: string; reason: string; requiredUserInput: boolean }> = [];

  const maybeAdd = (field: string, question: string, reason: string, profileValue?: string) => {
    if (profileValue || savedText.includes(field.toLowerCase())) return;
    prompts.push({ field, question, reason, requiredUserInput: true });
  };

  if (/\b(portfolio|github|website|work samples?)\b/.test(lowerDescription)) {
    maybeAdd('portfolio_url', 'What portfolio, GitHub, or work-sample URL should CubiQo use for this role?', 'The job description appears to ask for proof-of-work links.', profileField(profile, 'portfolio_url') || profileField(profile, 'github_url'));
  }
  if (/\b(certification|certified|pmp|csm|scrum|license|licensed)\b/.test(lowerDescription)) {
    maybeAdd('certifications', 'Which certifications or licenses should be listed for this application?', 'The role mentions certifications or licensing.', profileField(profile, 'certifications'));
  }
  if (/\b(salary|compensation|pay range|expected pay|desired pay)\b/.test(lowerDescription)) {
    maybeAdd('salary_expectation', 'What salary or compensation answer should CubiQo use for this role?', 'Salary or compensation may require your explicit judgment.', profileField(profile, 'salary_expectation'));
  }
  if (/\b(sponsorship|visa|work authorization|authorized to work|citizen)\b/.test(lowerDescription)) {
    maybeAdd('work_authorization', 'What work authorization answer should CubiQo use?', 'Work authorization must come from your confirmed profile or direct answer.', profileField(profile, 'work_authorization'));
  }
  if (/\b(essay|why are you interested|why this company|tell us about|describe a time)\b/.test(lowerDescription)) {
    maybeAdd('custom_essay', 'Do you want to provide a custom answer for the role-specific written question?', 'Custom essay answers should be user-confirmed, not invented.', '');
  }

  return prompts.slice(0, 5);
}

function buildApplicationPacket(input: {
  listing: ReturnType<typeof mapJobListing>;
  profile: Record<string, any> | null;
  savedAnswers: Array<Record<string, any>>;
  submissionPayload: ReturnType<typeof buildSubmissionPayload>;
  autoTailoring: { score?: number; scoreSummary?: string; tailoredResumeSummary?: string; coverLetter?: string; tailoringSource?: string };
}) {
  const missingAnswerPrompts = buildMissingAnswerPrompts(input.listing, input.profile, input.savedAnswers);
  const recruiterMessage = input.submissionPayload.recruiterMessage || buildRecruiterMessage({
    listing: input.listing,
    profile: input.profile,
    autoTailoring: input.autoTailoring
  });

  return {
    job: input.submissionPayload.job,
    fit: {
      score: input.autoTailoring.score ?? null,
      summary: input.autoTailoring.scoreSummary || null,
      source: input.autoTailoring.tailoringSource || 'user_payload_or_local'
    },
    resumeNotes: input.submissionPayload.resumeSummary,
    coverLetterDraft: input.submissionPayload.coverLetter,
    recruiterMessage,
    applicationAnswers: input.submissionPayload.answers,
    missingAnswerPrompts,
    saveResumeRequiresAction: Boolean(input.autoTailoring.tailoredResumeSummary),
    finalSubmitRequiresUser: true,
    externalSubmissionPerformed: false
  };
}

export async function prepareJobApplication(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>
): Promise<{ review: ReturnType<typeof mapApplicationReview>; reviewCard: Record<string, unknown> } | JobErrorResult | JobBlockedResult> {
  const jobListingId = normalizeText(payload.jobListingId || payload.job_listing_id, 80);
  if (!jobListingId) return { blocked: 'job_listing_id is required to prepare an application review card', status: 400 };

  const listingResult = await loadJobListing(auth, jobListingId);
  if (!('listing' in listingResult)) return listingResult;
  const listing = listingResult.listing;
  if (!listing) return { blocked: 'Job listing not found', status: 404 };

  const browserSessionId = normalizeBrowserSessionId(payload.browserSessionId ?? payload.browser_session_id ?? listing.browserSessionId);
  const sessionCheck = await requireActiveBrowserSessionIfProvided(auth, browserSessionId);
  if (!('browserSessionId' in sessionCheck)) return sessionCheck;

  // Auto-tailor resume and cover letter with LLM if not provided. The result
  // stays inside the review packet; durable resume saves require
  // resume_version_write.
  let autoTailoring: { score?: number; scoreSummary?: string; tailoredResumeSummary?: string; coverLetter?: string; tailoringSource?: string } = {};
  let profile: Record<string, any> | null = null;
  let savedAnswers: Array<Record<string, any>> = [];
  const hasResume = Boolean(payload.resumeSummary || payload.resume_summary);
  const hasCoverLetter = Boolean(payload.coverLetter || payload.cover_letter);
  try {
    const [{ data: profileRow }, { data: latestResume }, { data: answersRow }] = await Promise.all([
      auth.supabase
        .from('job_profiles')
        .select('target_roles,skills,experience_summary,metadata,profile_payload,salary_expectation')
        .eq('user_id', auth.user.id)
        .maybeSingle(),
      auth.supabase
        .from('resume_versions')
        .select('resume_content')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      auth.supabase
        .from('application_answers')
        .select('question,answer,platform_hint')
        .eq('user_id', auth.user.id)
        .order('display_order', { ascending: true })
        .limit(50)
    ]);
    profile = profileRow || null;
    savedAnswers = answersRow || [];
    if ((!hasResume || !hasCoverLetter) && profile) {
      autoTailoring = await tailorApplicationForJob({
        jobTitle: listing.title,
        jobCompany: listing.company,
        jobDescription: listing.description || '',
        profileRoles: Array.isArray(profile.target_roles) ? profile.target_roles : [],
        profileSkills: Array.isArray(profile.skills) ? profile.skills : [],
        profileExperience: profile.experience_summary || '',
        baseResume: latestResume?.resume_content || ''
      });
    }
  } catch { /* profile/answer enrichment is best-effort */ }

  if (!hasResume && autoTailoring.tailoredResumeSummary) {
    payload = { ...payload, resumeSummary: autoTailoring.tailoredResumeSummary };
  }
  if (!hasCoverLetter && autoTailoring.coverLetter) {
    payload = { ...payload, coverLetter: autoTailoring.coverLetter };
  }
  if (!payload.answers && savedAnswers.length) {
    payload = {
      ...payload,
      answers: savedAnswers.map(answer => ({
        question: answer.question,
        answer: answer.answer,
        platform_hint: answer.platform_hint,
        source: 'saved_application_answer'
      }))
    };
  }

  const baseSubmissionPayload = buildSubmissionPayload(listing, payload);
  const applicationPacket = buildApplicationPacket({
    listing,
    profile,
    savedAnswers,
    submissionPayload: baseSubmissionPayload,
    autoTailoring
  });
  const submissionPayload = {
    ...baseSubmissionPayload,
    recruiterMessage: applicationPacket.recruiterMessage,
    missingAnswerPrompts: applicationPacket.missingAnswerPrompts,
    applicationPacket: {
      ...applicationPacket,
      generatedAt: new Date().toISOString()
    }
  };
  const { data, error } = await auth.supabase
    .from('job_application_reviews')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      browser_session_id: sessionCheck.browserSessionId,
      job_listing_id: listing.id,
      source_platform: listing.sourcePlatform,
      target_url: submissionPayload.targetUrl,
      candidate_name: submissionPayload.candidate.name,
      candidate_email: submissionPayload.candidate.email,
      candidate_phone: submissionPayload.candidate.phone,
      resume_summary: submissionPayload.resumeSummary,
      cover_letter: submissionPayload.coverLetter,
      answers: submissionPayload.answers,
      submission_payload: submissionPayload
    })
    .select('id,approval_id,submit_approval_id,browser_session_id,job_listing_id,source_platform,target_url,status,candidate_name,candidate_email,candidate_phone,resume_summary,cover_letter,answers,submission_payload,external_submission_performed,prepared_at,approved_at,submitted_at,created_at,updated_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('job-workflows', 'job_application_reviews') };
    return { error };
  }

  await auth.supabase
    .from('job_listings')
    .update({ status: 'prepared' })
    .eq('id', listing.id)
    .eq('user_id', auth.user.id);

  const review = mapApplicationReview(data);
  return {
    review,
    reviewCard: {
      reviewId: review.id,
      job: submissionPayload.job,
      candidate: submissionPayload.candidate,
      resumeSummary: submissionPayload.resumeSummary,
      coverLetter: submissionPayload.coverLetter,
      recruiterMessage: submissionPayload.recruiterMessage,
      answers: submissionPayload.answers,
      missingAnswerPrompts: submissionPayload.missingAnswerPrompts,
      applicationPacket: submissionPayload.applicationPacket,
      attachments: submissionPayload.attachments,
      targetUrl: submissionPayload.targetUrl,
      willSubmitExternally: false,
      nextRequiredAction: 'Approve job_application_submit_approved after reviewing this exact payload.',
      autoTailoring: autoTailoring.tailoringSource ? {
        score: autoTailoring.score,
        scoreSummary: autoTailoring.scoreSummary,
        source: autoTailoring.tailoringSource
      } : null
    }
  };
}

export async function approvePreparedJobApplication(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>
): Promise<{ review: ReturnType<typeof mapApplicationReview>; performedExternalSubmission: false } | JobErrorResult | JobBlockedResult> {
  const reviewId = normalizeText(payload.reviewId || payload.review_id || payload.jobApplicationReviewId || payload.job_application_review_id, 80);
  if (!reviewId) return { blocked: 'review_id is required to approve a prepared application', status: 400 };

  const { data: existing, error: readError } = await auth.supabase
    .from('job_application_reviews')
    .select('id,user_id,job_listing_id,status,submission_payload,browser_session_id')
    .eq('id', reviewId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (readError) {
    if (safeTableMissing(readError)) return { error: missingMigrationResponse('job-workflows', 'job_application_reviews') };
    return { error: readError };
  }
  if (!existing) return { blocked: 'Prepared application review not found', status: 404 };
  if (existing.status !== 'prepared') return { blocked: `Application review is ${existing.status}, not prepared`, status: 409 };

  const now = new Date().toISOString();
  const { data, error } = await auth.supabase
    .from('job_application_reviews')
    .update({
      submit_approval_id: approvalId,
      status: 'approved_for_submission',
      approved_at: now,
      submitted_at: null,
      external_submission_performed: false
    })
    .eq('id', reviewId)
    .eq('user_id', auth.user.id)
    .select('id,approval_id,submit_approval_id,browser_session_id,job_listing_id,source_platform,target_url,status,candidate_name,candidate_email,candidate_phone,resume_summary,cover_letter,answers,submission_payload,external_submission_performed,prepared_at,approved_at,submitted_at,created_at,updated_at')
    .single();

  if (error) return { error };

  if (existing.job_listing_id) {
    await auth.supabase
      .from('job_listings')
      .update({ status: 'approved_for_submission' })
      .eq('id', existing.job_listing_id)
      .eq('user_id', auth.user.id);
  }

  return {
    review: mapApplicationReview(data),
    performedExternalSubmission: false
  };
}
