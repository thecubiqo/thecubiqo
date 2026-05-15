export function liveProvidersAllowed() {
  return process.env.TEST_ALLOW_LIVE_PROVIDERS === 'true' || process.env.NODE_ENV === 'production';
}

export function shouldUseProviderMock() {
  return process.env.TEST_MODE === 'true' && process.env.TEST_ALLOW_LIVE_PROVIDERS !== 'true';
}

