import { cleanEnv } from './supabase-admin';

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
};

export type WebSearchResponse = {
  query: string;
  results: SearchResult[];
  provider: string;
  error?: string;
};

async function searchViaTavily(query: string, max: number): Promise<WebSearchResponse> {
  const apiKey = cleanEnv(process.env.TAVILY_API_KEY);
  if (!apiKey) throw new Error('TAVILY_API_KEY not configured');

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query, max_results: max, search_depth: 'basic' })
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const json = await res.json();

  return {
    query,
    provider: 'tavily',
    results: (json.results || []).slice(0, max).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.content || '',
      publishedAt: r.published_date
    }))
  };
}

async function searchViaBrave(query: string, max: number): Promise<WebSearchResponse> {
  const apiKey = cleanEnv(process.env.BRAVE_SEARCH_API_KEY);
  if (!apiKey) throw new Error('BRAVE_SEARCH_API_KEY not configured');

  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${max}`, {
    headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey }
  });
  if (!res.ok) throw new Error(`Brave ${res.status}`);
  const json = await res.json();

  return {
    query,
    provider: 'brave',
    results: (json.web?.results || []).slice(0, max).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.description || '',
      publishedAt: r.page_age
    }))
  };
}

async function searchViaSerper(query: string, max: number): Promise<WebSearchResponse> {
  const apiKey = cleanEnv(process.env.SERPER_API_KEY);
  if (!apiKey) throw new Error('SERPER_API_KEY not configured');

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num: max })
  });
  if (!res.ok) throw new Error(`Serper ${res.status}`);
  const json = await res.json();

  return {
    query,
    provider: 'serper',
    results: (json.organic || []).slice(0, max).map((r: any) => ({
      title: r.title || '',
      url: r.link || '',
      snippet: r.snippet || '',
      publishedAt: r.date
    }))
  };
}

export async function webSearch(query: string, maxResults = 5): Promise<WebSearchResponse> {
  const errors: string[] = [];
  for (const provider of [searchViaTavily, searchViaBrave, searchViaSerper]) {
    try {
      return await provider(query, maxResults);
    } catch (err: any) {
      errors.push(err.message);
    }
  }
  return { query, provider: 'none', results: [], error: `All providers failed: ${errors.join('; ')}` };
}

export function searchConfigured(): boolean {
  return !!(
    cleanEnv(process.env.TAVILY_API_KEY) ||
    cleanEnv(process.env.BRAVE_SEARCH_API_KEY) ||
    cleanEnv(process.env.SERPER_API_KEY)
  );
}
