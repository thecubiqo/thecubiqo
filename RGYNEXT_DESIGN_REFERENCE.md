# RGY Next Design Reference - Implementation Guide

## 📍 Reference Repository
**Source**: https://github.com/CubiqoTest/rgynext  
**Purpose**: Emergent design specifications for RGY system  
**Date Analyzed**: 2026-02-19

---

## 🎨 Design Philosophy (rgynext)

### Visual Identity
- **Theme**: Dark OS-like modern aesthetic
- **Fonts**: 
  - Display: Space Grotesk
  - Body: Inter
  - Mono: Space Grotesk
- **Colors**: Neon accents on dark surfaces
- **Effects**: Glassmorphism, backdrop blur, smooth animations
- **Depth**: 5 surface levels for visual hierarchy

### Color Values
```css
--rgy-red: 350 85% 58%        /* Neon pink-red */
--rgy-green: 160 80% 45%      /* Teal-green */
--rgy-yellow: 45 95% 55%      /* Bright yellow */
--rgy-blue: 210 90% 55%       /* Sky blue (alternative) */

Surface levels:
--surface-0: 220 20% 4%       /* Background */
--surface-1: 220 18% 7%       /* Cards */
--surface-2: 220 16% 10%      /* Hover */
--surface-3: 220 15% 14%      /* Active */
--surface-4: 220 14% 18%      /* Elevated */
```

---

## 📐 Application Structure

### 3-Step Flow

```
┌─────────────────────────────────────────────┐
│ Step 1: Color Selection                     │
│ Choose Your Context                         │
│                                             │
│ [Green/Blue]  [Yellow]  [Red]              │
│ Work, Trade   Social    Dating             │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Step 2: Intent × Keyword List               │
│ Browse Available Rooms                      │
│                                             │
│ Search: [_______________]                   │
│ Filter: [All] [Collab] [Company] [Trade]   │
│                                             │
│ • Collab × React (23 participants)         │
│ • Trade × Frontend Dev (15 participants)   │
│ • Company × Startup (34 participants)      │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Step 3: Room View                           │
│ Chat in Intent × Keyword Room               │
│                                             │
│ [Chat messages with capsule IDs]           │
│ [Message input]                            │
└─────────────────────────────────────────────┘
```

---

## 🧩 Components

### 1. AppHeader (`AppHeader.tsx`)

**Purpose**: Top navigation bar with branding and context

**Elements**:
- Left: Back button (if not on color select) or Hexagon icon
- Center: "CubiQo / RGY Chats" branding
- Right: Color badge + Reset button

**Props**:
```typescript
interface AppHeaderProps {
  currentState: string;
  selectedColor: ColorType;
  onBack: () => void;
  onReset: () => void;
}
```

**Key Features**:
- Sticky position with backdrop blur
- Conditional back button
- Color context badge
- Reset functionality

---

### 2. ColorSelector (`ColorSelector.tsx`)

**Purpose**: Step 1 - Choose RGY context

**Color Options**:
1. **Green/Blue**
   - Label: "Work, Trade & Wellness"
   - Contexts: Professional, Business, Health
   - Icons: Briefcase, TrendingUp

2. **Yellow**
   - Label: "Social & Friends"
   - Contexts: Community, Networking, Events
   - Icons: Users, Sparkles

3. **Red**
   - Label: "Dating & Adult"
   - Contexts: Romance, Connections, Intimate
   - Icons: Heart, Zap

**Visual Effects**:
- Hover: Scale 1.02, glow effect
- Selected: Scale 0.98, indicator dot
- Animation: Fade-up with staggered delay

**Layout**:
- 3-column grid (responsive to 1 column on mobile)
- Cards with gradient backgrounds
- Icon pairs (primary + secondary)
- Context tags as chips

---

### 3. IntentKeywordList (`IntentKeywordList.tsx`)

**Purpose**: Step 2 - Browse Intent × Keyword rooms

**Fixed Intents**:
```typescript
const INTENTS = [
  { id: "collab", label: "Collab", icon: Users2 },
  { id: "company", label: "Company", icon: Building2 },
  { id: "trade", label: "Trade", icon: ArrowLeftRight },
];
```

**Mock Keywords** (per color):
```typescript
green: ["Frontend Dev", "React", "AI/ML", "Startup", ...]
yellow: ["Gaming", "Music", "Travel", "Food", ...]
red: ["Coffee Dates", "Dinner", "Movies", "Adventure", ...]
```

**Room Generation**:
- Rooms = Intent × Keyword combinations
- Example: "Collab × React", "Trade × Frontend Dev"
- Each room has member count and active status

**Features**:
- Search bar (filters rooms)
- Intent filter badges
- Scrollable list
- Hover effects with arrow indicator
- Empty state handling

---

### 4. RoomView (`RoomView.tsx`)

**Purpose**: Step 3 - Chat in selected room

**Display Modes**:
- List (default)
- Card
- Grid
- Map

**Chat Features**:
- System messages (encrypted notice, join/leave)
- Capsule messages (with CQ-XXXX IDs)
- Timestamp display
- Input field with send button
- Room info sidebar

**UI Elements**:
- Tab switching for display modes
- Scrollable message area
- Message grouping
- Member count
- Active status indicator

---

## 🎯 Key Differences from Current Implementation

### Terminology

