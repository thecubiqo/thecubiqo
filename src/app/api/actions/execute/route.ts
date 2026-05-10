import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, type ApiUserContext } from '../../_lib/supabase-admin';
import { getActionCapability } from '../../_lib/v2-capabilities';
import { completeApproval, normalizeActionType, normalizePayload, normalizeToolName, requireApprovedAction, writeAudit } from '../../_lib/v2-actions';
import {
  getHardStopReason,
  getUrlAllowlistDecision
} from '../../_lib/guardrails';
import {
  closeBrowserSession,
  createBrowserSession,
  isBrowserAction,
  listBrowserSessions,
  normalizeBrowserPayload,
  normalizeBrowserSessionId,
  recordBrowserAction
} from '../../_lib/browser-sessions';
import {
  approvePreparedJobApplication,
  isJobAction,
  listJobWorkflowState,
  prepareJobApplication,
  saveJobSearch
} from '../../_lib/job-workflows';
import {
  getApprovalPreviewCard,
  isJobProfileAction,
  listJobProfileState,
  writeJobProfile,
  writeResumeVersion
} from '../../_lib/job-profile-workflows';
import {
  createGfxToolsJob,
  createPodDesignBrief,
  getPodApprovalPreviewCard,
  getPodConnectorStatuses,
  isPodAction,
  listPodBusinessState,
  preparePrintifyDesign,
  prepareShopifyProduct,
  resizeGfxAsset
} from '../../_lib/pod-business-workflows';
import {
  getSocialApprovalPreviewCard,
  getSocialConnectorStatuses,
  isSocialAction,
  listSocialState,
  prepareSocialPost,
  scheduleSocialPost
} from '../../_lib/social-workflows';
import {
  assignShopifyCollection,
  connectAfterShip,
  connectDirectProvider,
  connectShopifyStore,
  createBundle,
  createProviderDesign,
  createShopifyCollection,
  createShopifyProduct,
  isShopifyPodOperationAction,
  listCommerceState,
  mutateShopifyProduct,
  readAfterShipReturns,
  readAfterShipTracking,
  readAnalytics,
  readBundles,
  readFulfilmentProviders,
  readInventory,
  readMarketplaceStatus,
  readOrderSummary,
  readProviderProductStatus,
  readShopifyStoreStatus,
  syncProviderProduct,
  updateInventory
} from '../../_lib/shopify-pod-operations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  if (request.nextUrl.searchParams.get('browser_sessions') === 'active') {
    const result = await listBrowserSessions(auth, 'active');
    if ('error' in result && result.error) return result.error instanceof Response ? result.error : NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ browserSessions: 'sessions' in result ? result.sessions : [] });
  }

  if (request.nextUrl.searchParams.get('job_state') === '1') {
    const [jobResult, profileResult] = await Promise.all([
      listJobWorkflowState(auth),
      listJobProfileState(auth)
    ]);
    if ('error' in jobResult && jobResult.error) return jobResult.error instanceof Response ? jobResult.error : NextResponse.json({ error: jobResult.error.message }, { status: 500 });
    if ('error' in profileResult && profileResult.error) return profileResult.error instanceof Response ? profileResult.error : NextResponse.json({ error: profileResult.error.message }, { status: 500 });
    return NextResponse.json({ ...jobResult, ...profileResult });
  }

  if (request.nextUrl.searchParams.get('pod_state') === '1') {
    const result = await listPodBusinessState(auth);
    if ('error' in result && result.error) return result.error instanceof Response ? result.error : NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json(result);
  }

  if (request.nextUrl.searchParams.get('social_state') === '1') {
    const result = await listSocialState(auth);
    if ('error' in result && result.error) return result.error instanceof Response ? result.error : NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json(result);
  }

  if (request.nextUrl.searchParams.get('commerce_state') === '1') {
    const result = await listCommerceState(auth);
    if ('error' in result && result.error) return result.error instanceof Response ? result.error : NextResponse.json({ error: result.error instanceof Error ? result.error.message : 'Commerce state failed' }, { status: 500 });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Unsupported execute query' }, { status: 400 });
}

async function handleSocialConnectorStatusAction(auth: ApiUserContext, actionType: string, toolName: string) {
  if (actionType !== 'social_connector_status') return null;
  const statuses = getSocialConnectorStatuses().connectors;
  await writeAudit(auth, {
    actionType,
    toolName,
    status: 'completed',
    message: 'Social connector status checked without exposing credentials',
    result: { connectors: statuses, performedExternalAction: false }
  });
  return NextResponse.json({ executed: true, readOnly: true, connectors: statuses, performedExternalAction: false });
}

