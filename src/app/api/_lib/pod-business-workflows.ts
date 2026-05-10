import { NextResponse } from 'next/server';
import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';

export const POD_ACTION_TYPES = [
  'pod_design_brief_create',
  'gfxtools_job_create',
  'gfxtools_asset_resize',
  'shopify_product_prepare',
  'printify_design_prepare'
] as const;

export type PodActionType = typeof POD_ACTION_TYPES[number];

type PodErrorResult = { error: Response | Error };
type PodBlockedResult = { blocked: string; status?: number };
type ConnectorState = 'disconnected' | 'configured_unverified' | 'connected';
type AssetType = 'image' | 'video';

const PLATFORM_SIZES = [
  { platform: 'instagram', variant: 'square', width: 1080, height: 1080 },
  { platform: 'instagram', variant: 'story', width: 1080, height: 1920 },
  { platform: 'linkedin', variant: 'feed', width: 1200, height: 627 },
  { platform: 'x', variant: 'feed', width: 1600, height: 900 },
  { platform: 'tiktok', variant: 'vertical', width: 1080, height: 1920 },
  { platform: 'facebook', variant: 'feed', width: 1200, height: 630 }
] as const;

export function isPodAction(actionType: string): actionType is PodActionType {
  return POD_ACTION_TYPES.includes(actionType as PodActionType);
}