| Current | rgynext | Change Needed |
|---------|---------|---------------|
| Progressive | Work, Trade & Wellness | Update labels |
| Sit back | Social & Friends | Update labels |
| Indulge | Dating & Adult | Update labels |
| Sattva | Green/Blue | Update philosophy |
| Rajas | Yellow | Update philosophy |
| Tamas | Red | Update philosophy |

### Purpose

| Current | rgynext |
|---------|---------|
| AI-powered opportunity matching | Intent × Keyword chat rooms |
| Discover people/events/activities | Join themed discussion spaces |
| Pro Match subscription | Free-form room joining |
| Vector similarity search | Combinatorial room system |

### Flow

| Current | rgynext |
|---------|---------|
| Zone → IntentSetup → OpportunityFeed | Color → Room List → Chat |
| Save keywords → Get matches | Select room → Start chatting |
| Express interest → Join | Join room → Message |

### Components

| Current | rgynext |
|---------|---------|
| IntentSetup.tsx | IntentKeywordList.tsx |
| OpportunityFeed.tsx | RoomView.tsx |
| ProMatchSettings.tsx | (Not present) |
| RGYChatsModal.tsx | ColorSelector.tsx |

---

## 🔄 Migration Strategy

### Option 1: Full Replacement (Recommended)

Replace current RGY matching system with rgynext design:

**Steps**:
1. Copy components from rgynext to current repo
2. Update color labels and descriptions
3. Replace IntentSetup with IntentKeywordList
4. Replace OpportunityFeed with RoomView
5. Keep ProMatchSettings as separate feature
6. Update RGYChatsModal to match ColorSelector aesthetic

**Pros**:
- Matches emergent designs exactly
- Cleaner, simpler UX
- Chat-focused (aligns with CubiQo's social nature)
- No backend complexity (rooms are computed)

**Cons**:
- Loses AI matching functionality
- Backend work (tables, APIs) becomes unused
- Need to implement chat functionality

---

### Option 2: Hybrid Approach

Keep both systems as separate features:

**Architecture**:
```
SIGNAL button (top-right)
    ↓
RGY Gateway
    ├─ Option A: "RGY Chats" (rgynext design)
    │   └─ Color → Room List → Chat
    │
    └─ Option B: "Pro Match" (current design)
        └─ Zone → Intent Setup → Discovery
```

**Pros**:
- Preserves backend work
- Offers both experiences
- AI matching + Social chat
- Gradual migration possible

**Cons**:
- More complexity
- Maintenance overhead
- Confusing for users?

---

### Option 3: Visual Update Only

Keep current system, update visual style to match rgynext:

**Changes**:
- Adopt rgynext color palette
- Update Space Grotesk fonts
- Add surface depth levels
- Improve animations
- Update terminology

**Pros**:
- Minimal code changes
- Keeps all backend work
- Quick implementation
- AI functionality preserved

**Cons**:
- Doesn't match rgynext flow
- Still different from emergent design
- Half-measure solution

---

## 📋 Implementation Checklist

### Phase 1: Preparation
- [ ] Backup current components
- [ ] Copy rgynext design tokens to current repo
- [ ] Update Tailwind config with rgynext colors
- [ ] Add Space Grotesk fonts

### Phase 2: Core Components
- [ ] Implement/update ColorSelector
- [ ] Implement IntentKeywordList
- [ ] Implement RoomView
- [ ] Update AppHeader logic

### Phase 3: Integration
- [ ] Wire components into FullscreenApp
- [ ] Update SIGNAL button flow
- [ ] Add state management
- [ ] Handle navigation

### Phase 4: Backend (if needed)
- [ ] Chat message storage
- [ ] Room persistence
- [ ] Member tracking
- [ ] Real-time updates

### Phase 5: Polish
- [ ] Animations and transitions
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling
- [ ] Mobile responsiveness

---

## 🎬 Next Steps

**Decision Required**: Which migration strategy?

1. **Full Replacement** - Adopt rgynext design completely
2. **Hybrid** - Keep both systems
3. **Visual Update** - Style only

**Questions to Answer**:
- Should we keep AI matching functionality?
- Is chat the primary use case?
- Can we merge Intent × Keyword with vector matching?
- What's the priority: Speed to market or feature completeness?

---

## 📁 File Mapping

### Copy from rgynext to current:

```
Source → Destination
────────────────────────────────────────────────
frontend/src/components/rgy/
  ColorSelector.tsx → src/components/ColorSelector.tsx
  IntentKeywordList.tsx → src/components/IntentKeywordList.tsx
  RoomView.tsx → src/components/RoomView.tsx
  AppHeader.tsx → (Merge with FullscreenApp header)

frontend/src/app/globals.css → src/app/globals.css
  (Merge CSS variables)

frontend/tailwind.config.js → tailwind.config.ts
  (Merge color definitions)
```

### Update in current:

```
Files to modify:
  src/components/FullscreenApp.tsx
  src/components/RGYChatsModal.tsx
  src/app/layout.tsx (add fonts)
```

---

## 🚀 Ready to Implement

I've analyzed the rgynext design thoroughly. Please confirm which approach you'd like:

**A)** Full replacement with rgynext design  
**B)** Hybrid (both systems)  
**C)** Visual update only  

Once confirmed, I'll implement the chosen strategy! 🎯
