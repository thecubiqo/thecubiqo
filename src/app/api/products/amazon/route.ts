import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import {
  getAmazonProductByAsin,
  searchAmazonProduct,
  type AmazonProduct,
} from "@/next/lib/commerce/amazon-pa";

export const runtime = "nodejs";

function mapCacheRow(row: Record<string, any>): AmazonProduct {
  return {
    asin: row.asin,
    title: row.title,
    price:
      row.price_amount != null
        ? { amount: Number(row.price_amount), currency: row.price_currency || "GBP" }
        : null,
    imageUrl: row.image_url || null,
    rating: row.rating == null ? null : Number(row.rating),
    reviewCount: row.review_count == null ? null : Number(row.review_count),
    isPrime: Boolean(row.is_prime),
    affiliateUrl: row.affiliate_url,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const asin = searchParams.get("asin");

  if (!query && !asin) {
    return NextResponse.json({ error: "q or asin required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (asin && supabase) {
    const { data: cached } = await supabase
      .from("amazon_product_cache")
      .select("*")
      .eq("asin", asin.trim().toUpperCase())
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (cached) return NextResponse.json(mapCacheRow(cached));
  }

  const product = asin
    ? await getAmazonProductByAsin(asin)
    : await searchAmazonProduct(query || "");

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (supabase) {
    supabase
      .from("amazon_product_cache")
      .upsert({
        asin: product.asin,
        title: product.title,
        price_amount: product.price?.amount ?? null,
        price_currency: product.price?.currency ?? "GBP",
        image_url: product.imageUrl,
        rating: product.rating,
        review_count: product.reviewCount,
        is_prime: product.isPrime,
        affiliate_url: product.affiliateUrl,
        marketplace: process.env.AMAZON_MARKETPLACE || "www.amazon.co.uk",
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      })
      .then(() => null)
      .catch(() => null);
  }

  return NextResponse.json(product);
}