async function handleSocialAction(
  auth: ApiUserContext,
  actionType: string,
  toolName: string,
  body: Record<string, any>
) {
  if (!isSocialAction(actionType)) return null;

  const capability = getActionCapability(actionType);
  if (!capability || capability.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Social workflow blocked because the capability is locked',
      input: { actionType },
      result: { capabilityStatus: capability?.status || 'missing', requirements: capability?.requirements || [] }
    });
    return NextResponse.json({ error: 'Social workflow is locked until this capability is active', executed: false, capability }, { status: 501 });
  }

  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, actionType);
  if (approvalCheck.error) return approvalCheck.error;

  const payload = normalizePayload(approvalCheck.approval?.payload);
  const previewCard = getSocialApprovalPreviewCard(approvalCheck.approval);
  try {
    if (actionType === 'social_post_prepare') {
      const prepared = await prepareSocialPost(auth, approvalId, payload, previewCard);
      if ('error' in prepared && prepared.error) return prepared.error instanceof Response ? prepared.error : NextResponse.json({ error: prepared.error.message }, { status: 500 });
      if ('blocked' in prepared && prepared.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: prepared.blocked,
          input: { platforms: payload.platforms, assetUrl: payload.assetUrl || payload.asset_url, gfxToolsJobId: payload.gfxToolsJobId || payload.gfx_tools_job_id }
        });
        return NextResponse.json({ error: prepared.blocked, executed: false }, { status: prepared.status || 400 });
      }
      if (!('draft' in prepared)) return NextResponse.json({ error: 'Social post draft could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Prepared platform-aware social post variants',
        input: { platforms: prepared.draft.platforms, assetUrl: prepared.draft.assetUrl },
        result: { draft: prepared.draft, previewCard: prepared.previewCard, performedExternalAction: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, draft: prepared.draft, previewCard: prepared.previewCard, performedExternalAction: false });
    }

    if (actionType === 'social_post_schedule_approved') {
      const scheduled = await scheduleSocialPost(auth, approvalId, payload, previewCard);
      if ('error' in scheduled && scheduled.error) return scheduled.error instanceof Response ? scheduled.error : NextResponse.json({ error: scheduled.error.message }, { status: 500 });
      if ('blocked' in scheduled && scheduled.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: scheduled.blocked,
          input: { socialContentDraftId: payload.socialContentDraftId || payload.social_content_draft_id, platforms: payload.platforms }
        });
        return NextResponse.json({ error: scheduled.blocked, executed: false }, { status: scheduled.status || 400 });
      }
      if (!('rule' in scheduled)) return NextResponse.json({ error: 'Social distribution schedule could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Created approved social distribution rule and scheduled post rows',
        input: { socialContentDraftId: payload.socialContentDraftId || payload.social_content_draft_id, platforms: scheduled.rule.platforms, intervalMinutes: scheduled.rule.intervalMinutes },
        result: {
          rule: scheduled.rule,
          scheduledPosts: scheduled.scheduledPosts,
          fireLogs: scheduled.fireLogs,
          connectors: scheduled.connectors,
          previewCard: scheduled.previewCard,
          externalCallsPerformed: false
        }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({
        executed: true,
        rule: scheduled.rule,
        scheduledPosts: scheduled.scheduledPosts,
        fireLogs: scheduled.fireLogs,
        connectors: scheduled.connectors,
        previewCard: scheduled.previewCard,
        externalCallsPerformed: false
      });
    }

    return null;
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Social workflow failed',
      input: payload
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Social workflow failed', executed: false }, { status: 400 });
  }
}

async function handleConnectorStatusAction(auth: ApiUserContext, actionType: string, toolName: string) {
  if (!['gfxtools_connector_status', 'shopify_connector_status', 'printify_connector_status'].includes(actionType)) {
    return null;
  }

  const statuses = getPodConnectorStatuses().connectors;
  const provider = actionType.replace('_connector_status', '');
  const connector = statuses.find(item => item.provider === provider);
  await writeAudit(auth, {
    actionType,
    toolName,
    status: 'completed',
    message: `${connector?.label || provider} connector status checked without exposing credentials`,
    result: { connector, performedExternalAction: false }
  });
  return NextResponse.json({
    executed: true,
    readOnly: true,
    connector,
    connectors: statuses,
    performedExternalAction: false
  });
}

