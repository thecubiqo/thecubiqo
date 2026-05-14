/**
 * Test Mocks — F7-E
 * Central export for all test mock utilities.
 *
 * Usage in tests:
 *   process.env.TEST_MODE = 'true';
 *   import { getMockSupabaseClient, setMockSearchResults } from '@/next/lib/test-mocks';
 *
 * Unit tests (Phases 1–4): always use mocks — fast, no network, no DB.
 * Integration tests: set TEST_MODE=false — real connections, run separately.
 */

export {
  MockSupabaseClient,
  getMockSupabaseClient,
  getTestableSupabase
} from './supabase.mock';

export {
  mockWebSearch,
  setMockSearchResults,
  setMockSearchFailure,
  resetMockSearch,
  getTestableWebSearch,
  type MockSearchResult
} from './tavily.mock';

export {
  mockBrowserNavigate,
  mockCaptureScreenshot,
  setMockBrowserResult,
  setMockBrowserFailure,
  resetMockBrowser,
  getMockBrowserSessionCount,
  assertNotTestMode,
  getTestableBrowserNavigate,
  type MockBrowserResult
} from './browserbase.mock';

/** Convenience: reset all mocks at once (call in beforeEach) */
export function resetAllMocks() {
  const { resetMockSearch } = require('./tavily.mock');
  const { resetMockBrowser } = require('./browserbase.mock');
  const { getMockSupabaseClient } = require('./supabase.mock');
  resetMockSearch();
  resetMockBrowser();
  getMockSupabaseClient().reset();
}
