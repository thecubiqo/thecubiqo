import { NextResponse } from 'next/server';
import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';
import { resolveStorageUrls } from './storage-url';
import {
  SOCIAL_PLATFORM_REGISTRY,
  canonicalSocialPlatform,
  getSocialPlatform,
  type SocialPlatformId
} from '@/next/lib/social/social-platform-registry';

export const SOCIAL_ACTION_TYPES = [
  'social_post_prepare',
  'social_post_schedule_approved'
] as const;

export type SocialActionType = typeof SOCIAL_ACTION_TYPES[number];

type SocialErrorResult = { error: Response | Error };
type SocialBlockedResult = { blocked: string; status?: number };
type SocialPlatform = SocialPlatformId;

type ConnectorState = 'disconnected' | 'configured_unverified' | 'connected';

export function isSocialAction(actionType: string): actionType is SocialActionType {
  return SOCIAL_ACTION_TYPES.includes(actionType as SocialActionType);
}

function normalizeText(value: unknown, max = 1000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeNullableText(value: unknown, max = 1000) {
  const text = normalizeText(value, max);
  return text || null;
}

function normalizeJsonObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
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

function getPayloadField(payload: Record<string, unknown>, camel: string, snake: string) {
  return payload[camel] ?? payload[snake];
}

function normalizePlatform(value: unknown): SocialPlatform | null {
  return canonicalSocialPlatform(value);
}

function normalizePlatforms(value: unknown) {
  const platforms = normalizeStringArray(value, 10, 40)
    .map(normalizePlatform)
    .filter(Boolean) as SocialPlatform[];
  return Array.from(new Set(platforms)).slice(0, 10);
}

function normalizeUrl(value: unknown) {
  const raw = normalizeText(value, 1600);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalizePositiveInt(value: unknown, fallback: number, max = 1000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function normalizePreviewCard(value: unknown) {
  const preview = normalizeJsonObject(value);
  return Object.keys(preview).length ? preview : null;
}

export function getSocialApprovalPreviewCard(approval: Record<string, any> | undefined | null) {
  const payload = normalizeJsonObject(approval?.payload);
  return normalizePreviewCard(payload.previewCard || payload.preview_card);
}

function connectorStatus(provider: SocialPlatform, account?: Record<string, any> | null) {
  const registry = getSocialPlatform(provider);
  const label = registry?.label || provider;
  const state: ConnectorState = account?.status === 'active' ? 'connected' : 'disconnected';
  return {
    provider,
    label,
    state,
    connected: state === 'connected',
    accountId: account?.id || null,
    accountHandle: account?.account_handle || null,
    credentialStatus: state === 'connected' ? 'stored_server_side' : 'missing',
    checkedAt: new Date().toISOString(),
    source: 'social_accounts',
    note: state === 'disconnected'
      ? `Connect a ${label} account to enable scheduling for this platform.`
      : `${label} is connected for this user.`
  };
}

async function readUserSocialAccounts(auth: ApiUserContext) {
  const { data, error } = await auth.supabase
    .from('social_accounts')
    .select('id,platform,account_label,account_handle,status,connection_type,scopes,metadata,connected_at,last_used_at')
    .eq('user_id', auth.user.id);

  if (error) {
    if (safeTableMissing(error)) return { accounts: [], tableMissing: true };
    return { error };
  }
  return { accounts: data || [], tableMissing: false };
}

export async function getSocialConnectorStatuses(auth: ApiUserContext, platforms?: SocialPlatform[]) {
  const read = await readUserSocialAccounts(auth);
  if ('error' in read && read.error) return { connectors: [], error: read.error };
  const accounts = 'accounts' in read ? read.accounts : [];
  const list = (platforms?.length ? platforms : SOCIAL_PLATFORM_REGISTRY.map(item => item.id)).map(provider => {
    const account = accounts.find((item: Record<string, any>) => item.platform === provider && item.status === 'active') || null;
    const status = connectorStatus(provider, account);
    return read.tableMissing
      ? { ...status, source: 'social_accounts_missing_migration', note: 'Run the Sprint 2 social_accounts migration before connecting platforms.' }
      : status;
  });
  return { connectors: list };
}

function mapSocialDraft(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    gfxToolsJobId: row.gfx_tools_job_id,
    gfxAssetId: row.gfx_asset_id,
    assetReadyEventId: row.asset_ready_event_id,
    assetUrl: row.asset_url,
    assetType: row.asset_type,
    assetSource: row.asset_source,
    platforms: row.platforms || [],
    variants: row.variants || {},
    contentContext: row.content_context || {},
    previewCard: row.preview_card || {},
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapDistributionRule(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    socialContentDraftId: row.social_content_draft_id,
    name: row.name,
    intervalMinutes: row.interval_minutes,
    platforms: row.platforms || [],
    variantRotationCount: row.variant_rotation_count,
    timezone: row.timezone,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    rulePayload: row.rule_payload || {},
    previewCard: row.preview_card || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapScheduledPost(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    distributionRuleId: row.distribution_rule_id,
    socialContentDraftId: row.social_content_draft_id,
    platform: row.platform,
    variantIndex: row.variant_index,
    scheduledFor: row.scheduled_for,
    status: row.status,
    connectorState: row.connector_state,
    assetUrl: row.asset_url,
    contentPayload: row.content_payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapFireLog(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    scheduledPostId: row.scheduled_post_id,
    platform: row.platform,
    assetUrl: row.asset_url,
    status: row.status,
    message: row.message,
    result: row.result || {},
    createdAt: row.created_at
  };
}

function mapQueuedSocialPost(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    browserSessionId: row.browser_session_id,
    platform: row.platform,
    content: row.content,
    mediaUrls: row.media_urls || [],
    status: row.status,
    previewScreenshotUrl: row.preview_screenshot_url,
    publishedUrl: row.published_url,
    accessibilityTreeSnapshot: row.accessibility_tree_snapshot || null,
    error: row.error,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    cancelledAt: row.cancelled_at
  };
}

export async function listSocialState(auth: ApiUserContext): Promise<{
  connectors: ReturnType<typeof connectorStatus>[];
  drafts: ReturnType<typeof mapSocialDraft>[];
  distributionRules: ReturnType<typeof mapDistributionRule>[];
  scheduledPosts: ReturnType<typeof mapScheduledPost>[];
  fireLogs: ReturnType<typeof mapFireLog>[];
  queuedPosts: ReturnType<typeof mapQueuedSocialPost>[];
} | SocialErrorResult> {
  const [draftsResult, rulesResult, scheduledResult, logsResult, queuedPostsResult] = await Promise.all([
    auth.supabase
      .from('social_content_drafts')
      .select('id,approval_id,gfx_tools_job_id,gfx_asset_id,asset_ready_event_id,asset_url,asset_type,asset_source,platforms,variants,content_context,preview_card,status,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    auth.supabase
      .from('social_distribution_rules')
      .select('id,approval_id,social_content_draft_id,name,interval_minutes,platforms,variant_rotation_count,timezone,start_at,end_at,status,rule_payload,preview_card,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    auth.supabase
      .from('social_scheduled_posts')
      .select('id,approval_id,distribution_rule_id,social_content_draft_id,platform,variant_index,scheduled_for,status,connector_state,asset_url,content_payload,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('scheduled_for', { ascending: true })
      .limit(24),
    auth.supabase
      .from('social_post_fire_logs')
      .select('id,approval_id,scheduled_post_id,platform,asset_url,status,message,result,created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(24),
    auth.supabase
      .from('social_posts')
      .select('id,approval_id,browser_session_id,platform,content,media_urls,status,preview_screenshot_url,published_url,accessibility_tree_snapshot,error,metadata,created_at,updated_at,published_at,cancelled_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(24)
  ]);

  for (const result of [draftsResult, rulesResult, scheduledResult, logsResult, queuedPostsResult]) {
    if (result.error) {
      if (safeTableMissing(result.error)) return { error: missingMigrationResponse('social', 'social_content_distribution') };
      return { error: result.error };
    }
  }

  const connectorStatuses = await getSocialConnectorStatuses(auth);
  if ('error' in connectorStatuses && connectorStatuses.error) return { error: connectorStatuses.error };

  const queuedPosts = await Promise.all(
    (queuedPostsResult.data || []).map(async (row: Record<string, any>) => {
      const mapped = mapQueuedSocialPost(row);
      return { ...mapped, mediaUrls: await resolveStorageUrls(auth.supabase, mapped.mediaUrls) };
    })
  );

  return {
    ...connectorStatuses,
    drafts: (draftsResult.data || []).map(mapSocialDraft),
    distributionRules: (rulesResult.data || []).map(mapDistributionRule),
    scheduledPosts: (scheduledResult.data || []).map(mapScheduledPost),
    fireLogs: (logsResult.data || []).map(mapFireLog),
    queuedPosts
  };
}

async function loadGfxToolsOutput(auth: ApiUserContext, id: string) {
  const { data, error } = await auth.supabase
    .from('gfx_assets')
    .select('id,gfxtools_job_id,asset_url,asset_type,status,platform_variants')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('social', 'gfx_assets') };
    return { error };
  }
  if (!data) return { blocked: 'GFXTools asset not found for this user.', status: 404 };
  if (data.status !== 'ready') return { blocked: `GFXTools asset is ${data.status}; only ready assets can start social preparation.`, status: 400 };
  const variants = Array.isArray(data.platform_variants) ? data.platform_variants : [];
  if (!variants.length) return { blocked: 'GFXTools asset has no platform variants. Run gfxtools_asset_resize first.', status: 400 };
  const outputUrl = normalizeUrl(data.asset_url);
  if (!outputUrl) return { blocked: 'GFXTools asset is ready but missing asset_url.', status: 400 };

  const { data: event, error: eventError } = await auth.supabase
    .from('asset_ready_events')
    .select('id,asset_id,event_type,consumed_at,created_at')
    .eq('asset_id', data.id)
    .eq('user_id', auth.user.id)
    .eq('event_type', 'asset_ready')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventError) {
    if (safeTableMissing(eventError)) return { error: missingMigrationResponse('social', 'asset_ready_events') };
    return { error: eventError };
  }
  if (!event) return { blocked: 'No asset_ready event exists for this asset. Social preparation only starts from the asset_ready handoff.', status: 400 };

  return {
    gfxAssetId: data.id,
    gfxToolsJobId: data.gfxtools_job_id,
    assetReadyEventId: event.id,
    outputUrl,
    assetType: data.asset_type,
    platformVariants: variants
  };
}

function platformVariant(platform: SocialPlatform, base: { topic: string; product: string; audience: string; cta: string; assetUrl: string }, index: number) {
  const n = index + 1;
  const table: Record<SocialPlatform, { caption: string; hashtags: string[]; cta: string }> = {
    linkedin: {
      caption: `${base.topic}\n\nFor ${base.audience}, this ${base.product} is positioned around practical identity: what you build, how you show up, and why the work matters. Variant ${n} keeps the tone professional and useful.`,
      hashtags: ['#AI', '#Founders', '#ProductStrategy', '#BuildInPublic'],
      cta: base.cta || 'Comment if this should become a full launch collection.'
    },
    instagram: {
      caption: `${base.product} energy for ${base.audience}. Clean signal, premium feel, made to look quiet but intentional. Variant ${n}.`,
      hashtags: ['#AIStyle', '#PODBrand', '#FounderWear', '#DesignDrop'],
      cta: base.cta || 'Save this and vote on the next colorway.'
    },
    x: {
      caption: `${base.topic} for ${base.audience}: a ${base.product} with quiet signal-wave energy. Variant ${n}.`,
      hashtags: ['#AI', '#POD', '#BrandBuild'],
      cta: base.cta || 'Reply with the next drop idea.'
    },
    threads: {
      caption: `${base.topic} for ${base.audience}: ${base.product} concept ${n}, written as a conversational launch note.`,
      hashtags: ['#AI', '#POD', '#BrandBuild'],
      cta: base.cta || 'Reply with the next angle you want to see.'
    },
    tiktok: {
      caption: `Drop concept ${n}: ${base.product} for ${base.audience}. Hook: the uniform for people building with AI before everyone else catches up.`,
      hashtags: ['#AITok', '#ClothingBrand', '#POD', '#StartupLife'],
      cta: base.cta || 'Follow for the design process.'
    },
    facebook: {
      caption: `New concept for ${base.audience}: ${base.product} built around ${base.topic}. Variant ${n} is meant to feel premium, wearable, and easy to explain.`,
      hashtags: ['#SmallBusiness', '#AI', '#ClothingBrand'],
      cta: base.cta || 'Tell me which audience this should target first.'
    },
    pinterest: {
      caption: `${base.product} concept board: ${base.topic} for ${base.audience}. Minimal, premium, AI-native apparel direction. Variant ${n}.`,
      hashtags: ['#ApparelDesign', '#PODDesign', '#AIArt', '#BrandMoodboard'],
      cta: base.cta || 'Pin this for the launch moodboard.'
    },
    youtube: {
      caption: `${base.topic} for ${base.audience}. Use this ${base.product} concept as a short-form video or community post angle. Variant ${n}.`,
      hashtags: ['#BrandBuild', '#POD', '#AI'],
      cta: base.cta || 'Subscribe for the next product build.'
    },
    reddit: {
      caption: `${base.topic} for ${base.audience}: sharing a ${base.product} concept and looking for direct feedback on positioning, audience, and design direction. Variant ${n}.`,
      hashtags: [],
      cta: base.cta || 'What would you change before launch?'
    },
    bluesky: {
      caption: `${base.topic} for ${base.audience}: ${base.product} concept ${n}, built around a cleaner signal for the launch.`,
      hashtags: ['#POD', '#BrandBuild'],
      cta: base.cta || 'Reply with the sharper angle.'
    }
  };
  return table[platform];
}

function buildVariants(payload: Record<string, unknown>, platforms: SocialPlatform[], assetUrl: string) {
  const variantCount = normalizePositiveInt(getPayloadField(payload, 'variantCount', 'variant_count'), 3, 10);
  const base = {
    topic: normalizeText(payload.topic, 180) || 'AI-native product energy',
    product: normalizeText(getPayloadField(payload, 'productName', 'product_name'), 180) || 'POD apparel drop',
    audience: normalizeText(getPayloadField(payload, 'targetAudience', 'target_audience'), 220) || 'builders and founders',
    cta: normalizeText(payload.cta, 220),
    assetUrl
  };

  return Object.fromEntries(platforms.map(platform => [
    platform,
    Array.from({ length: variantCount }, (_item, index) => ({
      platform,
      variantIndex: index,
      caption: platformVariant(platform, base, index).caption,
      hashtags: platformVariant(platform, base, index).hashtags,
      cta: platformVariant(platform, base, index).cta,
      assetUrl
    }))
  ]));
}

export async function prepareSocialPost(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{ draft: ReturnType<typeof mapSocialDraft>; previewCard: Record<string, unknown> } | SocialErrorResult | SocialBlockedResult> {
  if (!approvalPreviewCard) return { blocked: 'social_post_prepare requires a preview_card in the approved action payload before writing.', status: 400 };
  const platforms = normalizePlatforms(payload.platforms);
  if (!platforms.length) return { blocked: 'At least one supported platform is required.', status: 400 };

  const gfxAssetId = normalizeNullableText(getPayloadField(payload, 'assetId', 'asset_id'), 80) || normalizeNullableText(getPayloadField(payload, 'gfxAssetId', 'gfx_asset_id'), 80);
  if (!gfxAssetId) return { blocked: 'asset_id is required. Social preparation only starts from a ready GFXTools asset.', status: 400 };

  const output = await loadGfxToolsOutput(auth, gfxAssetId);
  if ('error' in output) return { error: output.error };
  if ('blocked' in output && output.blocked) return { blocked: output.blocked, status: output.status };
  if (!output.outputUrl) return { blocked: 'GFXTools asset output is missing.', status: 400 };
  const assetUrl = String(output.outputUrl);
  const assetSource = 'gfx_asset';
  const assetType = normalizeText(output.assetType, 40) || 'image';

  const variants = buildVariants(payload, platforms, assetUrl);
  const contentContext = {
    topic: normalizeNullableText(payload.topic, 220),
    productName: normalizeNullableText(getPayloadField(payload, 'productName', 'product_name'), 220),
    targetAudience: normalizeNullableText(getPayloadField(payload, 'targetAudience', 'target_audience'), 500),
    cta: normalizeNullableText(payload.cta, 300),
    variantCount: normalizePositiveInt(getPayloadField(payload, 'variantCount', 'variant_count'), 3, 10)
  };

  const { data, error } = await auth.supabase
    .from('social_content_drafts')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      gfx_tools_job_id: output.gfxToolsJobId || null,
      gfx_asset_id: output.gfxAssetId,
      asset_ready_event_id: output.assetReadyEventId,
      asset_url: assetUrl,
      asset_type: assetType,
      asset_source: assetSource,
      platforms,
      variants,
      content_context: contentContext,
      preview_card: approvalPreviewCard
    })
    .select('id,approval_id,gfx_tools_job_id,gfx_asset_id,asset_ready_event_id,asset_url,asset_type,asset_source,platforms,variants,content_context,preview_card,status,created_at,updated_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('social', 'social_content_drafts') };
    return { error };
  }

  return { draft: mapSocialDraft(data), previewCard: approvalPreviewCard };
}

async function loadSocialDraft(auth: ApiUserContext, id: string) {
  const { data, error } = await auth.supabase
    .from('social_content_drafts')
    .select('id,approval_id,gfx_tools_job_id,gfx_asset_id,asset_ready_event_id,asset_url,asset_type,asset_source,platforms,variants,content_context,preview_card,status,created_at,updated_at')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('social', 'social_content_drafts') };
    return { error };
  }
  if (!data) return { blocked: 'Social content draft not found for this user.', status: 404 };
  return { draft: mapSocialDraft(data) };
}

export async function scheduleSocialPost(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{
  rule: ReturnType<typeof mapDistributionRule>;
  scheduledPosts: ReturnType<typeof mapScheduledPost>[];
  fireLogs: ReturnType<typeof mapFireLog>[];
  connectors: ReturnType<typeof connectorStatus>[];
  previewCard: Record<string, unknown>;
} | SocialErrorResult | SocialBlockedResult> {
  if (!approvalPreviewCard) return { blocked: 'social_post_schedule_approved requires a preview_card with full platform content and cadence before scheduling.', status: 400 };
  const draftId = normalizeText(getPayloadField(payload, 'socialContentDraftId', 'social_content_draft_id'), 80);
  if (!draftId) return { blocked: 'social_content_draft_id is required.', status: 400 };
  const loaded = await loadSocialDraft(auth, draftId);
  if (!('draft' in loaded) || !loaded.draft) return loaded;
  const draft = loaded.draft as ReturnType<typeof mapSocialDraft>;

  const requestedPlatforms = normalizePlatforms(payload.platforms);
  const platforms = requestedPlatforms.length ? requestedPlatforms : normalizePlatforms(draft.platforms);
  if (!platforms.length) return { blocked: 'At least one supported platform is required for scheduling.', status: 400 };
  const intervalMinutes = normalizePositiveInt(getPayloadField(payload, 'intervalMinutes', 'interval_minutes'), 10, 1440);
  const variantRotationCount = normalizePositiveInt(getPayloadField(payload, 'variantRotationCount', 'variant_rotation_count'), 1, 50);
  const timezone = normalizeText(payload.timezone, 80) || 'UTC';
  const name = normalizeText(payload.name, 180) || `Social distribution ${new Date().toISOString()}`;
  const startAtRaw = normalizeText(getPayloadField(payload, 'startAt', 'start_at'), 100);
  const startAt = startAtRaw && !Number.isNaN(new Date(startAtRaw).getTime())
    ? new Date(startAtRaw)
    : new Date();
  const connectorStatuses = await getSocialConnectorStatuses(auth, platforms);
  if ('error' in connectorStatuses && connectorStatuses.error) return { error: connectorStatuses.error };
  const connectors = connectorStatuses.connectors;
  const missing = connectors.filter(item => item.state === 'disconnected').map(item => item.provider);
  const status = missing.length ? 'paused_missing_credentials' : 'active';
  const rulePayload = {
    intervalMinutes,
    platforms,
    variantRotationCount,
    timezone,
    startAt: startAt.toISOString(),
    missingCredentialPlatforms: missing,
    fullContentByPlatform: Object.fromEntries(platforms.map(platform => [platform, normalizeJsonObject(draft.variants)[platform] || []])),
    assetUrl: draft.assetUrl,
    gfxToolsJobId: draft.gfxToolsJobId,
    noClientPlatformCalls: true
  };

  const { data: ruleData, error: ruleError } = await auth.supabase
    .from('social_distribution_rules')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      social_content_draft_id: draft.id,
      name,
      interval_minutes: intervalMinutes,
      platforms,
      variant_rotation_count: variantRotationCount,
      timezone,
      start_at: startAt.toISOString(),
      status,
      rule_payload: rulePayload,
      preview_card: approvalPreviewCard
    })
    .select('id,approval_id,social_content_draft_id,name,interval_minutes,platforms,variant_rotation_count,timezone,start_at,end_at,status,rule_payload,preview_card,created_at,updated_at')
    .single();

  if (ruleError) {
    if (safeTableMissing(ruleError)) return { error: missingMigrationResponse('social', 'social_distribution_rules') };
    return { error: ruleError };
  }

  const variants = normalizeJsonObject(draft.variants);
  const scheduledRows = platforms.flatMap((platform, platformIndex) => {
    const platformVariants = Array.isArray(variants[platform]) ? variants[platform] as Array<Record<string, unknown>> : [];
    const connector = connectors.find(item => item.provider === platform);
    return Array.from({ length: Math.min(variantRotationCount, Math.max(platformVariants.length, 1)) }, (_item, variantIndex) => ({
      user_id: auth.user.id,
      approval_id: approvalId,
      distribution_rule_id: ruleData.id,
      social_content_draft_id: draft.id,
      platform,
      variant_index: variantIndex,
      scheduled_for: new Date(startAt.getTime() + (platformIndex + variantIndex) * intervalMinutes * 60000).toISOString(),
      status: connector?.state === 'disconnected' ? 'blocked_missing_credentials' : 'pending',
      connector_state: connector?.state || 'disconnected',
      asset_url: draft.assetUrl,
      content_payload: platformVariants[variantIndex % Math.max(platformVariants.length, 1)] || { platform, assetUrl: draft.assetUrl }
    }));
  });

  const { data: scheduledData, error: scheduledError } = await auth.supabase
    .from('social_scheduled_posts')
    .insert(scheduledRows)
    .select('id,approval_id,distribution_rule_id,social_content_draft_id,platform,variant_index,scheduled_for,status,connector_state,asset_url,content_payload,created_at,updated_at');

  if (scheduledError) {
    if (safeTableMissing(scheduledError)) return { error: missingMigrationResponse('social', 'social_scheduled_posts') };
    return { error: scheduledError };
  }

  await auth.supabase
    .from('social_content_drafts')
    .update({ status: 'scheduled' })
    .eq('id', draft.id)
    .eq('user_id', auth.user.id);

  const blockedRows = (scheduledData || []).filter((row: Record<string, any>) => row.status === 'blocked_missing_credentials');
  let fireLogs: ReturnType<typeof mapFireLog>[] = [];
  if (blockedRows.length) {
    const { data: logData, error: logError } = await auth.supabase
      .from('social_post_fire_logs')
      .insert(blockedRows.map((row: Record<string, any>) => ({
        user_id: auth.user.id,
        approval_id: approvalId,
        scheduled_post_id: row.id,
        platform: row.platform,
        asset_url: row.asset_url,
        status: 'blocked',
        message: `${row.platform} post blocked because connector credentials are missing.`,
        result: { connectorState: row.connector_state, externalCallPerformed: false }
      })))
      .select('id,approval_id,scheduled_post_id,platform,asset_url,status,message,result,created_at');
    if (logError) {
      if (safeTableMissing(logError)) return { error: missingMigrationResponse('social', 'social_post_fire_logs') };
      return { error: logError };
    }
    fireLogs = (logData || []).map(mapFireLog);
  }

  return {
    rule: mapDistributionRule(ruleData),
    scheduledPosts: (scheduledData || []).map(mapScheduledPost),
    fireLogs,
    connectors,
    previewCard: approvalPreviewCard
  };
}