async function handlePodAction(
  auth: ApiUserContext,
  actionType: string,
  toolName: string,
  body: Record<string, any>
) {
  if (!isPodAction(actionType)) {
    return null;
  }

  const capability = getActionCapability(actionType);
  if (!capability || capability.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'POD workflow blocked because the capability is locked',
      input: { actionType },
      result: {
        capabilityStatus: capability?.status || 'missing',
        requirements: capability?.requirements || []
      }
    });
    return NextResponse.json(
      {
        error: 'POD workflow is locked until this capability is active',
        executed: false,
        capability
      },
      { status: 501 }
    );
  }

  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, actionType);
  if (approvalCheck.error) return approvalCheck.error;

  const payload = normalizePayload(approvalCheck.approval?.payload);
  const previewCard = getPodApprovalPreviewCard(approvalCheck.approval);
  try {
    if (actionType === 'pod_design_brief_create') {
      const created = await createPodDesignBrief(auth, approvalId, payload, previewCard);
      if ('error' in created && created.error) return created.error instanceof Response ? created.error : NextResponse.json({ error: created.error.message }, { status: 500 });
      if ('blocked' in created && created.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: created.blocked,
          input: { productType: payload.productType || payload.product_type }
        });
        return NextResponse.json({ error: created.blocked, executed: false }, { status: created.status || 400 });
      }
      if (!('brief' in created)) return NextResponse.json({ error: 'POD design brief could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Saved approved POD design brief',
        input: { brandName: payload.brandName || payload.brand_name, productType: payload.productType || payload.product_type },
        result: { brief: created.brief, previewCard: created.previewCard, performedExternalAction: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, brief: created.brief, previewCard: created.previewCard, performedExternalAction: false });
    }

    if (actionType === 'gfxtools_job_create') {
      const created = await createGfxToolsJob(auth, approvalId, payload, previewCard);
      if ('error' in created && created.error) return created.error instanceof Response ? created.error : NextResponse.json({ error: created.error.message }, { status: 500 });
      if ('blocked' in created && created.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: created.blocked,
          input: { podDesignBriefId: payload.podDesignBriefId || payload.pod_design_brief_id }
        });
        return NextResponse.json({ error: created.blocked, executed: false }, { status: created.status || 400 });
      }
      if (!('job' in created)) return NextResponse.json({ error: 'GFXTools job payload could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Processed approved GFXTools job and saved structured asset state',
        input: { briefId: payload.briefId || payload.brief_id || payload.podDesignBriefId || payload.pod_design_brief_id },
        result: {
          job: created.job,
          asset: created.asset,
          previewCard: created.previewCard,
          connector: created.connector,
          externalCallPerformed: created.externalCallPerformed
        }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({
        executed: true,
        job: created.job,
        asset: created.asset,
        previewCard: created.previewCard,
        connector: created.connector,
        externalCallPerformed: created.externalCallPerformed
      });
    }

    if (actionType === 'gfxtools_asset_resize') {
      const resized = await resizeGfxAsset(auth, approvalId, payload, previewCard);
      if ('error' in resized && resized.error) return resized.error instanceof Response ? resized.error : NextResponse.json({ error: resized.error.message }, { status: 500 });
      if ('blocked' in resized && resized.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: resized.blocked,
          input: { assetId: payload.assetId || payload.asset_id }
        });
        return NextResponse.json({ error: resized.blocked, executed: false }, { status: resized.status || 400 });
      }
      if (!('asset' in resized)) return NextResponse.json({ error: 'GFXTools asset could not be resized', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Generated platform-sized variants and emitted asset_ready event',
        input: { assetId: payload.assetId || payload.asset_id },
        result: {
          asset: resized.asset,
          assetReadyEvent: resized.event,
          previewCard: resized.previewCard,
          externalCallPerformed: false
        }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({
        executed: true,
        asset: resized.asset,
        assetReadyEvent: resized.event,
        previewCard: resized.previewCard,
        externalCallPerformed: false
      });
    }

    if (actionType === 'shopify_product_prepare') {
      const prepared = await prepareShopifyProduct(auth, approvalId, payload, previewCard);
      if ('error' in prepared && prepared.error) return prepared.error instanceof Response ? prepared.error : NextResponse.json({ error: prepared.error.message }, { status: 500 });
      if ('blocked' in prepared && prepared.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: prepared.blocked,
          input: { assetId: payload.assetId || payload.asset_id }
        });
        return NextResponse.json({ error: prepared.blocked, executed: false }, { status: prepared.status || 400 });
      }
      if (!('preparation' in prepared)) return NextResponse.json({ error: 'Shopify product preparation could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Prepared approved Shopify product payload',
        input: { assetId: payload.assetId || payload.asset_id },
        result: {
          preparation: prepared.preparation,
          connector: prepared.connector,
          previewCard: prepared.previewCard,
          assetId: prepared.preparation.assetId,
          service: 'shopify',
          externalCallPerformed: false
        }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({
        executed: true,
        preparation: prepared.preparation,
        connector: prepared.connector,
        previewCard: prepared.previewCard,
        externalCallPerformed: false
      });
    }

    if (actionType === 'printify_design_prepare') {
      const prepared = await preparePrintifyDesign(auth, approvalId, payload, previewCard);
      if ('error' in prepared && prepared.error) return prepared.error instanceof Response ? prepared.error : NextResponse.json({ error: prepared.error.message }, { status: 500 });
      if ('blocked' in prepared && prepared.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: prepared.blocked,
          input: { assetId: payload.assetId || payload.asset_id }
        });
        return NextResponse.json({ error: prepared.blocked, executed: false }, { status: prepared.status || 400 });
      }
      if (!('preparation' in prepared)) return NextResponse.json({ error: 'Printify design preparation could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Prepared approved Printify design payload',
        input: { assetId: payload.assetId || payload.asset_id },
        result: {
          preparation: prepared.preparation,
          connector: prepared.connector,
          previewCard: prepared.previewCard,
          assetId: prepared.preparation.assetId,
          service: 'printify',
          externalCallPerformed: false
        }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({
        executed: true,
        preparation: prepared.preparation,
        connector: prepared.connector,
        previewCard: prepared.previewCard,
        externalCallPerformed: false
      });
    }

    return null;
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName,
      status: 'failed',
      message: error instanceof Error ? error.message : 'POD workflow failed',
      input: payload
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'POD workflow failed', executed: false }, { status: 400 });
  }
}

