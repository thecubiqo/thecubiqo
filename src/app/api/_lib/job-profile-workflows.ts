import { NextResponse } from 'next/server';
import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';

export const JOB_PROFILE_ACTION_TYPES = [
  'job_profile_write',
  'resume_version_write'
] as const;

export type JobProfileActionType = typeof JOB_PROFILE_ACTION_TYPES[number];

type ProfileErrorResult = { error: Response | Error };
type ProfileBlockedResult = { blocked: string; status?: number };

export function isJobProfileAction(actionType: string): actionType is JobProfileActionType {
  return JOB_PROFILE_ACTION_TYPES.includes(actionType as JobProfileActionType);
}

function normalizeText(value: unknown, max = 1000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeNullableText(value: unknown, max = 1000) {
  const text = normalizeText(value, max);
  return text || null;
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStringArray(value: unknown, maxItems = 20, maxLength = 120) {
  const input = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return input
    .map(item => normalizeText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeJsonObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function getPayloadField(payload: Record<string, unknown>, camel: string, snake: string) {
  return payload[camel] ?? payload[snake];
}

function mapJobProfile(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    targetRoles: row.target_roles || [],
    skills: row.skills || [],
    experienceSummary: row.experience_summary,
    yearsExperience: row.years_experience,
    preferredLocations: row.preferred_locations || [],
    workModes: row.work_modes || [],
    salaryExpectation: row.salary_expectation,
    profilePayload: row.profile_payload || {},
    previewCard: row.preview_card || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapResumeVersion(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    jobProfileId: row.job_profile_id,
    name: row.name,
    resumeContent: row.resume_content,
    resumeFormat: row.resume_format,
    targetRole: row.target_role,
    changeSummary: row.change_summary,
    diffPreview: row.diff_preview || {},
    sourcePayload: row.source_payload || {},
    createdAt: row.created_at
  };
}

function normalizePreviewCard(value: unknown) {
  const preview = normalizeJsonObject(value);
  if (!Object.keys(preview).length) return null;
  return preview;
}

export function getApprovalPreviewCard(approval: Record<string, any> | undefined | null) {
  const payload = normalizeJsonObject(approval?.payload);
  return normalizePreviewCard(payload.previewCard || payload.preview_card);
}

export async function listJobProfileState(auth: ApiUserContext): Promise<{
  profile: ReturnType<typeof mapJobProfile> | null;
  resumeVersions: ReturnType<typeof mapResumeVersion>[];
} | ProfileErrorResult> {
  const [profileResult, resumeResult] = await Promise.all([
    auth.supabase
      .from('job_profiles')
      .select('id,approval_id,target_roles,skills,experience_summary,years_experience,preferred_locations,work_modes,salary_expectation,profile_payload,preview_card,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from('resume_versions')
      .select('id,approval_id,job_profile_id,name,resume_content,resume_format,target_role,change_summary,diff_preview,source_payload,created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12)
  ]);

  if (profileResult.error) {
    if (safeTableMissing(profileResult.error)) return { error: missingMigrationResponse('job-profile', 'job_profiles') };
    return { error: profileResult.error };
  }
  if (resumeResult.error) {
    if (safeTableMissing(resumeResult.error)) return { error: missingMigrationResponse('job-profile', 'resume_versions') };
    return { error: resumeResult.error };
  }

  return {
    profile: profileResult.data ? mapJobProfile(profileResult.data) : null,
    resumeVersions: (resumeResult.data || []).map(mapResumeVersion)
  };
}

export async function writeJobProfile(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{ profile: ReturnType<typeof mapJobProfile>; previewCard: Record<string, unknown> } | ProfileErrorResult | ProfileBlockedResult> {
  if (!approvalPreviewCard) {
    return {
      blocked: 'job_profile_write requires a preview_card in the approved action payload before writing.',
      status: 400
    };
  }

  const targetRoles = normalizeStringArray(getPayloadField(payload, 'targetRoles', 'target_roles'));
  const skills = normalizeStringArray(payload.skills, 40);
  const experienceSummary = normalizeNullableText(getPayloadField(payload, 'experienceSummary', 'experience_summary'), 5000);
  const yearsExperience = normalizeNumber(getPayloadField(payload, 'yearsExperience', 'years_experience'));
  const preferredLocations = normalizeStringArray(getPayloadField(payload, 'preferredLocations', 'preferred_locations'));
  const workModes = normalizeStringArray(getPayloadField(payload, 'workModes', 'work_modes'), 8, 80);
  const salaryExpectation = normalizeNullableText(getPayloadField(payload, 'salaryExpectation', 'salary_expectation'), 200);

  if (!targetRoles.length && !skills.length && !experienceSummary) {
    return {
      blocked: 'Job profile needs at least one target role, skill, or experience summary.',
      status: 400
    };
  }

  const profilePayload = {
    targetRoles,
    skills,
    experienceSummary,
    yearsExperience,
    preferredLocations,
    workModes,
    salaryExpectation,
    notes: normalizeNullableText(payload.notes, 3000)
  };

  const { data, error } = await auth.supabase
    .from('job_profiles')
    .upsert({
      user_id: auth.user.id,
      approval_id: approvalId,
      target_roles: targetRoles,
      skills,
      experience_summary: experienceSummary,
      years_experience: yearsExperience,
      preferred_locations: preferredLocations,
      work_modes: workModes,
      salary_expectation: salaryExpectation,
      profile_payload: profilePayload,
      preview_card: approvalPreviewCard
    }, { onConflict: 'user_id' })
    .select('id,approval_id,target_roles,skills,experience_summary,years_experience,preferred_locations,work_modes,salary_expectation,profile_payload,preview_card,created_at,updated_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('job-profile', 'job_profiles') };
    return { error };
  }

  return {
    profile: mapJobProfile(data),
    previewCard: approvalPreviewCard
  };
}

export async function writeResumeVersion(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{ resumeVersion: ReturnType<typeof mapResumeVersion>; previewCard: Record<string, unknown> } | ProfileErrorResult | ProfileBlockedResult> {
  if (!approvalPreviewCard) {
    return {
      blocked: 'resume_version_write requires a diff/preview card in the approved action payload before writing.',
      status: 400
    };
  }

  const name = normalizeText(payload.name || payload.versionName || payload.version_name, 180);
  const resumeContent = normalizeText(getPayloadField(payload, 'resumeContent', 'resume_content'), 30000);
  const resumeFormat = normalizeText(getPayloadField(payload, 'resumeFormat', 'resume_format'), 40) || 'plain_text';
  const targetRole = normalizeNullableText(getPayloadField(payload, 'targetRole', 'target_role'), 180);
  const changeSummary = normalizeNullableText(getPayloadField(payload, 'changeSummary', 'change_summary'), 3000);
  const jobProfileId = normalizeNullableText(getPayloadField(payload, 'jobProfileId', 'job_profile_id'), 80);

  if (!name || !resumeContent) {
    return {
      blocked: 'Resume version needs a name and resume_content. Existing resume versions are never overwritten.',
      status: 400
    };
  }

  if (jobProfileId) {
    const { data, error } = await auth.supabase
      .from('job_profiles')
      .select('id')
      .eq('id', jobProfileId)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (error) {
      if (safeTableMissing(error)) return { error: missingMigrationResponse('job-profile', 'job_profiles') };
      return { error };
    }
    if (!data) return { blocked: 'Referenced job profile was not found for this user.', status: 404 };
  }

  const sourcePayload = {
    name,
    targetRole,
    resumeFormat,
    changeSummary,
    contentLength: resumeContent.length
  };

  const { data, error } = await auth.supabase
    .from('resume_versions')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      job_profile_id: jobProfileId,
      name,
      resume_content: resumeContent,
      resume_format: resumeFormat,
      target_role: targetRole,
      change_summary: changeSummary,
      diff_preview: approvalPreviewCard,
      source_payload: sourcePayload
    })
    .select('id,approval_id,job_profile_id,name,resume_content,resume_format,target_role,change_summary,diff_preview,source_payload,created_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('job-profile', 'resume_versions') };
    return { error };
  }

  return {
    resumeVersion: mapResumeVersion(data),
    previewCard: approvalPreviewCard
  };
}
