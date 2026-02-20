# UI Preview: RGY Intelligent Matching Components

## 🎨 Component Overview

This document provides a visual preview of the new RGY Intelligent Matching UI components.

## 📱 Component Flow

```
┌─────────────────────────────────────┐
│     Main App / CubiQo Interface     │
│  ┌───────────────────────────────┐  │
│  │    RGY Signal Button (Tri-    │  │
│  │   color dots: Red/Yellow/Green)│  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
                 ↓ (User clicks)
┌─────────────────────────────────────┐
│       RGYChatsModal                 │
│  ┌─────────────────────────────┐   │
│  │  SIGNAL - "One is enough."  │   │
│  ├─────────────────────────────┤   │
│  │  Choose Your Context:       │   │
│  │                              │   │
│  │  🎯 Progressive (Green)     │   │
│  │  Growth & Achievement        │   │
│  │  [Wellness][Career][Goals]   │   │
│  │                              │   │
│  │  ✨ Sit back (Yellow)        │   │
│  │  Relax & Connect             │   │
│  │  [Social][Friends][Hangouts] │   │
│  │                              │   │
│  │  💫 Indulge (Red)            │   │
│  │  Desire & Exploration        │   │
│  │  [Deep][Creative][Philosophy]│   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↓ (User selects zone)
┌─────────────────────────────────────┐
│        IntentSetup Component        │
│  ┌─────────────────────────────┐   │
│  │  🎯 Progressive Context     │   │
│  │  Growth · Wellness · Goals   │   │
│  ├─────────────────────────────┤   │
│  │  Your Interests (0/50)       │   │
│  │  ┌───────────────────────┐  │   │
│  │  │ e.g., yoga, career... │  │   │
│  │  │              [Add]     │  │   │
│  │  └───────────────────────┘  │   │
│  │                              │   │
│  │  Keywords: [No keywords yet]│   │
│  │                              │   │
│  │  Description (Optional):     │   │
│  │  ┌───────────────────────┐  │   │
│  │  │ Looking for morning   │  │   │
│  │  │ wellness activities...│  │   │
│  │  └───────────────────────┘  │   │
│  │                              │   │
│  │  ℹ️ Your interests will be  │   │
│  │  used to discover matching  │   │
│  │  opportunities...            │   │
│  │                              │   │
│  │  [Save & Discover]           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↓ (After saving)
┌─────────────────────────────────────┐
│     OpportunityFeed Component       │
│  ┌─────────────────────────────┐   │
│  │  Discover Opportunities      │   │
│  │  🎯 Progressive Context      │   │
│  ├─────────────────────────────┤   │
│  │  ┌─────────────────────┐    │   │
│  │  │ 🏠 Morning Yoga     │95% │   │
│  │  │ Activity            │    │   │
│  │  │ Join us for mindful │    │   │
│  │  │ morning yoga...     │    │   │
│  │  │ [wellness][yoga]... │    │   │
│  │  │ 📅 Mon-Fri 7am      │    │   │
│  │  │ [Express Interest]  │    │   │
│  │  └─────────────────────┘    │   │
│  │  ┌─────────────────────┐    │   │
│  │  │ 📅 Tech Networking  │87% │   │
│  │  │ Event               │    │   │
│  │  │ Connect with fellow │    │   │
│  │  │ entrepreneurs...    │    │   │
│  │  │ [startup][tech]...  │    │   │
│  │  │ 📅 2026-03-15       │    │   │
│  │  │ [Express Interest]  │    │   │
│  │  └─────────────────────┘    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 🎯 Component Details

### 1. RGY Signal Button
**Location**: Main interface (floating or in navigation)

**Visual Description**:
```
┌──────────┐
│    ●     │  Red dot
│    ●     │  Yellow dot
│    ●     │  Green dot
└──────────┘
```

**States**:
- **Default**: Muted dots (25% opacity)
- **Pulse**: Brief glow when keyword saved (400ms)
- **Hover**: Scale 110%, subtle glow

**Props**:
```typescript
<RGYSignalButton 
  onClick={() => setModalOpen(true)}
  pulseColor="GREEN"  // Pulses green on save
  isDark={true}
