/**
 * Tavily / webSearch Mock — F7-E
 * Returns fixture search results for unit tests.
 * Activated when TEST_MODE=true.
 */

export interface MockSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance?: number;
}

// Default fixture results — override per-test via setMockResults()
let _mockResults: MockSearchResult[] = [
  {
    title: 'Mock Result 1',
    url: 'https://example.com/article-1',
    snippet: 'This is a mock search result for unit testing. It contains relevant content about the query.',
    relevance: 0.95
  },
  {
    title: 'Mock Result 2',
    url: 'https://example.com/article-2',
    snippet: 'Another mock result with different context. Useful for testing multiple results scenarios.',
    relevance: 0.87
  },
  {
    title: 'Mock Result 3',
    url: 'https://example.com/article-3',
    snippet: 'Third fixture result. Contains actionable information about the searched topic.',
    relevance: 0.79
  }
];

let _shouldFail = false;

/** Override default fixture results for a specific test */
export function setMockSearchResults(results: MockSearchResult[]) {
  _mockResults = results;
}

/** Simulate a search failure (network error, API limit, etc.) */
export function setMockSearchFailure(fail: boolean) {
  _shouldFail = fail;
}

/** Reset to defaults */
export function resetMockSearch() {
  _mockResults = [];
  _shouldFail = false;
}

/** Mock webSearch function — drop-in replacement when TEST_MODE=true */
export async function mockWebSearch(query: string): Promise<{
  results: MockSearchResult[];
  query: string;
  error?: string;
}> {
  if (_shouldFail) {
    throw new Error('Mock search failure (TEST_MODE)');
  }
  // Simulate slight latency
  await new Promise(r => setTimeout(r, 10));
  return {
    query,
    results: _mockResults.map(r => ({ ...r }))
  };
}

/**
 * Returns mock or real webSearch based on TEST_MODE env.
 * Import and use this instead of webSearch directly in testable paths.
 */
export async function getTestableWebSearch() {
  if (process.env.TEST_MODE === 'true') {
    return mockWebSearch;
  }
  const { webSearch } = await import('../../app/api/_lib/web-search');
  return webSearch;
}