function cleanEnv(...values: Array<string | undefined>) {
  const value = values.find(Boolean);
  return value ? value.trim().replace(/^['"]|['"]$/g, '') : '';
}

function normalizeText(value: unknown, max = 1000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeNullableText(value: unknown, max = 1000) {
  const text = normalizeText(value, max);
  return text || null;
}

function normalizeStringArray(value: unknown, maxItems = 20, maxLength = 160) {
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

function normalizePreviewCard(value: unknown) {
  const preview = normalizeJsonObject(value);
  return Object.keys(preview).length ? preview : null;
}

export function getPodApprovalPreviewCard(approval: Record<string, any> | undefined | null) {
  const payload = normalizeJsonObject(approval?.payload);
  return normalizePreviewCard(payload.previewCard || payload.preview_card);
}

function normalizeFormat(value: unknown): AssetType {
  return normalizeText(value, 20).toLowerCase() === 'video' ? 'video' : 'image';
}

function normalizeDimensions(value: unknown, fallback = { width: 1080, height: 1080 }) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const input = value as Record<string, unknown>;
    const width = Number(input.width);
    const height = Number(input.height);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width: Math.floor(width), height: Math.floor(height) };
    }
  }
  const text = normalizeText(value, 80);
  const match = text.match(/(\d{2,5})\s*[xX]\s*(\d{2,5})/);
  if (match) return { width: Number(match[1]), height: Number(match[2]) };
  return fallback;
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

function connectorStatus(provider: 'gfxtools' | 'shopify' | 'printify') {
  const configs = {
    gfxtools: {
      label: 'GFXTools',
      required: ['GFXTOOLS_API_KEY', 'GFXTOOLS_API_URL'],
      present: [cleanEnv(process.env.GFXTOOLS_API_KEY), cleanEnv(process.env.GFXTOOLS_API_URL)]
    },
    shopify: {
      label: 'Shopify',
      required: ['SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_ADMIN_ACCESS_TOKEN'],
      present: [
        cleanEnv(process.env.SHOPIFY_SHOP_DOMAIN, process.env.SHOPIFY_STORE_DOMAIN),
        cleanEnv(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN, process.env.SHOPIFY_ACCESS_TOKEN)
      ]
    },
    printify: {
      label: 'Printify',
      required: ['PRINTIFY_API_KEY'],
      present: [cleanEnv(process.env.PRINTIFY_API_KEY, process.env.PRINTIFY_ACCESS_TOKEN)]
    }
  }[provider];

  const missing = configs.required.filter((_name, index) => !configs.present[index]);
  const state: ConnectorState = missing.length ? 'disconnected' : 'configured_unverified';
  return {
    provider,
    label: configs.label,
    state,
    connected: false,
    credentialStatus: missing.length ? 'missing' : 'present_server_side_unverified',
    missing,
    checkedAt: new Date().toISOString(),
    source: 'server_env_only',
    note: missing.length
      ? `${configs.label} credentials are not configured server-side.`
      : `${configs.label} credentials exist server-side, but no provider verification call has confirmed connection yet.`
  };
}

export function getPodConnectorStatuses() {
  return {
    connectors: [
      connectorStatus('gfxtools'),
      connectorStatus('shopify'),
      connectorStatus('printify')
    ]
  };
}

function mapPodBrief(row: Record<string, any>) {
  return {
    id: row.id,
    briefId: row.id,
    approvalId: row.approval_id,
    title: row.title,
    description: row.description,
    format: row.format,
    platforms: row.platforms || [],
    brandGuidelines: row.brand_guidelines,
    dimensionsRequested: row.dimensions_requested,
    status: row.status,
    assetId: row.asset_id,
    brandName: row.brand_name,
    productType: row.product_type,
    targetAudience: row.target_audience,
    styleKeywords: row.style_keywords || [],
    colorPalette: row.color_palette || [],
    placement: row.placement,
    prompt: row.prompt,
    negativePrompt: row.negative_prompt,
    fulfillmentTargets: row.fulfillment_targets || [],
    marketingAngles: row.marketing_angles || [],
    creativeBrief: row.creative_brief || {},
    previewCard: row.preview_card || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapGfxJob(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    podDesignBriefId: row.pod_design_brief_id,
    status: row.status,
    connectorState: row.connector_state,
    jobPayload: row.job_payload || {},
    previewCard: row.preview_card || {},
    externalJobId: row.external_job_id,
    externalCallPerformed: Boolean(row.external_call_performed),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapGfxAsset(row: Record<string, any>) {
  return {
    id: row.id,
    assetId: row.id,
    approvalId: row.approval_id,
    podDesignBriefId: row.pod_design_brief_id,
    gfxToolsJobId: row.gfxtools_job_id,
    externalJobId: row.external_job_id,
    assetUrl: row.asset_url,
    assetType: row.asset_type,
    dimensions: row.dimensions || {},
    platformVariants: row.platform_variants || [],
    status: row.status,
    connectorState: row.connector_state,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAssetReadyEvent(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    assetId: row.asset_id,
    eventType: row.event_type,
    payload: row.payload || {},
    consumedAt: row.consumed_at,
    createdAt: row.created_at
  };
}

function mapShopifyPreparation(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    assetId: row.asset_id,
    connectorState: row.connector_state,
    productPayload: row.product_payload || {},
    previewCard: row.preview_card || {},
    status: row.status,
    externalCallPerformed: Boolean(row.external_call_performed),
    externalProductId: row.external_product_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPrintifyPreparation(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    assetId: row.asset_id,
    connectorState: row.connector_state,
    designPayload: row.design_payload || {},
    previewCard: row.preview_card || {},
    status: row.status,
    externalCallPerformed: Boolean(row.external_call_performed),
    externalDesignId: row.external_design_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listPodBusinessState(auth: ApiUserContext) {
  const [briefsResult, jobsResult, assetsResult, eventsResult, shopifyResult, printifyResult] = await Promise.all([
    auth.supabase
      .from('pod_design_briefs')
      .select('id,approval_id,title,description,format,platforms,brand_guidelines,dimensions_requested,status,asset_id,brand_name,product_type,target_audience,style_keywords,color_palette,placement,prompt,negative_prompt,fulfillment_targets,marketing_angles,creative_brief,preview_card,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    auth.supabase
      .from('gfxtools_jobs')
      .select('id,approval_id,pod_design_brief_id,status,connector_state,job_payload,preview_card,external_job_id,external_call_performed,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    auth.supabase
      .from('gfx_assets')
      .select('id,approval_id,pod_design_brief_id,gfxtools_job_id,external_job_id,asset_url,asset_type,dimensions,platform_variants,status,connector_state,error_message,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    auth.supabase
      .from('asset_ready_events')
      .select('id,approval_id,asset_id,event_type,payload,consumed_at,created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    auth.supabase
      .from('shopify_product_preparations')
      .select('id,approval_id,asset_id,connector_state,product_payload,preview_card,status,external_call_performed,external_product_id,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    auth.supabase
      .from('printify_design_preparations')
      .select('id,approval_id,asset_id,connector_state,design_payload,preview_card,status,external_call_performed,external_design_id,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12)
  ]);

  for (const result of [briefsResult, jobsResult, assetsResult, eventsResult, shopifyResult, printifyResult]) {
    if (result.error) {
      if (safeTableMissing(result.error)) return { error: missingMigrationResponse('pod-business', 'pod connector asset tables') };
      return { error: result.error };
    }
  }

  return {
    ...getPodConnectorStatuses(),
    podDesignBriefs: (briefsResult.data || []).map(mapPodBrief),
    gfxToolsJobs: (jobsResult.data || []).map(mapGfxJob),
    gfxAssets: (assetsResult.data || []).map(mapGfxAsset),
    assetReadyEvents: (eventsResult.data || []).map(mapAssetReadyEvent),
    shopifyPreparations: (shopifyResult.data || []).map(mapShopifyPreparation),
    printifyPreparations: (printifyResult.data || []).map(mapPrintifyPreparation)
  };
}

function buildCreativeBrief(payload: Record<string, unknown>) {
  const title = normalizeText(payload.title, 220) || normalizeText(getPayloadField(payload, 'productType', 'product_type'), 180) || 'POD creative brief';
  const description = normalizeText(payload.description, 5000) || normalizeText(payload.prompt, 5000);
  const format = normalizeFormat(payload.format);
  const platforms = normalizeStringArray(payload.platforms, 12, 40).map(item => item.toLowerCase());
  const brandGuidelines = normalizeNullableText(getPayloadField(payload, 'brandGuidelines', 'brand_guidelines'), 4000);
  const dimensionsRequested = normalizeText(getPayloadField(payload, 'dimensionsRequested', 'dimensions_requested'), 120) || (format === 'video' ? '1080x1920' : '1080x1080');
  const brandName = normalizeNullableText(getPayloadField(payload, 'brandName', 'brand_name'), 180);
  const productType = normalizeText(getPayloadField(payload, 'productType', 'product_type'), 180) || 'pod product';
  const targetAudience = normalizeNullableText(getPayloadField(payload, 'targetAudience', 'target_audience'), 500);
  const styleKeywords = normalizeStringArray(getPayloadField(payload, 'styleKeywords', 'style_keywords'), 16);
  const colorPalette = normalizeStringArray(getPayloadField(payload, 'colorPalette', 'color_palette'), 10);
  const placement = normalizeNullableText(payload.placement, 200);
  const prompt = description;
  const negativePrompt = normalizeNullableText(getPayloadField(payload, 'negativePrompt', 'negative_prompt'), 2000);
  const fulfillmentTargets = normalizeStringArray(getPayloadField(payload, 'fulfillmentTargets', 'fulfillment_targets'), 10);
  const marketingAngles = normalizeStringArray(getPayloadField(payload, 'marketingAngles', 'marketing_angles'), 12, 240);

  if (!title || !description) return null;

  return {
    title,
    description,
    format,
    platforms,
    brandGuidelines,
    dimensionsRequested,
    brandName,
    productType,
    targetAudience,
    styleKeywords,
    colorPalette,
    placement,
    prompt,
    negativePrompt,
    fulfillmentTargets,
    marketingAngles,
    dimensions: normalizeDimensions(dimensionsRequested, format === 'video' ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 }),
    deliverables: normalizeStringArray(payload.deliverables, 12, 220),
    usageNotes: normalizeNullableText(getPayloadField(payload, 'usageNotes', 'usage_notes'), 2000),
    safeguards: [
      'External connector actions require a separate approved action.',
      'No connector is marked connected unless provider verification succeeds.'
    ]
  };
}

export async function createPodDesignBrief(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{ brief: ReturnType<typeof mapPodBrief>; previewCard: Record<string, unknown> } | PodErrorResult | PodBlockedResult> {
  if (!approvalPreviewCard) return { blocked: 'pod_design_brief_create requires a preview_card in the approved action payload before writing.', status: 400 };
  const brief = buildCreativeBrief(payload);
  if (!brief) return { blocked: 'POD design brief needs a title and description.', status: 400 };

  const { data, error } = await auth.supabase
    .from('pod_design_briefs')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      title: brief.title,
      description: brief.description,
      format: brief.format,
      platforms: brief.platforms,
      brand_guidelines: brief.brandGuidelines,
      dimensions_requested: brief.dimensionsRequested,
      status: 'draft',
      brand_name: brief.brandName,
      product_type: brief.productType,
      target_audience: brief.targetAudience,
      style_keywords: brief.styleKeywords,
      color_palette: brief.colorPalette,
      placement: brief.placement,
      prompt: brief.prompt,
      negative_prompt: brief.negativePrompt,
      fulfillment_targets: brief.fulfillmentTargets,
      marketing_angles: brief.marketingAngles,
      creative_brief: brief,
      preview_card: approvalPreviewCard
    })
    .select('id,approval_id,title,description,format,platforms,brand_guidelines,dimensions_requested,status,asset_id,brand_name,product_type,target_audience,style_keywords,color_palette,placement,prompt,negative_prompt,fulfillment_targets,marketing_angles,creative_brief,preview_card,created_at,updated_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('pod-business', 'pod_design_briefs') };
    return { error };
  }

  return { brief: mapPodBrief(data), previewCard: approvalPreviewCard };
}

async function loadPodBrief(auth: ApiUserContext, id: string) {
  const { data, error } = await auth.supabase
    .from('pod_design_briefs')
    .select('id,approval_id,title,description,format,platforms,brand_guidelines,dimensions_requested,status,asset_id,brand_name,product_type,target_audience,style_keywords,color_palette,placement,prompt,negative_prompt,fulfillment_targets,marketing_angles,creative_brief,preview_card,created_at,updated_at')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('pod-business', 'pod_design_briefs') };
    return { error };
  }
  if (!data) return { blocked: 'POD design brief not found for this user.', status: 404 };
  return { brief: mapPodBrief(data) };
}

async function loadGfxAsset(auth: ApiUserContext, id: string) {
  const { data, error } = await auth.supabase
    .from('gfx_assets')
    .select('id,approval_id,pod_design_brief_id,gfxtools_job_id,external_job_id,asset_url,asset_type,dimensions,platform_variants,status,connector_state,error_message,created_at,updated_at')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('pod-business', 'gfx_assets') };
    return { error };
  }
  if (!data) return { blocked: 'GFX asset not found for this user.', status: 404 };
  return { asset: mapGfxAsset(data) };
}

async function submitToGfxTools(jobPayload: Record<string, unknown>) {
  const apiKey = cleanEnv(process.env.GFXTOOLS_API_KEY);
  const apiUrl = cleanEnv(process.env.GFXTOOLS_API_URL);
  if (!apiKey || !apiUrl) {
    return {
      ok: false,
      state: 'disconnected' as ConnectorState,
      message: 'GFXTools API key or endpoint is missing server-side.',
      externalCallPerformed: false
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobPayload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        state: 'configured_unverified' as ConnectorState,
        message: normalizeText((body as Record<string, unknown>).error || response.statusText, 500) || 'GFXTools request failed.',
        externalCallPerformed: true,
        providerBody: body
      };
    }
    return {
      ok: true,
      state: 'configured_unverified' as ConnectorState,
      message: 'GFXTools request accepted.',
      externalCallPerformed: true,
      providerBody: normalizeJsonObject(body)
    };
  } catch (error) {
    return {
      ok: false,
      state: 'configured_unverified' as ConnectorState,
      message: error instanceof Error ? error.message : 'GFXTools request failed.',
      externalCallPerformed: true
    };
  }
}

export async function createGfxToolsJob(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{
  job: ReturnType<typeof mapGfxJob>;
  asset: ReturnType<typeof mapGfxAsset>;
  previewCard: Record<string, unknown>;
  connector: ReturnType<typeof connectorStatus>;
  externalCallPerformed: boolean;
} | PodErrorResult | PodBlockedResult> {
  if (!approvalPreviewCard) return { blocked: 'gfxtools_job_create requires a preview_card in the approved action payload before writing.', status: 400 };
  const briefId = normalizeNullableText(getPayloadField(payload, 'briefId', 'brief_id'), 80) || normalizeNullableText(getPayloadField(payload, 'podDesignBriefId', 'pod_design_brief_id'), 80);
  let brief: ReturnType<typeof mapPodBrief> | null = null;
  if (briefId) {
    const loaded = await loadPodBrief(auth, briefId);
    if (!('brief' in loaded)) return loaded;
    brief = loaded.brief || null;
  }

  const format = normalizeFormat(payload.format || brief?.format);
  const dimensions = normalizeDimensions(getPayloadField(payload, 'dimensions', 'dimensions_requested') || brief?.dimensionsRequested, format === 'video' ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 });
  const description = normalizeText(payload.description, 5000) || brief?.description || brief?.prompt || '';
  const connector = connectorStatus('gfxtools');
  const requestPayload = {
    description,
    dimensions,
    format,
    brandGuidelines: normalizeNullableText(getPayloadField(payload, 'brandGuidelines', 'brand_guidelines'), 4000) || brief?.brandGuidelines || null,
    platforms: normalizeStringArray(payload.platforms, 12, 40).length ? normalizeStringArray(payload.platforms, 12, 40) : brief?.platforms || [],
    title: normalizeNullableText(payload.title, 220) || brief?.title || null,
    sourceBriefId: brief?.id || null
  };
  if (!description) return { blocked: 'GFXTools job needs a creative brief description.', status: 400 };

  const submitted = await submitToGfxTools(requestPayload);
  const providerBody = normalizeJsonObject(submitted.providerBody);
  const externalJobId = normalizeNullableText(providerBody.job_id || providerBody.jobId || providerBody.id, 300);
  const outputUrl = normalizeUrl(providerBody.asset_url || providerBody.assetUrl || providerBody.output_url || providerBody.outputUrl || providerBody.url);
  const jobStatus = submitted.ok ? (outputUrl ? 'ready' : 'pending') : (connector.state === 'disconnected' ? 'failed' : 'failed');
  const assetStatus = outputUrl ? 'ready' : (submitted.ok ? 'pending' : 'failed');

  const { data: jobData, error: jobError } = await auth.supabase
    .from('gfxtools_jobs')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      pod_design_brief_id: brief?.id || null,
      status: jobStatus,
      connector_state: submitted.state,
      job_payload: {
        provider: 'gfxtools',
        request: requestPayload,
        response: providerBody,
        externalCallPerformed: submitted.externalCallPerformed,
        message: submitted.message
      },
      preview_card: approvalPreviewCard,
      external_job_id: externalJobId,
      external_call_performed: submitted.externalCallPerformed
    })
    .select('id,approval_id,pod_design_brief_id,status,connector_state,job_payload,preview_card,external_job_id,external_call_performed,created_at,updated_at')
    .single();

  if (jobError) {
    if (safeTableMissing(jobError)) return { error: missingMigrationResponse('pod-business', 'gfxtools_jobs') };
    return { error: jobError };
  }

  const { data: assetData, error: assetError } = await auth.supabase
    .from('gfx_assets')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      pod_design_brief_id: brief?.id || null,
      gfxtools_job_id: jobData.id,
      external_job_id: externalJobId,
      asset_url: outputUrl,
      asset_type: format,
      dimensions,
      platform_variants: [],
      status: assetStatus,
      connector_state: submitted.state,
      error_message: submitted.ok ? null : submitted.message
    })
    .select('id,approval_id,pod_design_brief_id,gfxtools_job_id,external_job_id,asset_url,asset_type,dimensions,platform_variants,status,connector_state,error_message,created_at,updated_at')
    .single();

  if (assetError) {
    if (safeTableMissing(assetError)) return { error: missingMigrationResponse('pod-business', 'gfx_assets') };
    return { error: assetError };
  }

  if (brief?.id) {
    await auth.supabase
      .from('pod_design_briefs')
      .update({ status: assetStatus === 'ready' ? 'complete' : 'submitted', asset_id: assetData.id })
      .eq('id', brief.id)
      .eq('user_id', auth.user.id);
  }

  return {
    job: mapGfxJob(jobData),
    asset: mapGfxAsset(assetData),
    previewCard: approvalPreviewCard,
    connector,
    externalCallPerformed: submitted.externalCallPerformed
  };
}

function buildVariantUrl(assetUrl: string, platform: string, variant: string, width: number, height: number) {
  const url = new URL(assetUrl);
  url.searchParams.set('platform', platform);
  url.searchParams.set('variant', variant);
  url.searchParams.set('w', String(width));
  url.searchParams.set('h', String(height));
  return url.toString();
}

export async function resizeGfxAsset(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{
  asset: ReturnType<typeof mapGfxAsset>;
  event: ReturnType<typeof mapAssetReadyEvent>;
  previewCard: Record<string, unknown>;
} | PodErrorResult | PodBlockedResult> {
  if (!approvalPreviewCard) return { blocked: 'gfxtools_asset_resize requires a preview_card before resizing.', status: 400 };
  const assetId = normalizeText(getPayloadField(payload, 'assetId', 'asset_id'), 80);
  if (!assetId) return { blocked: 'asset_id is required.', status: 400 };
  const loaded = await loadGfxAsset(auth, assetId);
  if (!('asset' in loaded)) return loaded;
  if (!loaded.asset) return { blocked: 'GFX asset not found for this user.', status: 404 };
  const asset = loaded.asset;
  if (asset.status !== 'ready') return { blocked: `GFX asset is ${asset.status}; only ready assets can be resized for social handoff.`, status: 400 };
  if (!asset.assetUrl) return { blocked: 'GFX asset has no asset_url.', status: 400 };

  const variants = PLATFORM_SIZES.map(item => ({
    platform: item.platform,
    variant: item.variant,
    width: item.width,
    height: item.height,
    assetUrl: buildVariantUrl(asset.assetUrl, item.platform, item.variant, item.width, item.height),
    sourceAssetId: asset.id
  }));

  const { data: assetData, error: assetError } = await auth.supabase
    .from('gfx_assets')
    .update({ platform_variants: variants, status: 'ready' })
    .eq('id', asset.id)
    .eq('user_id', auth.user.id)
    .select('id,approval_id,pod_design_brief_id,gfxtools_job_id,external_job_id,asset_url,asset_type,dimensions,platform_variants,status,connector_state,error_message,created_at,updated_at')
    .single();

  if (assetError) {
    if (safeTableMissing(assetError)) return { error: missingMigrationResponse('pod-business', 'gfx_assets') };
    return { error: assetError };
  }

  const { data: eventData, error: eventError } = await auth.supabase
    .from('asset_ready_events')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      asset_id: asset.id,
      event_type: 'asset_ready',
      payload: {
        assetId: asset.id,
        assetUrl: asset.assetUrl,
        assetType: asset.assetType,
        platformVariants: variants
      }
    })
    .select('id,approval_id,asset_id,event_type,payload,consumed_at,created_at')
    .single();

  if (eventError) {
    if (safeTableMissing(eventError)) return { error: missingMigrationResponse('pod-business', 'asset_ready_events') };
    return { error: eventError };
  }

  return { asset: mapGfxAsset(assetData), event: mapAssetReadyEvent(eventData), previewCard: approvalPreviewCard };
}

export async function prepareShopifyProduct(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{ preparation: ReturnType<typeof mapShopifyPreparation>; previewCard: Record<string, unknown>; connector: ReturnType<typeof connectorStatus> } | PodErrorResult | PodBlockedResult> {
  if (!approvalPreviewCard) return { blocked: 'shopify_product_prepare requires a preview_card before product preparation.', status: 400 };
  const assetId = normalizeText(getPayloadField(payload, 'assetId', 'asset_id'), 80);
  if (!assetId) return { blocked: 'asset_id is required.', status: 400 };
  const loaded = await loadGfxAsset(auth, assetId);
  if (!('asset' in loaded)) return loaded;
  if (!loaded.asset) return { blocked: 'GFX asset not found for this user.', status: 404 };
  const asset = loaded.asset;
  if (asset.status !== 'ready') return { blocked: 'Only ready GFXTools assets can be used for Shopify product preparation.', status: 400 };

  const connector = connectorStatus('shopify');
  const productPayload = {
    title: normalizeText(payload.title, 220) || 'CubiQo POD product',
    description: normalizeText(payload.description, 4000),
    assetId: asset.id,
    assetUrl: asset.assetUrl,
    assetType: asset.assetType,
    priceRange: normalizeNullableText(getPayloadField(payload, 'priceRange', 'price_range'), 80),
    variants: asset.platformVariants,
    estimatedAction: 'create_product',
    externalCallReady: connector.state !== 'disconnected'
  };

  const { data, error } = await auth.supabase
    .from('shopify_product_preparations')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      asset_id: asset.id,
      connector_state: connector.state,
      product_payload: productPayload,
      preview_card: approvalPreviewCard,
      status: connector.state === 'disconnected' ? 'blocked_missing_credentials' : 'prepared',
      external_call_performed: false
    })
    .select('id,approval_id,asset_id,connector_state,product_payload,preview_card,status,external_call_performed,external_product_id,created_at,updated_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('pod-business', 'shopify_product_preparations') };
    return { error };
  }

  return { preparation: mapShopifyPreparation(data), previewCard: approvalPreviewCard, connector };
}