const COMMERCE_READ_ACTIONS = new Set([
  'shopify_store_status',
  'fulfilment_provider_read',
  'provider_product_status',
  'shopify_inventory_read',
  'shopify_orders_read',
  'shopify_order_summary',
  'aftership_tracking_read',
  'aftership_returns_read',
  'shopify_analytics_read',
  'shopify_bundles_read',
  'marketplace_status_read'
]);

async function handleShopifyPodOperationAction(
  auth: ApiUserContext,
  actionType: string,
  toolName: string,
  body: Record<string, any>
) {
  if (!isShopifyPodOperationAction(actionType)) {
    return null;
  }

  const capability = getActionCapability(actionType);
  if (!capability || (!COMMERCE_READ_ACTIONS.has(actionType) && capability.status !== 'active')) {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Commerce workflow blocked because the capability is locked',
      input: { actionType },
      result: {
        capabilityStatus: capability?.status || 'missing',
        requirements: capability?.requirements || []
      }
    });
    return NextResponse.json({ error: 'Commerce workflow is locked until this capability is active', executed: false, capability }, { status: 501 });
  }

  if (COMMERCE_READ_ACTIONS.has(actionType)) {
    const payload = normalizePayload(body.payload);
    const readMap: Record<string, () => Promise<any>> = {
      shopify_store_status: () => readShopifyStoreStatus(auth),
      fulfilment_provider_read: () => readFulfilmentProviders(auth),
      provider_product_status: () => readProviderProductStatus(auth),
      shopify_inventory_read: () => readInventory(auth),
      shopify_orders_read: () => readOrderSummary(auth, payload),
      shopify_order_summary: () => readOrderSummary(auth, payload),
      aftership_tracking_read: () => readAfterShipTracking(auth),
      aftership_returns_read: () => readAfterShipReturns(auth),
      shopify_analytics_read: () => readAnalytics(auth, payload),
      shopify_bundles_read: () => readBundles(auth),
      marketplace_status_read: () => readMarketplaceStatus(auth)
    };
    const result = await readMap[actionType]();
    if ('error' in result && result.error) return result.error instanceof Response ? result.error : NextResponse.json({ error: result.error.message }, { status: 500 });
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'completed',
      message: 'Commerce read-only action completed without customer PII or external mutation',
      input: payload,
      result: { ...result, performedExternalAction: false }
    });
    return NextResponse.json({ executed: true, readOnly: true, result, performedExternalAction: false });
  }

  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, actionType);
  if (approvalCheck.error) return approvalCheck.error;

  const payload = normalizePayload(approvalCheck.approval?.payload);
  const previewCard = getPodApprovalPreviewCard(approvalCheck.approval);
  try {
    const writeMap: Record<string, () => Promise<any>> = {
      shopify_store_connect: () => connectShopifyStore(auth, approvalId, payload, previewCard),
      pod_provider_connect: () => connectDirectProvider(auth, approvalId, payload, previewCard),
      aftership_connect: () => connectAfterShip(auth, approvalId, payload, previewCard),
      shopify_product_create: () => createShopifyProduct(auth, approvalId, payload, previewCard),
      shopify_product_publish: () => mutateShopifyProduct(auth, approvalId, 'shopify_product_publish', payload, previewCard),
      shopify_product_update: () => mutateShopifyProduct(auth, approvalId, 'shopify_product_update', payload, previewCard),
      shopify_product_archive: () => mutateShopifyProduct(auth, approvalId, 'shopify_product_archive', payload, previewCard),
      design_create: () => createProviderDesign(auth, approvalId, payload, previewCard),
      product_sync: () => syncProviderProduct(auth, approvalId, payload, previewCard),
      shopify_collection_create: () => createShopifyCollection(auth, approvalId, payload, previewCard),
      shopify_collection_assign: () => assignShopifyCollection(auth, approvalId, payload, previewCard),
      shopify_inventory_update: () => updateInventory(auth, approvalId, payload, previewCard),
      shopify_bundle_create: () => createBundle(auth, approvalId, payload, previewCard)
    };

    const runner = writeMap[actionType];
    if (!runner) return null;
    const result = await runner();
    if ('error' in result && result.error) return result.error instanceof Response ? result.error : NextResponse.json({ error: result.error.message }, { status: 500 });
    if ('blocked' in result && result.blocked) {
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'blocked',
        message: result.blocked,
        input: payload,
        result: result.details || {}
      });
      return NextResponse.json({ error: result.blocked, executed: false, details: result.details || {} }, { status: result.status || 400 });
    }

    const productId = result.product?.productId || result.product?.product_id || payload.productId || payload.product_id || null;
    const provider = result.provider || payload.provider || payload.fulfillmentProvider || payload.fulfillment_provider || null;
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName,
      status: 'completed',
      message: 'Approved commerce operation completed through the server action boundary',
      input: {
        productId,
        provider,
        assetId: payload.assetId || payload.asset_id,
        service: payload.service || null
      },
      result
    });
    await completeApproval(auth, approvalId, true);
    return NextResponse.json({ executed: true, result });
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Commerce workflow failed',
      input: payload
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Commerce workflow failed', executed: false }, { status: 400 });
  }
}

