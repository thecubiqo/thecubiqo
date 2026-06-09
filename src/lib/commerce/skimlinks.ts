const SKIMLINKS_API = "https://api.skimlinks.com";

export async function enrichUrlWithSkimlinks(url: string): Promise<string | null> {
  const publisherId = process.env.SKIMLINKS_PUBLISHER_ID;
  if (!publisherId) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${SKIMLINKS_API}/links/v1/single`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${publisherId}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.affiliateUrl || data?.affiliate_url || null;
  } catch {
    return null;
  }
}
