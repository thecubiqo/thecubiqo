import { NextRequest, NextResponse } from 'next/server';
import { publishProduct as publishPrintifyProduct } from '../../../_lib/printify-client';
import { updateProduct as updateShopifyProduct } from '../../../_lib/shopify-client';
import { type ApiUserContext, requireApiUser, safeTableMissing, missingMigrationResponse } from '../../../_lib/supabase-admin';
import { completeApproval, normalizePayload, requireApprovedAction, writeAudit } from '../../../_lib/v2-actions';

export const runtime = 'nodejs';

function normalizeText(value: unknown, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

async function loadPodProduct(auth: ApiUserContext, productId: string) {
  const { data, error } = await auth.supabase
    .from('pod_products')
    .select('*')
    .eq('id', productId)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('pod-product', 'pod_products') };
    return { error };
  }
  if (!data) return { blocked: 'POD product not found', status: 404 as const };
  return { product: data };
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const approvalId = normalizeText(body.approvalId ?? body.approval_id, 80);
  const approvalCheck = await requireApprovedAction(auth, approvalId, 'pod_product_publish');
  if (approvalCheck.error) return approvalCheck.error;

  const approvalPayload = normalizePayload(approvalCheck.approval?.payload);
  const payload = { ...approvalPayload, ...normalizePayload(body.payload), ...body };
  const productId = normalizeText(payload.product_id ?? payload.productId, 80);
  if (!productId) return NextResponse.json({ error: 'product_id is required' }, { status: 400 });

  const loaded = await loadPodProduct(auth, productId);
  if ('error' in loaded && loaded.error) {
    return loaded.error instanceof Response ? loaded.error : NextResponse.json({ error: loaded.error.message }, { status: 500 });
  }
  if (!('product' in loaded)) return NextResponse.json({ error: loaded.blocked }, { status: loaded.status || 404 });

  const product = loaded.product;
  if (!['ready', 'draft'].includes(product.status)) {
    return NextResponse.json({ error: `Product is ${product.status}, not ready to publish` }, { status: 409 });
  }
  if (!product.printify_product_id || !product.shopify_product_id) {
    return NextResponse.json({ error: 'Both Printify and Shopify product ids are required before publish' }, { status: 409 });
  }

  try {
    const printify = await publishPrintifyProduct(auth, product.printify_product_id);
    if ('error' in printify && printify.error) throw printify.error;
    if ('blocked' in printify && printify.blocked) {
      return NextResponse.json({ error: printify.blocked }, { status: printify.status || 409 });
    }

    const shopify = await updateShopifyProduct(auth, product.shop_domain, product.shopify_product_id, { status: 'active' });
    if ('error' in shopify && shopify.error) throw shopify.error;
    if ('blocked' in shopify && shopify.blocked) {
      return NextResponse.json({ error: shopify.blocked }, { status: shopify.status || 409 });
    }

    const now = new Date().toISOString();
    const { data, error } = await auth.supabase
      .from('pod_products')
      .update({
        status: 'published',
        publish_approval_id: approvalId,
        published_at: now,
        product_payload: {
          ...(product.product_payload || {}),
          publish: {
            printifyProductId: product.printify_product_id,
            shopifyProductId: product.shopify_product_id,
            publishedAt: now
          }
        }
      })
      .eq('id', product.id)
      .eq('user_id', auth.user.id)
      .select('*')
      .single();
    if (error) throw error;

    await writeAudit(auth, {
      approvalId,
      actionType: 'pod_product_user_confirmed_publish',
      toolName: 'pod_product_publish',
      status: 'completed',
      message: 'User confirmed POD product publish',
      input: { productId: product.id },
      result: {
        shopifyProductId: product.shopify_product_id,
        printifyProductId: product.printify_product_id
      }
    });
    await completeApproval(auth, approvalId, true);

    return NextResponse.json({ executed: true, status: 'published', product: data });
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    const message = error instanceof Error ? error.message : 'POD product publish failed';
    await auth.supabase.from('pod_products').update({ status: 'failed', error: message }).eq('id', product.id).eq('user_id', auth.user.id);
    await writeAudit(auth, {
      approvalId,
      actionType: 'pod_product_publish',
      toolName: 'pod_product_publish',
      status: 'failed',
      message,
      input: { productId: product.id }
    });
    return NextResponse.json({ error: message, executed: false }, { status: 500 });
  }
}
