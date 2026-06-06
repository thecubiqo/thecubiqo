import { OpenAIToolSet } from 'composio-core';

let _toolset: OpenAIToolSet | null = null;

export function getToolset(): OpenAIToolSet {
  if (!_toolset) {
    if (!process.env.COMPOSIO_API_KEY) throw new Error('COMPOSIO_API_KEY not set');
    _toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });
  }
  return _toolset;
}

// Returns tools for a specific set of apps — keeps prompt lean
export async function getTools(apps: string[]) {
  return getToolset().getTools({ apps });
}

// Execute a tool action returned by the LLM
export async function executeTool(name: string, input: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (getToolset() as any).executeAction(name, input);
}
