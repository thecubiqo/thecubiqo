# Journal History - Visual Guide

## Component Hierarchy

```
journal/history/page.tsx (Page)
└── JournalHistory.tsx (Main Component)
    ├── Search Bar
    │   └── Text input with search icon
    ├── Entry Grid (Responsive)
    │   └── Entry Cards (for each journal entry)
    │       ├── Date & Time
    │       ├── Mood Badge (color-coded)
    │       ├── Preview Text (150 chars)
    │       └── Stats (word count, duration)
    └── JournalEntryModal.tsx (on click)
        ├── Header (date, close button)
        ├── Metadata Badges (mood, color state, stats)
        ├── Full Content (scrollable)
        └── Close Button (footer)
```

## Color Scheme Visual

```
┌─────────────────────────────────────────┐
│  Background: zinc-950 (very dark)       │
│  ┌────────────────────────────────────┐ │
│  │  Card: zinc-900/50 (glass effect)  │ │
│  │  Border: orange-500/30             │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │  Text: white/90 (primary)    │  │ │
│  │  │  Text: white/60 (secondary)  │  │ │
│  │  │  Accent: orange-500          │  │ │
│  │  │  Glow: orange-500/20 blur    │  │ │
│  │  └──────────────────────────────┘  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Layout Examples

### Desktop View (2 columns)
```
┌──────────────────────────────────────────────────┐
│  Journal History                 [Search...   🔍] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ┌───────────────────┐  ┌───────────────────┐   │
│  │ Today        [😊] │  │ Yesterday    [😌] │   │
│  │ I had an amazing  │  │ Today was quite   │   │
│  │ day working on... │  │ reflective. I...  │   │
│  │ 📝 250 words ⏱ 8m │  │ 📝 180 words ⏱ 6m │   │
│  └───────────────────┘  └───────────────────┘   │
│  ┌───────────────────┐  ┌───────────────────┐   │
│  │ 3 days ago   [🎯] │  │ 4 days ago   [😊] │   │
│  │ Working on a new  │  │ Great progress on │   │
│  │ project that...   │  │ my goals today... │   │
│  │ 📝 320 words ⏱ 12m│  │ 📝 210 words ⏱ 7m │   │
│  └───────────────────┘  └───────────────────┘   │
│                                                   │
│           [Load More Entries]                    │
└──────────────────────────────────────────────────┘
```

### Mobile View (1 column)
```
┌──────────────────────┐
│ Journal History      │
│ [Search...       🔍] │
│ ──────────────────── │
│ ┌──────────────────┐ │
│ │ Today       [😊] │ │
│ │ I had an amazing │ │
│ │ day working on...│ │
│ │ 📝 250w  ⏱ 8m    │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ Yesterday   [😌] │ │
│ │ Today was quite  │ │
│ │ reflective. I... │ │
│ │ 📝 180w  ⏱ 6m    │ │
│ └──────────────────┘ │
│                      │
│   [Load More]        │
└──────────────────────┘
```

### Modal View (Entry Details)
```
┌───────────────────────────────────────────┐
│  Journal Entry                        [✕] │
│  February 18, 2024 at 8:15 AM             │
├───────────────────────────────────────────┤
│  [😊 Energized] [🟡 YELLOW] [250 words]   │
│                                            │
│  ┌─────────────────────────────────────┐  │
│  │ Today was an incredible day. I      │  │
│  │ woke up feeling energized and       │  │
│  │ ready to tackle all my goals.       │  │
│  │                                     │  │
│  │ The morning started with a great   │  │
│  │ workout session...                 │  │
│  │                                     │  │
│  │ [Full scrollable content]          │  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
├───────────────────────────────────────────┤
│               [Close]                      │
└───────────────────────────────────────────┘
```

## Mood Badge Colors

```
Energized/Playful:  ●  Orange (bg-orange-500/20)
Calm/Reflective:    ●  Blue   (bg-blue-500/20)
Focused/Serious:    ●  Purple (bg-purple-500/20)
Urgent:             ●  Red    (bg-red-500/20)
Default:            ●  Orange (bg-orange-500/20)
```

## Hover Effects

```
Normal State:
┌────────────────────┐
│  Entry Card        │
│  border: white/10  │
└────────────────────┘

Hover State:
┌────────────────────┐
│  Entry Card     ✨ │  ← Orange glow
│  border: orange/50 │  ← Orange border
│  [Read full →]     │  ← Show indicator
└────────────────────┘
```

## Loading States

```
Initial Loading:
    ⊙  ← Spinning orange ring
   with orange glow

Loading More:
    [⊙ Loading...] ← Button with spinner
```

## Empty States

```
No Entries:
┌─────────────────────────┐
│      📝                 │
│  No journal entries yet │
│  Start journaling...    │
└─────────────────────────┘

No Search Results:
┌─────────────────────────┐
│      📝                 │
│  No entries found       │
│  Try a different...     │
└─────────────────────────┘
```

## User Flow Diagram

```
┌─────────────────┐
│ Complete        │
│ Daily Journal   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JournalGate     │
│ "Already done!" │
└────────┬────────┘
         │ Click "View Past Entries"
         ▼
┌─────────────────┐
│ Journal History │
│ Page Loads      │
└────────┬────────┘
         │
         ├─────► [Search] ──► Filter entries
         │
         ├─────► [Click Entry] ──► Open Modal
         │                            │
         │                            ▼
         │                       ┌────────────┐
         │                       │ Full Entry │
         │                       │ Modal      │
         │                       └────┬───────┘
         │                            │
         │                       [Close/ESC]
         │                            │
         │         ◄──────────────────┘
         │
         └─────► [Load More] ──► Next 30 entries
```

## Animation Effects

```
Orange Glow Animation:
  ┌───┐         ┌────┐        ┌─────┐
  │ ● │   →     │  ● │   →    │  ●  │  → (repeat)
  └───┘         └────┘        └─────┘
  Small         Medium         Large
  (animate-pulse with blur-3xl)

Loading Spinner:
     ╲
      ●   ← Rotates 360°
     ╱     (border animation)
```

## Responsive Breakpoints

```
Mobile:       < 768px  →  1 column, full width cards
Tablet:    768 - 1024px →  2 columns
Desktop:     > 1024px  →  2 columns, max-width 4xl
```

## Key User Interactions

1. **Search**: Type → 500ms wait → Filter
2. **Entry Click**: Click card → Modal opens → ESC closes
3. **Load More**: Click → Spinner → Append entries
4. **Back to Journal**: Click header link → Navigate to /journal
5. **Mobile Scroll**: Smooth vertical scroll with momentum