export async function preparePrintifyDesign(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{ preparation: ReturnType<typeof mapPrintifyPreparation>; previewCard: Record<string, unknown>; connector: ReturnType<typeof connectorStatus> } | PodErrorResult | PodBlockedResult> {
  if (!approvalPreviewCard) return { blocked: 'printify_design_prepare requires a preview_card before design preparation.', status: 400 };
  const assetId = normalizeText(getPayloadField(payload, 'assetId', 'asset_id'), 80);
  if (!assetId) return { blocked: 'asset_id is required.', status: 400 };
  const loaded = await loadGfxAsset(auth, assetId);
  if (!('asset' in loaded)) return loaded;
  if (!loaded.asset) return { blocked: 'GFX asset not found for this user.', status: 404 };
  const asset = loaded.asset;
  if (asset.status !== 'ready') return { blocked: 'Only ready GFXTools assets can be used for Printify design preparation.', status: 400 };

  const connector = connectorStatus('printify');
  const designPayload = {
    assetId: asset.id,
    assetUrl: asset.assetUrl,
    assetType: asset.assetType,
    productTemplate: normalizeText(getPayloadField(payload, 'productTemplate', 'product_template'), 220) || 't-shirt',
    placement: normalizeText(payload.placement, 220) || 'front',
    variants: asset.platformVariants,
    estimatedAction: 'submit_design',
    externalCallReady: connector.state !== 'disconnected'
  };

  const { data, error } = await auth.supabase
    .from('printify_design_preparations')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      asset_id: asset.id,
      connector_state: connector.state,
      design_payload: designPayload,
      preview_card: approvalPreviewCard,
      status: connector.state === 'disconnected' ? 'blocked_missing_credentials' : 'prepared',
      external_call_performed: false
    })
    .select('id,approval_id,asset_id,connector_state,design_payload,preview_card,status,external_call_performed,external_design_id,created_at,updated_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('pod-business', 'printify_design_preparations') };
    return { error };
  }

  return { preparation: mapPrintifyPreparation(data), previewCard: approvalPreviewCard, connector };
}