/>
```

---

### 2. RGYChatsModal (Enhanced)
**Size**: Full-screen overlay with dark background

**Visual Elements**:
```
┌─────────────────────────────────────────┐
│ ═══ SIGNAL ═══               [×]       │ Header
│ One is enough.                          │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🌟 EARLY ACCESS                │   │ Banner
│  │  Join us in testing Signal      │   │
│  │  [Email Input] [Join]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Choose Your Context                    │ Title
│  Select a zone to set your identity     │
│                                         │
│  ┌─────────────────┐ ┌──────────────┐  │
│  │ 🎯              │ │ ✨           │  │
│  │ Progressive     │ │ Sit back     │  │ Zone Cards
│  │ Growth & Achieve│ │ Relax & Conn │  │
│  │ [Wellness][...]│ │ [Social][...]│  │
│  │ ════════════════│ │ ════════════ │  │
│  └─────────────────┘ └──────────────┘  │
│  ┌─────────────────┐                   │
│  │ 💫              │                   │
│  │ Indulge         │                   │
│  │ Desire & Explore│                   │
│  │ [Deep][...]     │                   │
│  │ ════════════════│                   │
│  └─────────────────┘                   │
└─────────────────────────────────────────┘
```

**Color Scheme**:
- Green zone: `#22c55e` with gradient background
- Yellow zone: `#eab308` with gradient background  
- Red zone: `#ef4444` with gradient background
- Background: `#0a0a0a` (dark)
- Text: White with varying opacity

**Interactions**:
- Hover: Card scales to 101%, border brightens
- Selected: Card scales to 102%, border glows
- Click: Opens IntentSetup for that context

---

### 3. IntentSetup Component
**Size**: Modal dialog, max-width 2xl (672px)

**Visual Layout**:
```
┌──────────────────────────────────────┐
│ 🎯 Progressive Context        [×]   │ Header (color-coded)
│ Growth · Wellness · Achievement      │
├──────────────────────────────────────┤
│                                      │
│ Your Interests (3/50)                │ Label
│ ┌────────────────────────────────┐  │
│ │ e.g., yoga, career...     [Add]│  │ Input + Button
│ └────────────────────────────────┘  │
│                                      │
│ ┌─────┐ ┌─────┐ ┌──────────┐       │ Keyword Pills
│ │yoga×│ │career×│ │wellness×│       │
│ └─────┘ └─────┘ └──────────┘       │
│                                      │
│ Description (Optional):              │
│ ┌────────────────────────────────┐  │
│ │ Looking for morning wellness   │  │ Textarea
│ │ activities and career growth   │  │
│ │ opportunities...               │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ ℹ️ Your interests will be used│  │ Info Box
│ │ to discover matching opps...   │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │  Save & Discover Opportunities │  │ Primary Button
│ └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Color Adaptation**:
- Header icon and accent colors match selected RGY context
- Green: `#22c55e`
- Yellow: `#eab308`
- Red: `#ef4444`

**Interactions**:
- Type keyword + Enter or click Add
- Click × on pill to remove keyword
- Save button disabled if no keywords
- Shows loading spinner while saving

---

### 4. OpportunityFeed Component
**Size**: Full-screen overlay or page

**Visual Layout**:
```
┌─────────────────────────────────────────┐
│ Discover Opportunities           [×]   │ Header
│ 🎯 Progressive Context                 │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────┐ ┌─────────────────┐│ 2-column grid
│ │ 🏠      95%     │ │ 📅      87%     ││
│ │ Morning Yoga    │ │ Tech Networking ││
│ │ Activity        │ │ Event           ││
│ │                 │ │                 ││
│ │ Join us for...  │ │ Connect with... ││
│ │                 │ │                 ││
│ │ [wellness]      │ │ [startup]       ││
│ │ [yoga]          │ │ [tech]          ││
│ │ [morning]       │ │ [networking]    ││
│ │                 │ │                 ││
│ │ 📅 Mon-Fri 7am │ │ 📅 Mar 15, 2026││
│ │ 📍 Virtual     │ │ 📍 Hybrid       ││
│ │                 │ │                 ││
│ │ [Express Int.] │ │ [Express Int.]  ││
│ └─────────────────┘ └─────────────────┘│
│ ┌─────────────────┐ ┌─────────────────┐│
│ │ ... more cards...│ │ ...            ││
│ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────┘
```

**Card Elements**:
- Type icon (🏠 room, 📅 event, 🤝 connection, 🎨 activity)
- Match percentage badge (top-right)
- Title and type label
- Description snippet
- Keywords (max 5 shown)
- Metadata (schedule, location)
- Action button

**States**:
- **Loading**: Spinner with "Discovering opportunities..."
- **Empty**: Large 🔍 icon with "No opportunities found"
- **Error**: Red warning box with retry button

**Interactions**:
- Hover card: Scale 102%
- Express Interest: Button turns green with checkmark
- Click card: Could expand to show more details

---

### 5. ProMatchSettings Component
**Size**: Modal dialog, max-width md (448px)

