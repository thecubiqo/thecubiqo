# World Generator

System for creating new "worlds" (products and regions) in CUBIQO.

## Quick Start

1. Create JSON config in `generator/config/worlds/{worldId}.json`
2. Add worldId to `VALID_WORLDS` in `src/lib/config/worlds.ts`
3. Route is automatically created at `/{worldId}`

```bash
# Create new world in 5 minutes:
cp generator/config/worlds/headlines.json generator/config/worlds/myworld.json
# Edit the JSON (name, systemPrompt, features)
# Add 'myworld' to VALID_WORLDS in src/lib/config/worlds.ts
npm run build
# Visit http://localhost:3000/myworld
```

## Architecture

```
Routes (unified [region] route):
├── /                  → Main Cubiqo
├── /uk                → UK regional world (geo-routing)
├── /headlines         → Headlines product world
├── /vocspad           → Vocspad product world
├── /headlines/chat    → Headlines chat mode
├── /vocspad/chat      → Vocspad chat mode
└── SettingsCube       → Side Panel (available everywhere)
```

The `[region]` dynamic route handles ALL worlds (both regional and product) for backward compatibility.
Internally it uses the unified World Generator system.

## World Types

### Product Worlds (`type: "product"`)
- **Headlines** (`/headlines`) - News debate platform with Hari vs Ingle
- **Vocspad** (`/vocspad`) - Voice + Keyboard intelligent notepad
- **Dicey** (coming soon) - Dice-based game
- **CoQo** (coming soon) - Collaboration tool

### Regional Worlds (`type: "region"`)
- **UK** (`/uk`) - British English experience with cultural context
- **India** (`/in`) - Hindi/English experience (coming soon)

## Config Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique world identifier (lowercase) |
| `type` | `'region'` \| `'product'` | ✅ | World type |
| `name` | string | ✅ | Display name |
| `description` | string | ✅ | Description for UI |
| `routing.path` | string | ✅ | URL path (e.g., `/headlines`) |
| `routing.domain` | string \| null | ❌ | Custom domain (e.g., `headlines.ai`) |
| `routing.geoTrigger` | string | ❌ | ISO country code for geo-routing |
| `appearance.defaultColor` | enum | ✅ | `ORANGE`, `RED`, `YELLOW`, `GREEN_BLUE` |
| `appearance.theme` | enum | ✅ | `dark`, `light`, `system` |
| `features.voice` | boolean | ✅ | Enable voice input/output |
| `features.chat` | boolean | ✅ | Enable chat interface |
| `features.memory` | boolean | ✅ | Enable memory extraction |
| `features.auth` | boolean | ✅ | Enable authentication |
| `ai.systemPrompt` | string | ✅ | AI personality prompt |
| `ai.toneModifiers` | string[] | ✅ | Tone modifiers (e.g., `['polite', 'concise']`) |
| `ai.voiceProfiles` | array | ❌ | Voice personas (for Headlines) |
| `regional` | object | ❌ | Regional config (required if `type: 'region'`) |

## Creating a New World

### Step 1: Create Config

```bash
cp generator/config/worlds/headlines.json generator/config/worlds/myworld.json
```

### Step 2: Edit Config

```json
{
  "$schema": "./schema.json",
  "id": "myworld",
  "type": "product",
  "name": "My World",
  "description": "Description of my world",

  "routing": {
    "path": "/myworld",
    "domain": null
  },

  "appearance": {
    "defaultColor": "ORANGE",
    "theme": "dark"
  },

  "features": {
    "voice": true,
    "chat": true,
    "memory": true,
    "auth": true
  },

  "ai": {
    "systemPrompt": "You are My World, an AI assistant that...",
    "toneModifiers": ["helpful", "concise"]
  }
}
```

### Step 3: Register World

Edit `src/lib/config/worlds.ts`:

```typescript
const VALID_WORLDS = ['uk', 'headlines', 'vocspad', 'myworld'] as const
```

### Step 4: Build & Test

```bash
npm run build && npm run dev
# Visit http://localhost:3000/myworld
```

## Custom Components (Optional)

For worlds that need custom UI beyond the standard FullscreenApp:

```
src/components/{worldId}/
├── {WorldId}App.tsx    # Main container component
├── {WorldId}Cube.tsx   # Custom cube variant
└── use{WorldId}.ts     # Custom hooks
```

Then update the world page to use custom components:

```typescript
// src/app/[world]/page.tsx
import { HeadlinesApp } from '@/components/headlines/HeadlinesApp'

export default function WorldPage() {
  const { worldId } = useWorld()

  if (worldId === 'headlines') {
    return <HeadlinesApp />
  }

  return <FullscreenApp />
}
```

## API Integration

### Accessing World Config in API Routes

```typescript
import { getWorldConfig, buildWorldPrompt } from '@/lib/config/worlds'

const worldId = request.headers.get('x-user-world')
const config = await getWorldConfig(worldId)
const systemPrompt = buildWorldPrompt(config)
```

### Client-Side Access

```typescript
import { useWorld } from '@/contexts/WorldContext'

function MyComponent() {
  const { config, worldId, worldType, isProduct, isRegional } = useWorld()

  if (isProduct) {
    // Product-specific logic
  }
}
```

## File Structure

```
generator/config/worlds/
├── schema.json         # JSON Schema for validation
├── headlines.json      # Headlines Cube config
├── vocspad.json        # Vocspad config
└── uk.json             # UK regional config

src/lib/config/worlds.ts        # WorldConfig interface + loader
src/contexts/WorldContext.tsx   # WorldProvider + useWorld()
src/app/[world]/
├── layout.tsx          # Dynamic world layout
└── page.tsx            # Dynamic world page
```

## Headlines Cube Specifics

Headlines uses dual voice profiles for debate format:

```json
{
  "ai": {
    "voiceProfiles": [
      { "id": "hari", "name": "Hari", "gender": "male", "tone": "assertive" },
      { "id": "ingle", "name": "Ingle", "gender": "female", "tone": "analytical" }
    ]
  }
}
```

AI responses should mark speakers:
- `[HARI]: <assertive take>`
- `[INGLE]: <analytical counterpoint>`

## Vocspad Specifics

Vocspad enables keyboard input in addition to voice:

```json
{
  "features": {
    "voice": true,
    "chat": false,
    "keyboard": true
  }
}
```

## Migration from Legacy Regions

The old `regions.ts` system is still supported for backward compatibility:

```typescript
// These still work:
import { getRegionConfig, buildRegionalPrompt } from '@/lib/config/regions'

// But prefer the new unified system:
import { getWorldConfig, buildWorldPrompt } from '@/lib/config/worlds'
```

## Team Contacts

- **Nadeem** - Headlines Cube development
- **Shabil** - Vocspad development
- **Alex** - World Generator architecture