async function handleJobProfileAction(
  auth: ApiUserContext,
  actionType: string,
  toolName: string,
  body: Record<string, any>
) {
  if (!isJobProfileAction(actionType)) {
    return null;
  }

  const capability = getActionCapability(actionType);
  if (!capability || capability.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Job profile workflow blocked because the capability is locked',
      input: { actionType },
      result: {
        capabilityStatus: capability?.status || 'missing',
        requirements: capability?.requirements || []
      }
    });
    return NextResponse.json(
      {
        error: 'Job profile workflow is locked until this capability is active',
        executed: false,
        capability
      },
      { status: 501 }
    );
  }

  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, actionType);
  if (approvalCheck.error) return approvalCheck.error;

  const payload = normalizePayload(approvalCheck.approval?.payload);
  const previewCard = getApprovalPreviewCard(approvalCheck.approval);
  try {
    if (actionType === 'job_profile_write') {
      const written = await writeJobProfile(auth, approvalId, payload, previewCard);
      if ('error' in written && written.error) return written.error instanceof Response ? written.error : NextResponse.json({ error: written.error.message }, { status: 500 });
      if ('blocked' in written && written.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: written.blocked,
          input: payload
        });
        return NextResponse.json({ error: written.blocked, executed: false }, { status: written.status || 400 });
      }
      if (!('profile' in written)) return NextResponse.json({ error: 'Job profile could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Saved approved job profile preview',
        input: { targetRoles: payload.targetRoles || payload.target_roles, skills: payload.skills },
        result: { profile: written.profile, previewCard: written.previewCard, performedExternalAction: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, profile: written.profile, previewCard: written.previewCard, performedExternalAction: false });
    }

    if (actionType === 'resume_version_write') {
      const written = await writeResumeVersion(auth, approvalId, payload, previewCard);
      if ('error' in written && written.error) return written.error instanceof Response ? written.error : NextResponse.json({ error: written.error.message }, { status: 500 });
      if ('blocked' in written && written.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: written.blocked,
          input: { name: payload.name || payload.versionName || payload.version_name }
        });
        return NextResponse.json({ error: written.blocked, executed: false }, { status: written.status || 400 });
      }
      if (!('resumeVersion' in written)) return NextResponse.json({ error: 'Resume version could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Appended approved resume version; no existing resume was overwritten',
        input: { name: payload.name || payload.versionName || payload.version_name, targetRole: payload.targetRole || payload.target_role },
        result: { resumeVersion: written.resumeVersion, previewCard: written.previewCard, appendOnly: true, performedExternalAction: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, resumeVersion: written.resumeVersion, previewCard: written.previewCard, appendOnly: true, performedExternalAction: false });
    }

    return null;
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Job profile workflow failed',
      input: payload
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Job profile workflow failed', executed: false }, { status: 400 });
  }
}

