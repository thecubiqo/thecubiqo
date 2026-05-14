import type { SupabaseClient } from "@supabase/supabase-js";

import type { RecommendationCard } from "@/next/types/cubiqo";
import { searchAmazonProduct } from "./amazon-pa";
import { enrichUrlWithSkimlinks } from "./skimlinks";

export interface PostProcessResult {
  enrichedText: string;
  cards: RecommendationCard[];
}

type AffiliateLink = {
  id: string;
  platform: string;
  display_name: string;
  affiliate_url: string;
  trigger_keywords: string[];
  trigger_domains?: string[] | null;
  commission_type?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
  promo_code?: string | null;
  priority?: number | null;
  active: boolean;
};

const LOW_INTENT_PHRASES = [
  "not ready",
  "do not buy",
  "don't buy",
  "free alternative",
  "avoid",
  "already have",
];

const PHYSICAL_PRODUCT_PATTERN =
  /\b(headphones?|earbuds?|laptop|notebook|keyboard|mouse|webcam|camera|phone|smartphone|monitor|display|screen|desk|chair|charger|cable|microphone|mic|speaker|tv|television|tablet|smartwatch|watch|printer|scanner|router|hard\s?drive|ssd|gpu|graphics\s?card|ram|memory\s?stick|tripod|lens|drone|action\s?camera|ring\s?light)\b/i;

function extractProductMention(text: string): string | null {
  const match = PHYSICAL_PRODUCT_PATTERN.exec(text);
  if (!match) return null;
  const start = Math.max(0, match.index - 30);
  const snippet = text.slice(start, match.index + match[0].length + 40);
  return snippet.replace(/[^a-zA-Z0-9\s-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function passesQualityGate(params: {
  intentScore: number;
  isRedOrSafety: boolean;
  userAlreadyHas: boolean;
  betterFreeOptionExists: boolean;
  hasDisclosure: boolean;
}): boolean {
  if (params.isRedOrSafety) return false;
  if (params.userAlreadyHas) return false;
  if (params.betterFreeOptionExists) return false;
  if (!params.hasDisclosure) return false;
  if (params.intentScore < 0.6) return false;
  return true;
}

let tier1Cache: { data: AffiliateLink[]; expires: number } | null = null;

export async function postProcessResponse(
  responseText: string,
  userId: string | null,
  sessionId: string | null,
  signalId: string | null,
  supabase: SupabaseClient,
): Promise<PostProcessResult> {
  const tier1 = await getCachedTier1Links(supabase);
  const cards: RecommendationCard[] = [];
  let enrichedText = responseText;

  const lower = responseText.toLowerCase();
  const blockedByQuality = LOW_INTENT_PHRASES.some((phrase) => lower.includes(phrase));
  const isRedOrSafety = /\b(crisis|self-harm|suicide|unsafe|illegal|medical emergency)\b/i.test(responseText);
  const betterFreeOptionExists = blockedByQuality || /\b(free alternative|use the free|free option)\b/i.test(responseText);

  for (const link of tier1) {
    if (!link.active) continue;
    const matchedKeyword = (link.trigger_keywords || []).find((kw) =>
      new RegExp(`\\b${escapeRegex(kw)}\\b`, "i").test(responseText),
    );
    if (!matchedKeyword) continue;

    const quality = scoreRecommendation(responseText, matchedKeyword);
    const userAlreadyHas = await hasUserDismissedEntity(supabase, userId, link.display_name);
    const passesGate = passesQualityGate({
      intentScore: quality.intent_strength,
      isRedOrSafety,
      userAlreadyHas,
      betterFreeOptionExists,
      hasDisclosure: true,
    });
    if (!passesGate) {
      await writeRecommendationEvent(supabase, {
        userId,
        sessionId,
        signalId,
        recommendationEntity: link.display_name,
        affiliateTier: 1,
        affiliateLinkId: link.id,
        trackedUrl: null,
        merchantUrl: link.affiliate_url,
        type: link.commission_type === "cpa" ? "tool" : "service",
        rejectedReason: userAlreadyHas ? "user_has_this" : "quality_gate",
        ...quality,
      });
      continue;
    }

    const eventId = await writeRecommendationEvent(supabase, {
      userId,
      sessionId,
      signalId,
      recommendationEntity: link.display_name,
      affiliateTier: 1,
      affiliateLinkId: link.id,
      trackedUrl: null,
      merchantUrl: link.affiliate_url,
      type: link.commission_type === "cpa" ? "tool" : "service",
      reasonForRecommendation: `Matched "${matchedKeyword}" in a relevant recommendation.`,
      ...quality,
    });

    if (eventId === "unknown") continue;
    const trackedUrl = buildTrackedUrl(eventId);
    cards.push({
      id: eventId,
      entityName: link.display_name,
      trackedUrl,
      tier: 1,
      logoUrl: link.logo_url || undefined,
      tagline: link.tagline || undefined,
      promoCode: link.promo_code || undefined,
      type: "tool",
      disclosure: "CubiQo may earn a commission. Your price does not change.",
    });
  }

  const urls = responseText.match(/https?:\/\/[^\s)>]+/g) ?? [];
  await Promise.allSettled(urls.slice(0, 3).map(async (url) => {
    const affiliateUrl = await enrichUrlWithSkimlinks(url);
    if (!affiliateUrl) return;
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const quality = scoreRecommendation(responseText, hostname);
    const userAlreadyHas = await hasUserDismissedEntity(supabase, userId, hostname);
    if (!passesQualityGate({
      intentScore: quality.intent_strength,
      isRedOrSafety,
      userAlreadyHas,
      betterFreeOptionExists,
      hasDisclosure: true,
    })) return;

    const eventId = await writeRecommendationEvent(supabase, {
      userId,
      sessionId,
      signalId,
      recommendationEntity: hostname,
      affiliateTier: 2,
      trackedUrl: null,
      merchantUrl: affiliateUrl,
      type: "tool",
      reasonForRecommendation: "Matched a merchant URL and Skimlinks returned an affiliate URL.",
      ...quality,
    });
    if (eventId === "unknown") return;
    cards.push({
      id: eventId,
      entityName: hostname,
      trackedUrl: buildTrackedUrl(eventId),
      tier: 2,
      type: "tool",
      disclosure: "CubiQo may earn a commission. Your price does not change.",
    });
  }));

  if (cards.length < 3 && !isRedOrSafety && !betterFreeOptionExists && PHYSICAL_PRODUCT_PATTERN.test(responseText)) {
    const productQuery = extractProductMention(responseText);
    if (productQuery) {
      const product = await getCachedOrSearchAmazonProduct(supabase, productQuery);
      if (product) {
        const userAlreadyHas = await hasUserDismissedEntity(supabase, userId, product.title);
        if (!userAlreadyHas) {
          const eventId = await writeRecommendationEvent(supabase, {
            userId,
            sessionId,
            signalId,
            recommendationEntity: product.title.slice(0, 120),
            affiliateTier: 3,
            trackedUrl: null,
            merchantUrl: product.affiliateUrl,
            type: "product",
            intent_strength: 0.72,
            quality_score: 0.8,
            reasonForRecommendation: `Physical product mention matched: "${productQuery}".`,
          });

          if (eventId !== "unknown") {
            cards.push({
              id: eventId,
              entityName: product.title.slice(0, 80),
              trackedUrl: buildTrackedUrl(eventId),
              tier: 3,
              type: "product",
              imageUrl: product.imageUrl || undefined,
              price: product.price || undefined,
              rating: product.rating || undefined,
              reviewCount: product.reviewCount || undefined,
              isPrime: product.isPrime,
              disclosure: "CubiQo may earn a small commission from Amazon. Your price is unchanged.",
            });
          }
        }
      }
    }
  }

  return { enrichedText, cards: cards.slice(0, 3) };
}

async function getCachedOrSearchAmazonProduct(supabase: SupabaseClient, query: string) {
  const { data: cached } = await supabase
    .from("amazon_product_cache")
    .select("*")
    .textSearch("title", query.split(/\s+/).slice(0, 4).join(" "), { type: "websearch" })
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (cached) {
    return {
      asin: cached.asin as string,
      title: cached.title as string,
      price: cached.price_amount != null
        ? { amount: Number(cached.price_amount), currency: String(cached.price_currency || "GBP") }
        : null,
      imageUrl: (cached.image_url as string) || null,
      rating: cached.rating == null ? null : Number(cached.rating),
      reviewCount: cached.review_count == null ? null : Number(cached.review_count),
      isPrime: Boolean(cached.is_prime),
      affiliateUrl: cached.affiliate_url as string,
    };
  }

  const product = await searchAmazonProduct(query).catch(() => null);
  if (product) {
    void Promise.resolve(
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
        }),
    ).catch(() => null);
  }

  return product;
}

