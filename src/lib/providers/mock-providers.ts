export type MockProviderName =
  | 'openai'
  | 'elevenlabs'
  | 'tavily'
  | 'browserbase'
  | 'stagehand'
  | 'stripe'
  | 'shopify'
  | 'vercel'
  | 'social'
  | 'oauth';

export function assertMockableProvider(provider: MockProviderName) {
  if (process.env.TEST_MODE === 'true' && process.env.TEST_ALLOW_LIVE_PROVIDERS !== 'true') {
    return { mocked: true as const, provider };
  }
  return { mocked: false as const, provider };
}

export function mockProviderResponse(provider: MockProviderName, payload: Record<string, unknown> = {}) {
  return {
    mocked: true,
    provider,
    ...payload,
  };
}