async function handleBrowserAction(
  auth: ApiUserContext,
  actionType: string,
  toolName: string,
  body: Record<string, any>
) {
  const control = getActionCapability('browser_control');
  if (!control || control.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Browser action blocked because browser_control is not unlocked',
      input: { actionType },
      result: { capabilityStatus: control?.status || 'missing' }
    });
    return NextResponse.json({ error: 'browser_control is not unlocked', executed: false, capability: control }, { status: 501 });
  }

  const browserSessionId = normalizeBrowserSessionId(body.browserSessionId ?? body.browser_session_id ?? body.payload?.browserSessionId ?? body.payload?.browser_session_id);
  if (actionType === 'browser_close') {
    if (!browserSessionId) {
      await writeAudit(auth, {
        actionType,
        toolName,
        status: 'blocked',
        message: 'Browser close blocked because browser_session_id was missing',
        input: { actionType }
      });
      return NextResponse.json({ error: 'browser_session_id is required', executed: false }, { status: 400 });
    }
    const closed = await closeBrowserSession(auth, browserSessionId);
    if ('error' in closed && closed.error) return closed.error instanceof Response ? closed.error : NextResponse.json({ error: closed.error.message }, { status: 500 });
    if ('blocked' in closed && closed.blocked) {
      await writeAudit(auth, {
        actionType,
        toolName,
        browserSessionId,
        status: 'blocked',
        message: closed.blocked
      });
      return NextResponse.json({ error: closed.blocked, executed: false }, { status: 404 });
    }
    if (!('session' in closed)) return NextResponse.json({ error: 'Browser session could not be stopped', executed: false }, { status: 500 });
    await writeAudit(auth, {
      approvalId: closed.session.approvalId,
      browserSessionId,
      actionType,
      toolName,
      status: 'cancelled',
      message: 'Browser session stopped by user',
      input: { browserSessionId },
      result: { session: closed.session }
    });
    return NextResponse.json({ executed: true, browserSession: closed.session });
  }

  if (!isBrowserAction(actionType)) {
    return null;
  }

  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, actionType);
  if (approvalCheck.error) return approvalCheck.error;

  const approval = approvalCheck.approval;
  const payload = normalizeBrowserPayload(body.payload);
  const approvedBrowserSessionId = normalizeBrowserSessionId(
    approval?.browser_session_id ?? approval?.payload?.browser_session_id
  );
  if (actionType !== 'browser_open') {
    if (!browserSessionId || !approvedBrowserSessionId || browserSessionId !== approvedBrowserSessionId) {
      await writeAudit(auth, {
        approvalId,
        browserSessionId: browserSessionId || null,
        actionType,
        toolName,
        status: 'blocked',
        message: 'Browser action blocked because the session id did not match the approval record',
        input: { browserSessionId, approvedBrowserSessionId },
        blockReason: browserSessionId ? 'session_hijack_attempt' : 'no_approval_record'
      });
      return NextResponse.json(
        { error: 'Browser session approval mismatch', executed: false, blockReason: 'session_hijack_attempt' },
        { status: 403 }
      );
    }
  }

  try {
    if (actionType === 'browser_open') {
      const openPayload = {
        ...payload,
        browser_session_id: approvedBrowserSessionId || payload.browser_session_id
      };
      const urlDecision = getUrlAllowlistDecision(openPayload);
      const untrustedUrlConfirmed = Boolean(
        (approval?.requires_user_confirmation || approval?.payload?.requires_user_confirmation) &&
          (approval?.user_confirmation_state || approval?.payload?.user_confirmation_state) === 'confirmed'
      );
      if (!urlDecision.ok && !untrustedUrlConfirmed) {
        await writeAudit(auth, {
          approvalId,
          browserSessionId: approvedBrowserSessionId || null,
          actionType,
          toolName,
          status: 'blocked',
          message: 'Browser open blocked because the URL is not allowlisted',
          input: { url: urlDecision.rawUrl, hostname: urlDecision.hostname },
          blockReason: urlDecision.reason || 'suspicious_url'
        });
        return NextResponse.json(
          {
            error: 'This domain is not on your trusted list. Request an approval with extra confirmation before navigating there.',
            executed: false,
            requiresUserConfirmation: true,
            blockReason: urlDecision.reason || 'suspicious_url'
          },
          { status: 403 }
        );
      }

      const opened = await createBrowserSession(auth, approvalId, openPayload);
      if ('error' in opened && opened.error) return opened.error instanceof Response ? opened.error : NextResponse.json({ error: opened.error.message }, { status: 500 });
      if (!('session' in opened)) return NextResponse.json({ error: 'Browser session could not be opened', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        browserSessionId: opened.session.id,
        actionType,
        toolName,
        status: 'completed',
        message: 'Stagehand Browserbase session opened',
        input: { url: opened.session.targetUrl },
        result: { session: opened.session, performedExternalBrowserAction: true }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, browserSession: opened.session, performedExternalBrowserAction: true });
    }

    if (!browserSessionId) {
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'blocked',
        message: 'Browser action blocked because browser_session_id was missing',
        input: { actionType }
      });
      return NextResponse.json({ error: 'browser_session_id is required', executed: false }, { status: 400 });
    }

    const recorded = await recordBrowserAction(auth, browserSessionId, actionType, payload);
    if ('error' in recorded && recorded.error) return recorded.error instanceof Response ? recorded.error : NextResponse.json({ error: recorded.error.message }, { status: 500 });
    if ('blocked' in recorded && recorded.blocked) {
      await writeAudit(auth, {
        approvalId,
        browserSessionId,
        actionType,
        toolName,
        status: 'blocked',
        message: recorded.blocked
      });
      return NextResponse.json({ error: recorded.blocked, executed: false }, { status: 404 });
    }
    if (!('session' in recorded) || !('action' in recorded)) return NextResponse.json({ error: 'Browser action could not be recorded', executed: false }, { status: 500 });

    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType,
      toolName,
      status: 'completed',
      message: 'Browser action executed in isolated Stagehand session',
      input: normalizePayload(body.payload),
      result: recorded.action,
      screenshotUrl: typeof recorded.action.screenshotUrl === 'string' ? recorded.action.screenshotUrl : null
    });
    await completeApproval(auth, approvalId, true);
    return NextResponse.json({ executed: true, browserSession: recorded.session, action: recorded.action });
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    await writeAudit(auth, {
      approvalId,
      browserSessionId: browserSessionId || null,
      actionType,
      toolName,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Browser action failed'
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Browser action failed', executed: false }, { status: 400 });
  }
}

