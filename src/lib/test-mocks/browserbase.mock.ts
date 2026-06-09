/**
 * Browserbase Mock — F7-E
 * Returns fixture screenshots and page content for unit tests.
 * Activated when TEST_MODE=true.
 * Prevents any real browser sessions from opening during tests.
 */

export interface MockBrowserResult {
  screenshot?: string;   // base64-encoded PNG or URL
  pageText?: string;
  url?: string;
  title?: string;
  error?: string;
}

// 1×1 transparent PNG (base64) as minimal screenshot fixture
const FIXTURE_SCREENSHOT = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

let _mockResult: MockBrowserResult = {
  screenshot: FIXTURE_SCREENSHOT,
  pageText: 'Mock page content for unit tests. Contains relevant information about the test subject.',
  url: 'https://example.com/mock-page',
  title: 'Mock Page Title'
};

let _shouldFail = false;
let _sessionCount = 0;

/** Override fixture result for a specific test */
export function setMockBrowserResult(result: MockBrowserResult) {
  _mockResult = result;
}

/** Simulate a Browserbase failure */
export function setMockBrowserFailure(fail: boolean) {
  _shouldFail = fail;
}

/** Reset to defaults */
export function resetMockBrowser() {
  _mockResult = {
    screenshot: FIXTURE_SCREENSHOT,
    pageText: 'Mock page content.',
    url: 'https://example.com/mock-page',
    title: 'Mock Page Title'
  };
  _shouldFail = false;
  _sessionCount = 0;
}

/** How many browser sessions were "opened" — useful for asserting no unexpected sessions */
export function getMockBrowserSessionCount(): number {
  return _sessionCount;
}

/**
 * Mock browser navigation — drop-in for Browserbase/Stagehand calls.
 */
export async function mockBrowserNavigate(url: string): Promise<MockBrowserResult> {
  _sessionCount++;
  if (_shouldFail) {
    throw new Error(`Mock browser failure navigating to ${url} (TEST_MODE)`);
  }
  await new Promise(r => setTimeout(r, 20));
  return { ..._mockResult, url };
}

/**
 * Mock screenshot capture.
 */
export async function mockCaptureScreenshot(): Promise<string> {
  if (_shouldFail) throw new Error('Mock screenshot failure (TEST_MODE)');
  return _mockResult.screenshot || FIXTURE_SCREENSHOT;
}

/**
 * Guard — call this at the top of any function that would open a real browser session.
 * In TEST_MODE, logs a warning and returns mock data instead of opening Browserbase.
 */
export function assertNotTestMode(context: string) {
  if (process.env.TEST_MODE === 'true') {
    throw new Error(
      `[TEST_MODE] Real browser session prevented in: ${context}. ` +
      'Use mockBrowserNavigate() instead, or set TEST_MODE=false for integration tests.'
    );
  }
}

/**
 * Returns mock or real browser navigate function based on TEST_MODE.
 */
export function getTestableBrowserNavigate() {
  if (process.env.TEST_MODE === 'true') {
    return mockBrowserNavigate;
  }
  // Real implementation — caller imports from their browser client
  return null;
}
