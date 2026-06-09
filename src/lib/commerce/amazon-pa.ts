import crypto from "crypto";

export interface AmazonProduct {
  asin: string;
  title: string;
  price: { amount: number; currency: string } | null;
  imageUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  isPrime: boolean;
  affiliateUrl: string;
}

const MARKETPLACE = process.env.AMAZON_MARKETPLACE || "www.amazon.co.uk";
const REGION = MARKETPLACE.includes(".co.uk") ? "eu-west-1" : "us-east-1";
const HOST = `webservices.${MARKETPLACE.replace(/^www\./, "")}`;
const SERVICE = "ProductAdvertisingAPI";
const ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || process.env.AMAZON_PA_PARTNER_TAG || "cubiqo-21";
const PARTNER_TAG = process.env.AMAZON_PA_PARTNER_TAG || ASSOCIATE_TAG;

const RESOURCES = [
  "Images.Primary.Medium",
  "ItemInfo.Title",
  "Offers.Listings.Price",
  "Offers.Listings.DeliveryInfo.IsPrimeEligible",
  "CustomerReviews.Count",
  "CustomerReviews.StarRating",
];

function hasAmazonConfig() {
  return Boolean(process.env.AMAZON_PA_ACCESS_KEY && process.env.AMAZON_PA_SECRET_KEY && PARTNER_TAG);
}

function hmac(key: crypto.BinaryLike | crypto.KeyObject, msg: string): Buffer {
  return crypto.createHmac("sha256", key).update(msg).digest();
}

function signingKey(secret: string, dateStamp: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, "aws4_request");
}

function amzDateParts(now = new Date()) {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

async function paApiRequest(path: "/paapi5/searchitems" | "/paapi5/getitems", target: string, payload: object) {
  const accessKey = process.env.AMAZON_PA_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PA_SECRET_KEY;
  if (!accessKey || !secretKey) return null;

  const body = JSON.stringify(payload);
  const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
  const { amzDate, dateStamp } = amzDateParts();

  const headers: Record<string, string> = {
    "content-encoding": "amz-1.0",
    "content-type": "application/json; charset=utf-8",
    host: HOST,
    "x-amz-date": amzDate,
    "x-amz-target": target,
  };

  const sortedHeaderEntries = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));
  const canonicalHeaders = sortedHeaderEntries.map(([key, value]) => `${key}:${value}`).join("\n") + "\n";
  const signedHeaders = sortedHeaderEntries.map(([key]) => key).join(";");
  const canonicalRequest = ["POST", path, "", canonicalHeaders, signedHeaders, bodyHash].join("\n");

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const signature = crypto.createHmac("sha256", signingKey(secretKey, dateStamp)).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${HOST}${path}`, {
    method: "POST",
    headers: { ...headers, Authorization: authorization },
    body,
    signal: AbortSignal.timeout(4000),
  });

  if (!res.ok) return null;
  return res.json().catch(() => null);
}

function buildAffiliateUrl(asin: string): string {
  return `https://${MARKETPLACE}/dp/${asin}?tag=${ASSOCIATE_TAG}`;
}

function numberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseItem(item: Record<string, any>): AmazonProduct | null {
  const asin = String(item.ASIN || "");
  if (!asin) return null;
  const listing = item.Offers?.Listings?.[0];
  const priceAmount = numberOrNull(listing?.Price?.Amount);
  return {
    asin,
    title: String(item.ItemInfo?.Title?.DisplayValue || asin),
    price: priceAmount == null
      ? null
      : { amount: priceAmount, currency: String(listing?.Price?.Currency || "GBP") },
    imageUrl: item.Images?.Primary?.Medium?.URL || null,
    rating: numberOrNull(item.CustomerReviews?.StarRating?.Value),
    reviewCount: numberOrNull(item.CustomerReviews?.Count?.Value ?? item.CustomerReviews?.Count),
    isPrime: Boolean(listing?.DeliveryInfo?.IsPrimeEligible),
    affiliateUrl: buildAffiliateUrl(asin),
  };
}

export async function searchAmazonProduct(query: string): Promise<AmazonProduct | null> {
  const cleanQuery = query.trim().slice(0, 120);
  if (!cleanQuery || !hasAmazonConfig()) return null;

  try {
    const data = await paApiRequest(
      "/paapi5/searchitems",
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
      {
        Keywords: cleanQuery,
        Resources: RESOURCES,
        SearchIndex: "All",
        ItemCount: 1,
        PartnerTag: PARTNER_TAG,
        PartnerType: "Associates",
        Marketplace: MARKETPLACE,
      },
    );
    const item = data?.SearchResult?.Items?.[0];
    return item ? parseItem(item) : null;
  } catch {
    return null;
  }
}

export async function getAmazonProductByAsin(asin: string): Promise<AmazonProduct | null> {
  const cleanAsin = asin.trim().toUpperCase();
  if (!cleanAsin || !hasAmazonConfig()) return null;

  try {
    const data = await paApiRequest(
      "/paapi5/getitems",
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
      {
        ItemIds: [cleanAsin],
        Resources: RESOURCES,
        PartnerTag: PARTNER_TAG,
        PartnerType: "Associates",
        Marketplace: MARKETPLACE,
      },
    );
    const item = data?.ItemsResult?.Items?.[0];
    return item ? parseItem(item) : null;
  } catch {
    return null;
  }
}