async function handleJobAction(
  auth: ApiUserContext,
  actionType: string,
  toolName: string,
  body: Record<string, any>
) {
  if (!isJobAction(actionType)) {
    return null;
  }

  const capability = getActionCapability(actionType);
  const control = getActionCapability('browser_control');
  if (!capability || capability.status !== 'active' || !control || control.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Job workflow blocked because the capability or browser_control container is locked',
      input: { actionType },
      result: {
        capabilityStatus: capability?.status || 'missing',
        browserControlStatus: control?.status || 'missing',
        requirements: capability?.requirements || []
      }
    });
    return NextResponse.json(
      {
        error: 'Job workflow is locked until browser_control and this job capability are active',
        executed: false,
        capability,
        browserControl: control
      },
      { status: 501 }
    );
  }

  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, actionType);
  if (approvalCheck.error) return approvalCheck.error;

  const payload = normalizePayload(body.payload);
  try {
    if (actionType === 'job_search_save') {
      const saved = await saveJobSearch(auth, approvalId, payload);
      if ('error' in saved && saved.error) return saved.error instanceof Response ? saved.error : NextResponse.json({ error: saved.error.message }, { status: 500 });
      if ('blocked' in saved && saved.blocked) {
        await writeAudit(auth, {
          approvalId,
          browserSessionId: null,
          actionType,
          toolName,
          status: 'blocked',
          message: saved.blocked,
          input: payload
        });
        return NextResponse.json({ error: saved.blocked, executed: false }, { status: saved.status || 400 });
      }
      if (!('listings' in saved)) return NextResponse.json({ error: 'Job listings could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        browserSessionId: saved.browserSessionId,
        actionType,
        toolName,
        status: 'completed',
        message: `Saved ${saved.listings.length} job listing${saved.listings.length === 1 ? '' : 's'} from approved extraction`,
        input: { sourcePlatform: payload.sourcePlatform || payload.source_platform || payload.platform, listingCount: Array.isArray(payload.listings) ? payload.listings.length : 0 },
        result: { listings: saved.listings, performedExternalAction: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, listings: saved.listings, performedExternalAction: false });
    }

    if (actionType === 'job_application_prepare') {
      const prepared = await prepareJobApplication(auth, approvalId, payload);
      if ('error' in prepared && prepared.error) return prepared.error instanceof Response ? prepared.error : NextResponse.json({ error: prepared.error.message }, { status: 500 });
      if ('blocked' in prepared && prepared.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: prepared.blocked,
          input: payload
        });
        return NextResponse.json({ error: prepared.blocked, executed: false }, { status: prepared.status || 400 });
      }
      if (!('review' in prepared)) return NextResponse.json({ error: 'Job application review could not be prepared', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        browserSessionId: prepared.review.browserSessionId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Prepared job application review card',
        input: { jobListingId: payload.jobListingId || payload.job_listing_id },
        result: { review: prepared.review, reviewCard: prepared.reviewCard, performedExternalAction: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, review: prepared.review, reviewCard: prepared.reviewCard, performedExternalAction: false });
    }

    if (actionType === 'job_application_submit_approved') {
      const approved = await approvePreparedJobApplication(auth, approvalId, payload);
      if ('error' in approved && approved.error) return approved.error instanceof Response ? approved.error : NextResponse.json({ error: approved.error.message }, { status: 500 });
      if ('blocked' in approved && approved.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: approved.blocked,
          input: payload
        });
        return NextResponse.json({ error: approved.blocked, executed: false }, { status: approved.status || 400 });
      }
      if (!('review' in approved)) return NextResponse.json({ error: 'Prepared job application could not be approved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        browserSessionId: approved.review.browserSessionId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Approved prepared job application package; no external auto-submit was performed',
        input: { reviewId: payload.reviewId || payload.review_id },
        result: { review: approved.review, performedExternalSubmission: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, review: approved.review, performedExternalSubmission: false });
    }

    return null;
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Job workflow failed',
      input: payload
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Job workflow failed', executed: false }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const actionType = normalizeActionType(body.actionType ?? body.action_type);
  if (!actionType) {
    return NextResponse.json({ error: 'Valid actionType is required' }, { status: 400 });
  }

  const capability = getActionCapability(actionType);
  const toolName = normalizeToolName(body.toolName ?? body.tool_name, actionType);
  const payload = normalizePayload(body.payload);
  const hardStopReason = getHardStopReason(actionType, payload);
  if (hardStopReason) {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: `Action blocked by hard stop: ${hardStopReason}`,
      input: { actionType, payload },
      blockReason: hardStopReason
    });
    return NextResponse.json(
      { error: 'This action is blocked by non-overridable safety guardrails', executed: false, blockReason: hardStopReason },
      { status: 403 }
    );
  }

  const socialConnectorStatusResponse = await handleSocialConnectorStatusAction(auth, actionType, toolName);
  if (socialConnectorStatusResponse) return socialConnectorStatusResponse;

  const connectorStatusResponse = await handleConnectorStatusAction(auth, actionType, toolName);
  if (connectorStatusResponse) return connectorStatusResponse;

  const browserResponse = await handleBrowserAction(auth, actionType, toolName, body);
  if (browserResponse) return browserResponse;

  const jobResponse = await handleJobAction(auth, actionType, toolName, body);
  if (jobResponse) return jobResponse;

  const jobProfileResponse = await handleJobProfileAction(auth, actionType, toolName, body);
  if (jobProfileResponse) return jobProfileResponse;

  const podResponse = await handlePodAction(auth, actionType, toolName, body);
  if (podResponse) return podResponse;

  const commerceResponse = await handleShopifyPodOperationAction(auth, actionType, toolName, body);
  if (commerceResponse) return commerceResponse;

  const socialResponse = await handleSocialAction(auth, actionType, toolName, body);
  if (socialResponse) return socialResponse;

  if (!capability) {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Unknown V2 action was blocked',
      input: { actionType }
    });
    return NextResponse.json({ error: 'Unknown V2 action', executed: false }, { status: 400 });
  }

  if (capability.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'V2 action blocked because capability is not end-to-end enabled',
      input: { actionType, payloadPreview: body.payload || {} },
      result: {
        capabilityStatus: capability.status,
        requirements: capability.requirements
      }
    });
    return NextResponse.json(
      {
        error: 'This V2 capability is not end-to-end enabled yet',
        executed: false,
        capability
      },
      { status: 501 }
    );
  }

  await writeAudit(auth, {
    actionType,
    toolName,
    status: 'blocked',
    message: 'Use the dedicated active endpoint for this V2 action',
    input: { actionType },
    result: { endpoint: capability.endpoint }
  });

  return NextResponse.json(
    {
      error: 'Use the dedicated endpoint for this active action',
      executed: false,
      endpoint: capability.endpoint,
      capability
    },
    { status: 409 }
  );
}
