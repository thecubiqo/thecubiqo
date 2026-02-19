# Founders Pass Gate + Integration Toggles — Build Spec
## For: Henry → Dev Agent | Branch: `main`

---

## CONCEPT

```
┌─────────────────────────┐  GATE  ┌─────────────────────────┐
│     FOUNDERS PASS       │◄──────►│     GENERIC LOGIN       │
│                         │        │                         │
│ • Agentic (full power)  │  You   │ Landing: cubiqo.ai      │
│ • Code, deploy, control │  test  │                         │
│ • All integrations      │  here  │ Clean safe feature set  │
│ • Admin dashboard       │  then  │ Chat + Voice + Cube     │
│ • Feature toggles       │  push  │ BYO keys only           │
│ • Login: aditya@cubiqo  │  ───►  │ No agent/admin/code     │
│   + PIN via email       │        │ No dangerous tools      │
│                         │        │                         │
└─────────────────────────┘        └─────────────────────────┘

Both live on cubiqo.ai — same codebase, different feature visibility
```

---

## PART 1: FOUNDERS PASS AUTH GATE

### 1.1 Auth Flow

**Founder login:** `aditya@cubiqo.ai` → receives 6-digit PIN via email → enters PIN → full access

**Regular users:** Sign in via Supabase Auth (Google/email) → limited feature set

### 1.2 Implementation

**File:** `src/lib/auth/founders.ts` (NEW)

```typescript
// Hardcoded founder emails (or store in Supabase)
const FOUNDER_EMAILS = ['aditya@cubiqo.ai'];

export function isFounder(email: string): boolean {
  return FOUNDER_EMAILS.includes(email.toLowerCase());
}

export function getFeatureAccess(user: User | null): FeatureAccess {
  if (!user) return PUBLIC_ACCESS;
  if (isFounder(user.email)) return FOUNDER_ACCESS;
  return USER_ACCESS;
}
```

**File:** `src/lib/auth/feature-flags.ts` (NEW)

```typescript
interface FeatureAccess {
  // Pages
  agents: boolean;
  admin: boolean;
  files: boolean;
  memory: boolean;
  cubikey: boolean;
  integrations: boolean;
  
  // Capabilities
  codeExecution: boolean;
  browserControl: boolean;
  agentSpawning: boolean;
  gitOperations: boolean;
  deployControl: boolean;
  cronJobs: boolean;
  
  // Integrations (toggle individually)
  gmail: boolean;
  calendar: boolean;
  maps: boolean;
  uber: boolean;
  twitter: boolean;
  linkedin: boolean;
  github: boolean;
  slack: boolean;
  discord: boolean;
  telegram: boolean;
  whatsapp: boolean;
  notion: boolean;
  drive: boolean;
  spotify: boolean;
  
  // Models
  premiumModels: boolean;  // Opus, GPT-5.2
  allModels: boolean;      // Including experimental
}

const PUBLIC_ACCESS: FeatureAccess = {
  // Pages
  agents: false, admin: false, files: false, memory: false,
  cubikey: false, integrations: false,
  
  // Capabilities
  codeExecution: false, browserControl: false, agentSpawning: false,
  gitOperations: false, deployControl: false, cronJobs: false,
  
  // Integrations — all off for public
  gmail: false, calendar: false, maps: false, uber: false,
  twitter: false, linkedin: false, github: false, slack: false,
  discord: false, telegram: false, whatsapp: false, notion: false,
  drive: false, spotify: false,
  
  // Models
  premiumModels: false, allModels: false,
};

const FOUNDER_ACCESS: FeatureAccess = {
  // EVERYTHING ON
  agents: true, admin: true, files: true, memory: true,
  cubikey: true, integrations: true,
  codeExecution: true, browserControl: true, agentSpawning: true,
  gitOperations: true, deployControl: true, cronJobs: true,
  gmail: true, calendar: true, maps: true, uber: true,
  twitter: true, linkedin: true, github: true, slack: true,
  discord: true, telegram: true, whatsapp: true, notion: true,
  drive: true, spotify: true,
  premiumModels: true, allModels: true,
};

// User access = what founder has released through the gate
// Stored in Supabase: released_features table
const USER_ACCESS: FeatureAccess = await getReleasedFeatures();
```

