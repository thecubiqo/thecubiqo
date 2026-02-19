# UI Integration Brief for Henry
## Branch: `main` (push directly — this is production)

---

## TASK: Connect all 24hr features into the main CubiQo UI

Right now cubiqo.ai shows the cube + chat but NONE of the new features are accessible.
Users can't find /agents, /admin, /files, /memory unless they type the URL manually.

---

## 1. ADD NAVIGATION SIDEBAR / MENU

**File to edit:** `src/components/FullscreenApp.tsx` or create `src/components/Navigation.tsx`

Add a collapsible sidebar or hamburger menu (top-left, the ☰ icon area) with:

```
🏠 Home          → /
🤖 Agents        → /agents
💬 Chat           → /chat  
📁 Files          → /files
🧠 Memory         → /memory (create this page if missing)
⚙️ Admin          → /admin
🎛️ Settings       → /settings-cube
```

**Design rules:**
- Dark theme matching existing UI (charcoal background, subtle borders)
- Icons on the left, text labels
- Collapsible to icon-only on mobile
- Active page highlighted
- Smooth slide-in animation
- Don't break the existing cube/chat layout

---

## 2. CREATE MISSING PAGES

### `/memory` page — `src/app/memory/page.tsx`
- Memory browser with search bar
- List of stored memories with categories
- Click to view/edit/delete
- Uses `/api/memory/search` endpoint

### Verify these pages work and look good:
- `/agents` — Agent dashboard with cards for Henry, Dev, Writer, Tester, Marketing
- `/admin` — Stats, health, activity monitoring
- `/files` — File tree + Monaco editor

---

## 3. ADD AGENT SWITCHER TO CHAT

**File:** `src/components/chat/ChatContainer.tsx` (or wherever chat input lives)

Add a dropdown above the chat input:
```
[Henry ▼] [Dev] [Writer] [Tester] [Marketing]
```

When user selects an agent, chat messages route to that agent's `/api/agents/[id]/run` endpoint instead of the default `/api/chat`.

---

## 4. ADD STATUS BAR

At the bottom or top of the page, show a thin status bar:

```
🟢 5 Agents Online | 📊 Tokens: 12.4k today | 💰 $0.42 spent | 🧠 23 memories
```

Uses `/api/admin/stats` to fetch data. Updates every 30s.

---

## 5. MAKE THE CUBE REACT TO AGENTS

When an agent is actively running a task:
- The cube should glow brighter / pulse
- Show the agent name near the cube ("Dev is coding...")
- When idle, cube is calm

Use `/api/agents/activity` endpoint to poll agent status.

---

## 6. CUBE IS CORRECT — DO NOT TOUCH

The FlowingEnergyCube is showing the correct plasma visual. **Do NOT modify it.**

---

## 7. QUICK WINS

- [ ] Add "Agents" count badge in navigation showing active agents
- [ ] Add loading skeleton states for all new pages
- [ ] Ensure all pages work on mobile (responsive)
- [ ] Add breadcrumbs on sub-pages
- [ ] Add keyboard shortcut: `Cmd+K` to open agent command palette
- [ ] Settings page should show API key status (which providers are configured)

---

## WORKFLOW

1. Work on `main` branch directly
2. Test locally: `npm run dev` then check each page
3. Run `npm run build` to verify no errors
4. Commit with descriptive message: `feat: Add navigation sidebar with agent switching`
5. Push to `main` — Vercel auto-deploys to cubiqo.ai
6. Verify on cubiqo.ai after deploy

---

## FILES TO TOUCH

| Task | Files |
|------|-------|
| Navigation | Create `src/components/Navigation.tsx`, edit `src/components/FullscreenApp.tsx` |
| Memory page | Create `src/app/memory/page.tsx` |
| Agent switcher | Edit chat components in `src/components/chat/` |
| Status bar | Create `src/components/StatusBar.tsx` |
| Cube reactive | Edit `src/components/FlowingEnergyCube.tsx` |
| Cube visual fix | Edit `src/components/FlowingEnergyCube.tsx` |

---

## PRIORITY ORDER

1. Navigation (users can't find anything without it)
2. Cube visual fix (first thing people see)
3. Agent switcher in chat (core feature)
4. Status bar (shows system is alive)
5. Cube agent reactivity (polish)
6. Quick wins (finishing touches)

---

## DO NOT

- Do NOT create new branches — work on `main`
- Do NOT break the existing chat functionality
- Do NOT remove any existing components
- Do NOT change API routes (they're working)
- Do NOT commit .env files or secrets

**Test before every push: `npm run build`**

---

*Hand this to Henry. He assigns to Dev. Dev builds. Tester verifies. Ship it.*
