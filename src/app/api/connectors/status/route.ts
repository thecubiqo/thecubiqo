import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing, missingMigrationResponse } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

function mapConnection(row: Record<string, any>) {
  return {
    id: row.id,
    platform: row.platform,
    shopDomain: row.shop_domain,
    scope: row.scope,
    status: row.status,
    connectedAt: row.connected_at,
    lastUsedAt: row.last_used_at,
    metadata: {
      tokenHint: row.metadata?.token_hint || null,
      shopName: row.metadata?.shop_name || null,
      tokenExposed: false
    }
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const [{ data, error }, productsResult] = await Promise.all([
    auth.supabase
    .from('store_connections')
    .select('id,platform,shop_domain,scope,status,metadata,connected_at,last_used_at')
    .eq('user_id', auth.user.id)
      .order('connected_at', { ascending: false }),
    auth.supabase
      .from('pod_products')
      .select('id,approval_id,publish_approval_id,shopify_product_id,printify_product_id,title,description,print_provider_id,blueprint_id,media_assets,shop_domain,status,product_payload,preview_payload,published_at,error,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('connectors', 'store_connections');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (productsResult.error && !safeTableMissing(productsResult.error)) {
    return NextResponse.json({ error: productsResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    connections: (data || []).map(mapConnection),
    podProducts: productsResult.error ? [] : (productsResult.data || []).map((item: Record<string, any>) => ({
      id: item.id,
      approvalId: item.approval_id,
      publishApprovalId: item.publish_approval_id,
      shopifyProductId: item.shopify_product_id,
      printifyProductId: item.printify_product_id,
      title: item.title,
      description: item.description,
      printProviderId: item.print_provider_id,
      blueprintId: item.blueprint_id,
      mediaAssets: item.media_assets || [],
      shopDomain: item.shop_domain,
      status: item.status,
      productPayload: item.product_payload || {},
      previewPayload: item.preview_payload || {},
      publishedAt: item.published_at,
      error: item.error,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    })),
    tokenExposed: false
  });
}