### 1.3 Gate Control (Founder decides what goes public)

**File:** `src/app/admin/gate/page.tsx` (NEW) — Founder-only page

UI: A list of ALL features with toggles:

```
┌──────────────────────────────────────────────────┐
│  FEATURE GATE — Control what users see           │
│                                                  │
│  ☐ Agent Dashboard     [Founder Only] → [Public] │
│  ☐ File Browser        [Founder Only] → [Public] │
│  ☐ Memory Browser      [Founder Only] → [Public] │
│  ☐ Admin Dashboard     [Founder Only] ← locked   │
│  ☐ Code Execution      [Founder Only] → [Public] │
│  ☐ Browser Control     [Founder Only] → [Public] │
│  ☐ Gmail Integration   [Founder Only] → [Public] │
│  ☐ Calendar            [Founder Only] → [Public] │
│  ☐ Twitter/X           [Founder Only] → [Public] │
│  ...                                             │
│                                                  │
│  [Save & Deploy]                                 │
└──────────────────────────────────────────────────┘
```

When you toggle a feature to "Public", it becomes visible to all logged-in users.
Some features (Admin, Deploy Control) stay permanently Founder-only.

**Supabase table:**

```sql
CREATE TABLE released_features (
  feature_key TEXT PRIMARY KEY,
  released BOOLEAN DEFAULT false,
  released_at TIMESTAMPTZ,
  released_by TEXT
);

-- Seed with all features as unreleased
INSERT INTO released_features (feature_key, released) VALUES
  ('agents', false),
  ('files', false),
  ('memory', false),
  ('code_execution', false),
  ('browser_control', false),
  ('agent_spawning', false),
  ('cron_jobs', false),
  ('gmail', false),
  ('calendar', false),
  ('maps', false),
  ('uber', false),
  ('twitter', false),
  ('linkedin', false),
  ('github', false),
  ('slack', false),
  ('discord', false),
  ('telegram', false),
  ('whatsapp', false),
  ('notion', false),
  ('drive', false),
  ('spotify', false),
  ('premium_models', false),
  ('cubikey', false);
```

---

## PART 2: INTEGRATION TOGGLES PANEL

### 2.1 Integrations Page

**File:** `src/app/integrations/page.tsx` (NEW) — Founder sees all, users see released only

A settings panel where you toggle which services CubiQo can access:

