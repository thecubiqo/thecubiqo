# Provider Integration Requirements

## Status: ~80% Implemented

## Overview

The Emergent Engine routes LLM requests through multiple providers via a unified interface. The Emergent provider acts as a universal API key proxy, supporting all major model providers through a single API key.

## LLM Router (`src/lib/ai/llm-router.ts`)

### Implemented Providers ✅

| Provider | Models | Auth | Base URL | Status |
|----------|--------|------|----------|--------|
| `emergent` | claude-sonnet-4-5 (default) | `EMERGENT_API_KEY` | `EMERGENT_BASE_URL` | ✅ Routes through Anthropic |
| `anthropic` | claude-sonnet-4-5, claude-opus-4-5 | `ANTHROPIC_API_KEY` | Default | ✅ |
| `openai` | gpt-5.2, gpt-4o | `OPENAI_API_KEY` | Default | ✅ |
| `groq` | llama-3, mixtral | `GROQ_API_KEY` | `api.groq.com/openai/v1` | ✅ |
| `google` | gemini-2.5-pro | `GOOGLE_AI_API_KEY` | Default | ✅ |
| `openrouter` | Various | `OPENROUTER_API_KEY` | `openrouter.ai/api/v1` | ✅ |
| `mistral` | mistral-large | `MISTRAL_API_KEY` | `api.mistral.ai/v1` | ✅ |

### Provider Interface

```typescript
interface LLMRequest {
  model: ModelConfig;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  content: string;
  toolCalls?: Array<{ id: string; name: string; arguments: any }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}
```

### Key Implementation Details

1. **Emergent ↔ Anthropic aliasing**: The `emergent` provider routes through the same `callAnthropic()` function, using `EMERGENT_API_KEY` and `EMERGENT_BASE_URL` as overrides
2. **OpenAI-compatible providers**: Groq, OpenRouter, and Mistral all use the OpenAI SDK with custom base URLs
3. **Google Gemini**: Uses the `@google/generative-ai` SDK with format conversion
4. **Tool calling**: All providers support function calling with format conversion per provider

## Not Implemented ❌

### Streaming Support
The spec defines streaming via `AsyncGenerator<ChatChunk>`:
```typescript
interface LLMProvider {
  chat(params: ChatParams): AsyncGenerator<ChatChunk>;
  embed(text: string): Promise<number[]>;
}
```
Current implementation returns complete responses, not streams.

### Embedding Support
Required for memory vector store:
```typescript
embed(text: string): Promise<number[]>
```
Each provider should support text embedding for semantic memory search.

### Model Registry with Auto-Failover
```typescript
const MODEL_REGISTRY = {
  "claude-sonnet-4-5": { provider: "emergent", fallback: "anthropic" },
  "claude-opus-4-5": { provider: "emergent", fallback: "anthropic" },
  "gpt-5.2": { provider: "emergent", fallback: "openai" },
  "llama-3": { provider: "meta", fallback: null },
  "mistral-large": { provider: "mistral", fallback: null },
};
```
Automatic failover between providers when primary fails.

### Cost-Aware Model Selection
- Track token usage per task
- Use cheaper models (Groq/Llama) for simple tasks
- Use expensive models (Claude/GPT) only when quality matters
- Per-agent model override capability

## Emergent Universal Key Integration

```
EMERGENT_BASE_URL=https://api.emergentmethods.ai/v1
EMERGENT_API_KEY=sk-emergent-xxx
```

The Emergent provider acts as a unified proxy:
- Anthropic models: Uses anthropic-messages API format
- OpenAI models: Uses openai-completions API format
- Auth: Bearer token in Authorization header

## OpenClaw Integration

An additional provider integration exists at `src/lib/ai/providers/index.ts`:
- Routes through Clawdbot for enhanced capabilities
- Model: `emergent-claude/claude-sonnet-4-5`
- Base URL: `http://localhost:18789`
- Disabled by default (requires `OPENCLAW_API_KEY`)

## Environment Variables Required

```
# Emergent (primary)
EMERGENT_API_KEY=sk-emergent-xxx
EMERGENT_BASE_URL=https://api.emergentmethods.ai/v1

# Direct provider keys (fallback)
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GROQ_API_KEY=gsk_xxx
GOOGLE_AI_API_KEY=xxx
OPENROUTER_API_KEY=sk-or-xxx
MISTRAL_API_KEY=xxx

# OpenClaw (optional)
OPENCLAW_API_KEY=xxx
OPENROUTER_KEY_CUBIKEY=xxx
```

## Implementation Priority

1. **High**: Streaming support (SSE for agent chat)
2. **High**: Auto-failover between providers
3. **Medium**: Embedding support for memory
4. **Low**: Cost-aware model selection

## References
- Source: `src/lib/ai/llm-router.ts`
- Source: `src/lib/ai/providers/index.ts`
- Source: `src/types/agent.ts` (ModelConfig)
- Source: `.env.example`
- Source: `CUBIQO_SELF_CODING_ENGINE.md` Part 5