async function getCachedTier1Links(supabase: SupabaseClient): Promise<AffiliateLink[]> {
  if (tier1Cache && Date.now() < tier1Cache.expires) return tier1Cache.data;

  const { data } = await supabase
    .from("affiliate_links")
    .select("*")
    .eq("active", true)
    .eq("tier", 1)
    .order("priority", { ascending: false });

  tier1Cache = {
    data: (data || []) as AffiliateLink[],
    expires: Date.now() + 10 * 60 * 1000,
  };
  return tier1Cache.data;
}

async function hasUserDismissedEntity(supabase: SupabaseClient, userId: string | null, entity: string) {
  if (!userId) return false;
  const { data } = await supabase
    .from("recommendation_events")
    .select("id")
    .eq("user_id", userId)
    .eq("user_has_this", true)
    .ilike("recommended_entity", entity)
    .limit(1);
  return Boolean(data?.length);
}

async function writeRecommendationEvent(supabase: SupabaseClient, params: {
  userId: string | null;
  sessionId: string | null;
  signalId: string | null;
  recommendationEntity: string;
  affiliateTier: number;
  affiliateLinkId?: string;
  trackedUrl: string | null;
  merchantUrl?: string | null;
  type: string;
  quality_score?: number;
  intent_strength?: number;
  reasonForRecommendation?: string;
  rejectedReason?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("recommendation_events")
    .insert({
      user_id: params.userId,
      session_id: params.sessionId,
      signal_id: params.signalId,
      recommendation_type: params.type,
      recommended_entity: params.recommendationEntity,
      recommendation_context: null,
      affiliate_tier: params.affiliateTier,
      affiliate_link_id: params.affiliateLinkId ?? null,
      tracked_url: params.trackedUrl,
      merchant_url: params.merchantUrl ?? params.trackedUrl,
      quality_score: params.quality_score ?? null,
      intent_strength: params.intent_strength ?? null,
      reason_for_recommendation: params.reasonForRecommendation ?? null,
      rejected_reason: params.rejectedReason ?? null,
    })
    .select("id")
    .single();

  if (error || !data?.id) return "unknown";
  return data.id;
}

function scoreRecommendation(responseText: string, matched: string) {
  const text = responseText.toLowerCase();
  const actionWords = ["use", "try", "start", "launch", "set up", "best", "recommend", "faster", "compare"];
  const intent_strength = Math.min(0.95, 0.65 + actionWords.filter((word) => text.includes(word)).length * 0.08);
  const quality_score = text.includes(matched.toLowerCase()) ? 0.86 : 0.7;
  return { intent_strength, quality_score };
}

function buildTrackedUrl(eventId: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base}/api/affiliate/${eventId}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
