import { NextResponse } from 'next/server';
import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';

export const POD_ACTION_TYPES = [
  'pod_design_brief_create',
  'gfxtools_job_create'
] as const;

export type PodActionType = typeof POD_ACTION_TYPES[number];

type PodErrorResult = { error: Response | Error };
type PodBlockedResult = { blocked: string; status?: number };

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

type ConnectorState = 'disconnected' | 'configured_unverified' | 'connected';

function connectorStatus(provider: 'gfxtools' | 'shopify' | 'printify') {
  const configs = {
    gfxtools: {
      label: 'GFXTools',
      required: ['GFXTOOLS_API_KEY'],
      present: [cleanEnv(process.env.GFXTOOLS_API_KEY)]
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
    approvalId: row.approval_id,
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

export async function listPodBusinessState(auth: ApiUserContext): Promise<{
  connectors: ReturnType<typeof connectorStatus>[];
  podDesignBriefs: ReturnType<typeof mapPodBrief>[];
  gfxToolsJobs: ReturnType<typeof mapGfxJob>[];
} | PodErrorResult> {
  const [briefsResult, jobsResult] = await Promise.all([
    auth.supabase
      .from('pod_design_briefs')
      .select('id,approval_id,brand_name,product_type,target_audience,style_keywords,color_palette,placement,prompt,negative_prompt,fulfillment_targets,marketing_angles,creative_brief,preview_card,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    auth.supabase
      .from('gfxtools_jobs')
      .select('id,approval_id,pod_design_brief_id,status,connector_state,job_payload,preview_card,external_job_id,external_call_performed,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(12)
  ]);

  if (briefsResult.error) {
    if (safeTableMissing(briefsResult.error)) return { error: missingMigrationResponse('pod-business', 'pod_design_briefs') };
    return { error: briefsResult.error };
  }
  if (jobsResult.error) {
    if (safeTableMissing(jobsResult.error)) return { error: missingMigrationResponse('pod-business', 'gfxtools_jobs') };
    return { error: jobsResult.error };
  }

  return {
    ...getPodConnectorStatuses(),
    podDesignBriefs: (briefsResult.data || []).map(mapPodBrief),
    gfxToolsJobs: (jobsResult.data || []).map(mapGfxJob)
  };
}

function buildCreativeBrief(payload: Record<string, unknown>) {
  const brandName = normalizeNullableText(getPayloadField(payload, 'brandName', 'brand_name'), 180);
  const productType = normalizeText(getPayloadField(payload, 'productType', 'product_type'), 180) || 't-shirt';
  const targetAudience = normalizeNullableText(getPayloadField(payload, 'targetAudience', 'target_audience'), 500);
  const styleKeywords = normalizeStringArray(getPayloadField(payload, 'styleKeywords', 'style_keywords'), 16);
  const colorPalette = normalizeStringArray(getPayloadField(payload, 'colorPalette', 'color_palette'), 10);
  const placement = normalizeNullableText(payload.placement, 200);
  const prompt = normalizeText(payload.prompt, 5000);
  const negativePrompt = normalizeNullableText(getPayloadField(payload, 'negativePrompt', 'negative_prompt'), 2000);
  const fulfillmentTargets = normalizeStringArray(getPayloadField(payload, 'fulfillmentTargets', 'fulfillment_targets'), 10);
  const marketingAngles = normalizeStringArray(getPayloadField(payload, 'marketingAngles', 'marketing_angles'), 12, 240);

  if (!productType || !prompt) return null;

  return {
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
    deliverables: normalizeStringArray(payload.deliverables, 12, 220),
    usageNotes: normalizeNullableText(getPayloadField(payload, 'usageNotes', 'usage_notes'), 2000),
    safeguards: [
      'No external design job is created from this brief without a separate approved action.',
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
  if (!brief) return { blocked: 'POD design brief needs product_type and prompt.', status: 400 };

  const { data, error } = await auth.supabase
    .from('pod_design_briefs')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
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
    .select('id,approval_id,brand_name,product_type,target_audience,style_keywords,color_palette,placement,prompt,negative_prompt,fulfillment_targets,marketing_angles,creative_brief,preview_card,created_at,updated_at')
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
    .select('id,approval_id,brand_name,product_type,target_audience,style_keywords,color_palette,placement,prompt,negative_prompt,fulfillment_targets,marketing_angles,creative_brief,preview_card,created_at,updated_at')
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

export async function createGfxToolsJob(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  approvalPreviewCard: Record<string, unknown> | null
): Promise<{ job: ReturnType<typeof mapGfxJob>; previewCard: Record<string, unknown>; connector: ReturnType<typeof connectorStatus> } | PodErrorResult | PodBlockedResult> {
  if (!approvalPreviewCard) return { blocked: 'gfxtools_job_create requires a preview_card in the approved action payload before writing.', status: 400 };
  const briefId = normalizeNullableText(getPayloadField(payload, 'podDesignBriefId', 'pod_design_brief_id'), 80);
  let brief: ReturnType<typeof mapPodBrief> | null = null;
  if (briefId) {
    const loaded = await loadPodBrief(auth, briefId);
    if (!('brief' in loaded)) return loaded;
    if (!loaded.brief) return { blocked: 'POD design brief not found for this user.', status: 404 };
    brief = loaded.brief;
  }

  const connector = connectorStatus('gfxtools');
  const jobPayload = {
    provider: 'gfxtools',
    mode: 'prepare_only',
    briefId: brief?.id || null,
    brandName: normalizeNullableText(getPayloadField(payload, 'brandName', 'brand_name'), 180) || brief?.brandName || null,
    productType: normalizeNullableText(getPayloadField(payload, 'productType', 'product_type'), 180) || brief?.productType || 't-shirt',
    prompt: normalizeText(payload.prompt, 5000) || brief?.prompt || '',
    negativePrompt: normalizeNullableText(getPayloadField(payload, 'negativePrompt', 'negative_prompt'), 2000) || brief?.negativePrompt || null,
    styleKeywords: normalizeStringArray(getPayloadField(payload, 'styleKeywords', 'style_keywords')).length
      ? normalizeStringArray(getPayloadField(payload, 'styleKeywords', 'style_keywords'))
      : brief?.styleKeywords || [],
    colorPalette: normalizeStringArray(getPayloadField(payload, 'colorPalette', 'color_palette')).length
      ? normalizeStringArray(getPayloadField(payload, 'colorPalette', 'color_palette'))
      : brief?.colorPalette || [],
    output: normalizeJsonObject(payload.output),
    connectorState: connector.state,
    externalCallPlanned: connector.state !== 'disconnected',
    externalCallPerformed: false,
    disclaimer: 'Prepared only. No GFXTools API call is made until a later verified connector execution is approved.'
  };

  if (!jobPayload.prompt) return { blocked: 'GFXTools job payload needs a prompt or an existing POD brief with a prompt.', status: 400 };

  const { data, error } = await auth.supabase
    .from('gfxtools_jobs')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      pod_design_brief_id: brief?.id || null,
      status: connector.state === 'disconnected' ? 'blocked_missing_credentials' : 'prepared',
      connector_state: connector.state,
      job_payload: jobPayload,
      preview_card: approvalPreviewCard,
      external_call_performed: false
    })
    .select('id,approval_id,pod_design_brief_id,status,connector_state,job_payload,preview_card,external_job_id,external_call_performed,created_at,updated_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('pod-business', 'gfxtools_jobs') };
    return { error };
  }

  return { job: mapGfxJob(data), previewCard: approvalPreviewCard, connector };
}
