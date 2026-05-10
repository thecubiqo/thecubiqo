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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const fetchedAt = new Date().toISOString();

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { url, title: '', bodyText: '', wordCount: 0, fetchedAt, error: `HTTP ${res.status}` };
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
