// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _composio: any = null;

export function getComposio() {
  if (!_composio) {
    if (!process.env.COMPOSIO_API_KEY) throw new Error('COMPOSIO_API_KEY not set');
    // Dynamically imported to avoid type conflicts between providers
    const { Composio } = require('@composio/core');
    const { VercelProvider } = require('@composio/vercel');
    _composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new VercelProvider(),
    });
  }
  return _composio;
}

// Get Vercel AI SDK compatible tools for a user session
export async function getUserTools(userId: string) {
  const composio = getComposio();
  const session = await composio.create(userId);
  return session.tools();
}