**Visual Layout**:
```
┌────────────────────────────────────┐
│ Pro Match Settings          [×]   │ Header
├────────────────────────────────────┤
│                                    │
│ Enable Pro Match          [⚪ →]  │ Toggle (off)
│ AI will automatically discover...  │
│                                    │
│ ─────────────────────────────────  │ When enabled:
│                                    │
│ Discovery Frequency                │
│ ┌──────────────────────────────┐  │
│ │ ○ Daily - Every day          │  │ Radio options
│ │ ● Weekly - Once per week     │  │ (selected)
│ │ ○ Monthly - Once per month   │  │
│ └──────────────────────────────┘  │
│                                    │
│ Max Suggestions: 10                │
│ ├──────●─────────────────┤        │ Slider (5-50)
│ 5                        50        │
│                                    │
│ Notifications            [⚪ →]    │ Toggle
│ Get notified when new...           │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ Last run: Jan 15, 2026 10am │  │ Info box
│ └──────────────────────────────┘  │
│                                    │
│ ┌──────────────────────────────┐  │
│ │     Save Preferences         │  │ Primary button
│ └──────────────────────────────┘  │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ ℹ️ Pro Match uses AI to     │  │ Info box
│ │ discover opportunities...    │  │
│ └──────────────────────────────┘  │
└────────────────────────────────────┘
```

**Colors**:
- Toggle active: Green `#22c55e`
- Toggle inactive: Gray `#444`
- Slider track: White 10%
- Slider thumb: White

**Interactions**:
- Toggle Pro Match: Enables/disables all settings
- Select frequency: Radio buttons
- Adjust slider: Drag or click
- Save: Shows "Saving..." then "Preferences saved!"

---

## 🎨 Design Tokens

### Colors (Dark Theme)
```typescript
const colors = {
  // RGY Contexts
  green: '#22c55e',      // Progressive
  yellow: '#eab308',     // Sit back
  red: '#ef4444',        // Indulge
  
  // Backgrounds
  bg: '#0a0a0a',         // Main background
  bgModal: '#18181b',    // Modal background
  bgCard: 'rgba(255,255,255,0.05)',  // Card background
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.4)',
  
  // Borders
  border: 'rgba(255,255,255,0.1)',
  borderHover: 'rgba(255,255,255,0.3)',
}
```

### Typography
```typescript
const typography = {
  fontFamily: 'system-ui, sans-serif',
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  }
}
```

### Spacing
```typescript
const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
}
```

---

## 📊 Component States

### Loading States
All components show loading spinners:
```
┌──────────────┐
│      ↻       │
│   Loading... │
└──────────────┘
```

### Error States
Red background with retry option:
```
┌──────────────────────────────┐
│ ⚠️ Failed to load...         │
│ [Try Again]                  │
└──────────────────────────────┘
```

### Empty States
Friendly messaging with guidance:
```
┌──────────────────────────────┐
│        🔍                    │
│  No opportunities found      │
│  Set your interests first    │
│  [Set Interests]             │
└──────────────────────────────┘
```

---

## 🔄 User Flow Animation

1. **Entry**: RGY Signal button pulses briefly on keyword save
2. **Modal Open**: Fade in with backdrop blur
3. **Zone Selection**: Cards scale and glow on hover
4. **Intent Setup**: Smooth transition from zone selection
5. **Keyword Add**: Pill animates in from input field
6. **Save**: Loading spinner → Success → Auto-close
7. **Discovery**: Grid items fade in sequentially
8. **Express Interest**: Button transforms with checkmark

---

## 📱 Responsive Design

### Desktop (>768px)
- 2-column opportunity grid
- Wider modals (max-width: 672-896px)
- Side-by-side zone cards

### Mobile (<768px)
- 1-column opportunity grid
- Full-width modals
- Stacked zone cards
- Simplified navigation

---

## ✨ Accessibility

- **ARIA labels** on all interactive elements
- **Keyboard navigation** for all flows
- **Focus indicators** on all focusable elements
- **Screen reader** announcements for state changes
- **Color contrast** meets WCAG AA standards
- **Alt text** for all icons and images

---

## 🎬 Animation Details

### Transitions
```css
transition: all 200ms ease-in-out;
```

### Hover Effects
- Scale: 101-102%
- Border opacity increase
- Box shadow glow

### Loading Spinner
```css
animation: spin 1s linear infinite;
```

### Pulse Effect (RGY Signal)
```css
animation: pulse 400ms ease-out;
box-shadow: 0 0 12px rgba(color, 0.8);
```

---

## 📦 Component Props Summary

### IntentSetup
```typescript
interface IntentSetupProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
  rgyContext: 'red' | 'yellow' | 'green'
}
```

### OpportunityFeed
```typescript
interface OpportunityFeedProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
  rgyContext?: 'red' | 'yellow' | 'green'
}
```

### ProMatchSettings
```typescript
interface ProMatchSettingsProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}
```

---

**UI designed for**: Dark theme with glassmorphism effects
**Component status**: ✅ Implemented and ready for integration
**Responsive**: ✅ Mobile and desktop optimized
**Accessibility**: ✅ WCAG AA compliant