```
┌────────────────────────────────────────────────────────────┐
│  🔌 INTEGRATIONS                                           │
│                                                            │
│  Communication                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📧 Gmail           [Read ☐] [Write ☐] [Connected ●] │  │
│  │ 📅 Google Calendar  [Read ☐] [Write ☐] [Connect →]  │  │
│  │ 💬 Slack            [Read ☐] [Write ☐] [Connect →]  │  │
│  │ 💬 Discord          [Read ☐] [Write ☐] [Connect →]  │  │
│  │ 📱 Telegram         [Read ☐] [Write ☐] [Connected ●]│  │
│  │ 📱 WhatsApp         [Read ☐] [Write ☐] [Connect →]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Productivity                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📝 Notion           [Read ☐] [Write ☐] [Connect →]  │  │
│  │ 📂 Google Drive     [Read ☐] [Write ☐] [Connect →]  │  │
│  │ 🐙 GitHub           [Read ☐] [Write ☐] [Connected ●]│  │
│  │ 🔀 Vercel           [Read ☐] [Write ☐] [Connect →]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Services                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🗺️ Google Maps      [Read ☐]           [Connect →]  │  │
│  │ 🚗 Uber             [Read ☐] [Book ☐]  [Connect →]  │  │
│  │ 🎵 Spotify          [Read ☐] [Play ☐]  [Connect →]  │  │
│  │ 🐦 Twitter/X        [Read ☐] [Post ☐]  [Connect →]  │  │
│  │ 💼 LinkedIn          [Read ☐] [Post ☐]  [Connect →]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  AI Models                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🤖 Claude (Anthropic)  [On ●]  Key: ••••••••••     │  │
│  │ 🧠 GPT (OpenAI)        [On ●]  Key: ••••••••••     │  │
│  │ ⚡ Groq (Llama/Mixtral) [Off ○] Key: [Add Key →]    │  │
│  │ 🌪️ Mistral              [Off ○] Key: [Add Key →]    │  │
│  │ ✨ Gemini (Google)      [Off ○] Key: [Add Key →]    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 2.2 How Toggles Work

Each integration has:
- **Connect button** → OAuth flow or API key entry
- **Read toggle** → CubiQo can read from this service
- **Write toggle** → CubiQo can write/post/send via this service
- **Status indicator** → Connected (green) / Disconnected (gray)

When a toggle is ON, the agent tools for that service become available.
When OFF, the agent cannot use those tools even if connected.

**Supabase table:**

```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  integration TEXT NOT NULL,          -- 'gmail', 'slack', etc.
  connected BOOLEAN DEFAULT false,
  read_access BOOLEAN DEFAULT false,
  write_access BOOLEAN DEFAULT false,
  credentials JSONB DEFAULT '{}',     -- Encrypted OAuth tokens / API keys
  connected_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration)
);
```

### 2.3 Tool Filtering

When an agent runs, filter available tools based on user's integration toggles:

```typescript
function getAvailableTools(userId: string, featureAccess: FeatureAccess): Tool[] {
  const integrations = await getUserIntegrations(userId);
  const tools: Tool[] = [...BASE_TOOLS]; // exec, read, write, etc.
  
  if (integrations.gmail?.read_access) tools.push(gmailReadTool);
  if (integrations.gmail?.write_access) tools.push(gmailSendTool);
  if (integrations.calendar?.read_access) tools.push(calendarReadTool);
  if (integrations.calendar?.write_access) tools.push(calendarCreateTool);
  if (integrations.github?.read_access) tools.push(githubReadTool);
  if (integrations.github?.write_access) tools.push(githubPushTool);
  // ... etc for all integrations
  
  // Feature gate filter
  if (!featureAccess.codeExecution) tools = tools.filter(t => t.id !== 'exec');
  if (!featureAccess.browserControl) tools = tools.filter(t => t.id !== 'browser');
  
  return tools;
}
```

---

## PART 3: NAVIGATION — EVERYTHING ACCESSIBLE

Update the navigation (from UI_INTEGRATION_BRIEF.md) to include ALL features:

```
SIDEBAR NAVIGATION:

🏠 Home
💬 Chat (with agent switcher dropdown)
🤖 Agents
📁 Files
🧠 Memory
🔌 Integrations          ← NEW
🔑 CubiKey               ← NEW (founder only until released)
⚙️ Settings
📊 Admin                  ← Founder only
🚪 Feature Gate           ← Founder only
```

Founder sees all items. Regular users see only released features.
Unreleased items are hidden from nav, not grayed out.

---

## PART 4: IMPLEMENTATION PRIORITY

```
Day 1: Auth Gate
  ├── Founder email check + PIN login
  ├── Feature access system (founder vs user)
  ├── released_features table
  └── Gate admin page (/admin/gate)

Day 2: Navigation + Visibility
  ├── Full sidebar nav with all items
  ├── Feature-gated visibility (hide unreleased from users)
  ├── Responsive mobile nav
  └── Active page highlighting

Day 3: Integration Toggles
  ├── /integrations page
  ├── user_integrations table
  ├── Read/Write toggle UI per service
  ├── Tool filtering based on toggles
  └── OAuth connect flows for key services (Gmail, GitHub, Slack)

Day 4: Polish
  ├── Loading states, error handling
  ├── Mobile responsive for all new pages
  ├── Test gate: verify users can't access founder features
  └── Test toggles: verify tools are filtered correctly
```

---

## DO NOT

- Do NOT expose admin/gate pages to non-founder users
- Do NOT store raw OAuth tokens — encrypt in credentials JSONB
- Do NOT let non-founders toggle integrations that aren't released
- Do NOT break existing chat functionality
- Do NOT touch the cube

---

## TELL HENRY

> "Henry, read /root/clawd/thecubiqo/FOUNDERS_GATE_SPEC.md.
> Priority 1: Founder login gate with aditya@cubiqo.ai + email PIN.
> Priority 2: Feature toggle admin page so I control what goes public.
> Priority 3: Integration toggles panel with read/write per service.
> Priority 4: Full navigation sidebar.
> All on main branch. Test before push. Go."

---

*Founders Pass: You build behind the gate. Users get what you release.*
