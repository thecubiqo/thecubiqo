import { NextRequest, NextResponse } from 'next/server';
import { createProduct as createPrintifyProduct } from '../../_lib/printify-client';
import { createProduct as createShopifyProduct } from '../../_lib/shopify-client';
import { type ApiUserContext, requireApiUser, safeTableMissing, missingMigrationResponse } from '../../_lib/supabase-admin';
import { completeApproval, normalizePayload, requireApprovedAction, writeAudit } from '../../_lib/v2-actions';
import { getCommercePlatformDefaults } from '../../_lib/platform-settings';

export const runtime = 'nodejs';

function normalizeText(value: unknown, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeStringArray(value: unknown, max = 20) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\n,]+/) : [];
  return items.map(item => normalizeText(item, 1600)).filter(Boolean).slice(0, max);
}

function normalizeObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function loadStoreDefaults(auth: ApiUserContext, shopDomain?: string) {
  let query = auth.supabase
    .from('store_connections')
    .select('shop_domain,metadata,default_product_tags,default_product_price,default_product_title')
    .eq('user_id', auth.user.id)
    .eq('platform', 'shopify')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (shopDomain) query = query.eq('shop_domain', shopDomain);
  const { data } = await query.maybeSingle();
  return {
    ...normalizeObject(data?.metadata),
    default_product_tags: data?.default_product_tags,
    default_product_price: data?.default_product_price,
    default_product_title: data?.default_product_title
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const approvalId = normalizeText(body.approvalId ?? body.approval_id, 80);
  const approvalCheck = await requireApprovedAction(auth, approvalId, 'pod_product_create');
  if (approvalCheck.error) return approvalCheck.error;

  const approvalPayload = normalizePayload(approvalCheck.approval?.payload);
  const requestPayload = normalizePayload(body.payload);
  const payload = { ...approvalPayload, ...requestPayload, ...body };

  const platformDefaults = await getCommercePlatformDefaults(auth);
  const shopDomain = normalizeText(payload.shop_domain ?? payload.shopDomain, 240) || undefined;
  const storeDefaults = await loadStoreDefaults(auth, shopDomain);
  const title = normalizeText(payload.title, 180)
    || normalizeText(storeDefaults.default_product_title, 180)
    || platformDefaults.productTitle;
  const description = normalizeText(payload.description, 5000);
  const printProviderId = normalizeText(payload.print_provider_id ?? payload.printProviderId, 80);
  const blueprintId = normalizeText(payload.blueprint_id ?? payload.blueprintId, 80);
  const mediaAssets = normalizeStringArray(payload.media_assets ?? payload.mediaAssets);
  const previewCard = normalizeObject(payload.previewCard ?? payload.preview_card);
  const variants = Array.isArray(payload.variants) ? payload.variants : [];
  const printAreas = normalizeObject(payload.print_areas ?? payload.printAreas);
  const defaultTags = normalizeStringArray(storeDefaults.default_product_tags, 20);
  const explicitTags = normalizeStringArray(payload.tags, 20);
  const productTags = explicitTags.length ? explicitTags : defaultTags.length ? defaultTags : platformDefaults.productTags;
  const defaultPrice = normalizeText(payload.price ?? storeDefaults.default_product_price ?? platformDefaults.productPrice, 40);
  const defaultVariant = defaultPrice ? [{ title: 'Default', price: defaultPrice }] : [];

  if (!title || !description || !printProviderId || !blueprintId || !mediaAssets.length) {
    await writeAudit(auth, {
      approvalId,
      actionType: 'pod_product_create',
      toolName: 'pod_product_create',
      status: 'blocked',
      message: 'POD product creation blocked because required fields were missing',
      input: { title: Boolean(title), description: Boolean(description), printProviderId, blueprintId, mediaAssetCount: mediaAssets.length },
      blockReason: 'missing_pod_product_fields'
    });
    return NextResponse.json({ error: 'title, description, print_provider_id, blueprint_id, and media assets are required' }, { status: 400 });
  }

  if (!Object.keys(previewCard).length) {
    return NextResponse.json({ error: 'Approval preview card is required before POD product creation' }, { status: 400 });
  }

  const printifyPayload = {
    title,
    description,
    blueprint_id: Number(blueprintId) || blueprintId,
    print_provider_id: Number(printProviderId) || printProviderId,
    variants,
    print_areas: printAreas,
    images: mediaAssets.map(src => ({ src }))
  };

  try {
    const printify = await createPrintifyProduct(auth, printifyPayload);
    if ('error' in printify && printify.error) throw printify.error;
    if ('blocked' in printify && printify.blocked) {
      await writeAudit(auth, {
        approvalId,
        actionType: 'pod_product_create',
        toolName: 'pod_product_create',
        status: 'blocked',
        message: printify.blocked,
        input: { title, printProviderId, blueprintId },
        blockReason: 'printify_not_connected'
      });
      return NextResponse.json({ error: printify.blocked, executed: false }, { status: printify.status || 409 });
    }

    const printifyBody = (printify as any).body || {};
    const printifyProductId = String(printifyBody.id || printifyBody.product?.id || '');
    const shopifyPayload = {
      title,
      body_html: description,
      status: 'draft',
      tags: productTags,
      images: mediaAssets.map(src => ({ src })),
      variants: variants.length ? variants : defaultVariant
    };
    const shopify = await createShopifyProduct(auth, shopDomain, shopifyPayload);
    if ('error' in shopify && shopify.error) throw shopify.error;
    if ('blocked' in shopify && shopify.blocked) {
      await writeAudit(auth, {
        approvalId,
        actionType: 'pod_product_create',
        toolName: 'pod_product_create',
        status: 'blocked',
        message: shopify.blocked,
        input: { title, shopDomain },
        blockReason: 'shopify_not_connected',
        result: { printifyProductId }
      });
      return NextResponse.json({ error: shopify.blocked, executed: false, printifyProductId }, { status: shopify.status || 409 });
    }

    const shopifyBody = (shopify as any).body || {};
    const shopifyProductId = String(shopifyBody.product?.id || '');
    const { data, error } = await auth.supabase
      .from('pod_products')
      .insert({
        user_id: auth.user.id,
        approval_id: approvalId,
        shopify_product_id: shopifyProductId || null,
        printify_product_id: printifyProductId || null,
        title,
        description,
        print_provider_id: printProviderId,
        blueprint_id: blueprintId,
        media_assets: mediaAssets,
        shop_domain: (shopify as any).shopDomain || shopDomain || null,
        status: 'ready',
        product_payload: {
          printify: { productId: printifyProductId, request: printifyPayload },
          shopify: { productId: shopifyProductId, request: shopifyPayload }
        },
        preview_payload: previewCard
      })
      .select('*')
      .single();

    if (error) {
      if (safeTableMissing(error)) return missingMigrationResponse('pod-product', 'pod_products');
      throw error;
    }

    await writeAudit(auth, {
      approvalId,
      actionType: 'pod_product_created',
      toolName: 'pod_product_create',
      status: 'completed',
      message: 'POD product created as draft/ready and stopped before publish',
      input: { title, printProviderId, blueprintId },
      result: {
        podProductId: data.id,
        shopifyProductId,
        printifyProductId,
        publishRequiresSeparateApproval: true
      }
    });
    await completeApproval(auth, approvalId, true);

    return NextResponse.json({
      executed: true,
      status: 'ready',
      product: {
        id: data.id,
        title: data.title,
        status: data.status,
        shopifyProductId,
        printifyProductId,
        shopifyAdminUrl: (shopify as any).shopDomain && shopifyProductId ? `https://${(shopify as any).shopDomain}/admin/products/${shopifyProductId}` : null,
        printifyDashboardUrl: printifyProductId ? `https://printify.com/app/products/${printifyProductId}` : null
      }
    });
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    const message = error instanceof Error ? error.message : 'POD product creation failed';
    await writeAudit(auth, {
      approvalId,
      actionType: 'pod_product_create',
      toolName: 'pod_product_create',
      status: 'failed',
      message,
      input: { title, printProviderId, blueprintId }
    });
    return NextResponse.json({ error: message, executed: false }, { status: 500 });
  }
}
