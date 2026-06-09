import { assertSafeUrl } from './ssrf-guard';

export type ScrapeResult = {
  url: string;
  title: string;
  bodyText: string;
  wordCount: number;
  fetchedAt: string;
  error?: string;
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]).slice(0, 200) : '';
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const fetchedAt = new Date().toISOString();

  // SSRF guard: the URL is caller-supplied (and can be steered by prompt
  // injection). Block internal hosts, private/metadata IPs, and DNS rebinding
  // before issuing any request. allowHttp because legit pages may be plain http.
  const safe = await assertSafeUrl(url, { allowHttp: true });
  if (!safe.ok) {
    return { url, title: '', bodyText: '', wordCount: 0, fetchedAt, error: `blocked: ${safe.reason}` };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    // Follow redirects MANUALLY, re-validating every hop so a public URL cannot
    // 30x-bounce us into an internal/metadata target (redirect-based SSRF).
    let current = safe.url.toString();
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      res = await fetch(current, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' },
        signal: controller.signal,
        redirect: 'manual',
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) break;
        const next = await assertSafeUrl(new URL(location, current).toString(), { allowHttp: true });
        if (!next.ok) {
          clearTimeout(timer);
          return { url, title: '', bodyText: '', wordCount: 0, fetchedAt, error: `blocked redirect: ${next.reason}` };
        }
        current = next.url.toString();
        continue;
      }
      break;
    }
    clearTimeout(timer);

    if (!res || !res.ok) {
      return { url, title: '', bodyText: '', wordCount: 0, fetchedAt, error: `HTTP ${res?.status ?? 'no_response'}` };
    }

    const html = await res.text();
    const title = extractTitle(html);
    const bodyText = stripHtml(html).slice(0, 8_000);
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    return { url, title, bodyText, wordCount, fetchedAt };
  } catch (err: any) {
    clearTimeout(timer);
    return { url, title: '', bodyText: '', wordCount: 0, fetchedAt, error: err.message || 'Fetch failed' };
  }
}

export async function scrapeMultiple(urls: string[], concurrency = 3): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = new Array(urls.length);
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      const i = index++;
      results[i] = await scrapeUrl(urls[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, worker);
  await Promise.all(workers);
  return results;
}
