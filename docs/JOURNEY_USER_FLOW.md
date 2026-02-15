# Journey Memory System - User Flow Documentation

## Complete User Experience Flow

This document describes the end-to-end user experience for the Journey Memory System, from admin enablement to user opt-in.

---

## Flow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN PERSPECTIVE                             │
└─────────────────────────────────────────────────────────────────────┘

1. Admin navigates to /admin/journey
2. Sees "Journey Memory Status" with "Disabled" badge
3. Clicks "Enable Feature" button
4. Feature flag updated in database
5. Admin sees confirmation: "Enabled" badge

┌─────────────────────────────────────────────────────────────────────┐
│                        USER PERSPECTIVE                              │
└─────────────────────────────────────────────────────────────────────┘

1. User visits cubiqo.ai or /chat
2. IF feature enabled AND user not opted in:
   → Beautiful gradient prompt appears in bottom-left corner
3. User has 3 options:
   a) Click "Learn More" → Opens consent modal
   b) Click "Later" → Dismisses for 24 hours
   c) Click X → Same as "Later"
4. If "Learn More":
   → Consent modal opens
   → User reads about Journey Memory
   → User selects retention period (30/90/180/365 days or forever)
   → User clicks "Enable Journey Memory"
   → Consent saved to database
   → Prompt disappears (forever)
5. Journey Memory starts collecting contextual information
```

---

## Visual Component: Journey Memory Prompt

### Appearance

```
┌─────────────────────────────────────────────────┐
│  [X]                                            │
│  ┌─────┐                                        │
│  │ 💡 │  New: Journey Memory                    │
│  └─────┘                                        │
│                                                  │
│  Help CubiQo remember your preferences and      │
│  context for more personalized conversations.   │
│                                                  │
│  ┌──────────────┐  ┌─────────┐                │
│  │ Learn More   │  │  Later  │                 │
│  └──────────────┘  └─────────┘                │
│                                                  │
│  ╌╌╌ Animated Glow Border ╌╌╌                 │
└─────────────────────────────────────────────────┘
```

### Position
- **Location:** Bottom-left corner
- **Z-index:** 40 (above main content, below modals)
- **Offset:** Above "Powered By" logos
- **Responsive:** Adapts to mobile screens

### Design Details
- **Background:** Purple-to-blue gradient (`from-purple-600 to-blue-600`)
- **Border:** White with 20% opacity
- **Shadow:** Dramatic 2xl shadow
- **Animation:** Smooth fade-in with slide-up effect
- **Glow:** Pulsing gradient border (purple → pink → blue)
- **Icon:** Light bulb (represents memory/ideas)
- **Typography:** Clean, modern, readable

---

## User Interaction States

### State 1: Feature Disabled
- **Prompt:** Not visible
- **Reason:** Feature flag is OFF in database
- **Admin Action Required:** Enable via `/admin/journey`

### State 2: Feature Enabled, User Not Authenticated
- **Prompt:** Not visible
- **Reason:** Only authenticated users can opt-in
- **User Action Required:** Sign in first

### State 3: Feature Enabled, User Authenticated, Not Opted In
- **Prompt:** ✅ VISIBLE
- **User Can:** Learn more, dismiss, or close
- **Behavior:** 
  - Shows on page load
  - Smooth fade-in animation
  - Non-blocking (can use app normally)

### State 4: User Dismissed Prompt
- **Prompt:** Hidden for 24 hours
- **Storage:** `localStorage` key: `journey_prompt_dismissed`
- **Value:** Timestamp + 24 hours
- **Behavior:** Will reappear after 24 hours if still not opted in

### State 5: User Opted In
- **Prompt:** Permanently hidden
- **Database:** `journey_consents` table has record
- **Behavior:** Never shows again to this user

---

## Consent Modal Flow

When user clicks "Learn More":

1. **Modal Opens** (fullscreen overlay with blur)
2. **Content Sections:**
   - **What is Journey Memory?**
     - Explanation of feature
     - Benefits listed with checkmarks
   
   - **Your Privacy, Your Choice**
     - Retention period dropdown:
       - 30 Days
       - 90 Days
       - 6 Months
       - 1 Year
       - Forever
     - Privacy guarantees (bullet points)

3. **Actions:**
   - **"No Thanks"** button (left) → Opts out, dismisses modal
   - **"Enable Journey Memory"** button (right) → Opts in, saves choice

4. **After Opting In:**
   - API call: `POST /api/journey/consent`
   - Database: Record saved in `journey_consents`
   - UI: Prompt disappears
   - System: Starts collecting memories

---

## Technical Implementation

### Component Architecture

```typescript
JourneyMemoryPrompt
├── Checks feature flag (API call)
├── Checks user authentication
├── Checks user opt-in status
├── Checks localStorage dismissal
└── Conditionally renders

When "Learn More" clicked:
└── Opens JourneyConsentModal
    ├── Shows detailed information
    ├── Retention period selector
    └── Opt-in/opt-out actions
```

### API Interactions

```typescript
// Check status
GET /api/journey/similarity
Response: { featureEnabled: boolean, userOptedIn: boolean }

// Save consent
POST /api/journey/consent
Body: { optedIn: true, retentionDays: 365 }
Response: { consent: {...}, success: true }
```

### State Management

```typescript
// Local State
- featureEnabled: boolean
- userOptedIn: boolean
- showPrompt: boolean
- showConsentModal: boolean
- loading: boolean

// LocalStorage
- journey_prompt_dismissed: timestamp (24hr TTL)
```

---

## User Decision Matrix

| User Action | Immediate Result | Long-term Result |
|------------|------------------|------------------|
| Click "Learn More" | Opens consent modal | User can read details, then decide |
| Click "Later" | Prompt disappears | Reappears in 24 hours if not opted in |
| Click X | Prompt disappears | Same as "Later" |
| Opt In (modal) | Prompt disappears | Never shows again, memory collection starts |
| Opt Out (modal) | Prompt disappears | May reappear based on dismissal logic |

---

## Positioning Strategy

### Why Bottom-Left?
- **Non-intrusive:** Doesn't block main content (cube is centered)
- **Visible:** Easy to notice without being annoying
- **Mobile-friendly:** Works on all screen sizes
- **Consistent:** Near other UI elements (Settings, Sign In)
- **Accessible:** Above "Powered By" logos

### Alternative Positions (Configurable)
```typescript
position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
```
Default: `bottom-left` (above powered-by logos)

---

## Market Research Insights

### Best Practices Implemented

1. **Non-Blocking Design**
   - Doesn't interrupt user flow
   - Can use app while prompt is visible
   - Easy to dismiss

2. **Clear Value Proposition**
   - "Help CubiQo remember your preferences"
   - Focuses on user benefit, not technical details

3. **Respect User Choice**
   - Multiple ways to dismiss
   - 24-hour grace period
   - No penalty for declining

4. **Progressive Disclosure**
   - Initial prompt is brief
   - "Learn More" reveals full details
   - User controls information depth

5. **Visual Appeal**
   - Modern gradient design
   - Smooth animations
   - Matches app aesthetic
   - Professional appearance

---

## Integration Points

### Main User Interfaces

1. **Voice Interface** (`/` - FullscreenApp)
   - Primary CubiQo experience
   - Fullscreen cube with voice interaction
   - Prompt appears bottom-left

2. **Chat Interface** (`/chat`)
   - Text-based chat
   - Split-screen with mini cube
   - Prompt appears bottom-left

3. **Regional Chat** (`/[region]/chat`)
   - Regional variations
   - Same chat experience
   - Consistent prompt placement

### Admin Interface

- **Admin Dashboard** (`/admin/journey`)
  - Feature flag toggle
  - Metrics and analytics
  - User opt-in statistics

---

## Testing Scenarios

### Scenario 1: Feature Disabled
1. Admin keeps feature flag OFF
2. User visits cubiqo.ai
3. **Expected:** No prompt appears

### Scenario 2: Feature Enabled, First Visit
1. Admin enables feature flag
2. User visits cubiqo.ai (authenticated)
3. **Expected:** Prompt appears with fade-in
4. User clicks "Later"
5. **Expected:** Prompt disappears

### Scenario 3: Return Visit (Within 24h)
1. User dismissed prompt earlier
2. User returns within 24 hours
3. **Expected:** Prompt does not appear

### Scenario 4: Return Visit (After 24h)
1. User dismissed prompt >24 hours ago
2. User returns to site
3. **Expected:** Prompt appears again

### Scenario 5: User Opts In
1. User clicks "Learn More"
2. Modal opens with full details
3. User selects retention period
4. User clicks "Enable Journey Memory"
5. **Expected:** 
   - Consent saved to database
   - Prompt disappears
   - Memories start being collected

---

## Summary

The Journey Memory prompt provides a **non-intrusive, user-friendly way** to introduce the new feature to users after an admin enables it. Following market research best practices, it:

✅ Appears exactly when admin wants (feature flag controlled)  
✅ Shows on main user interfaces (cubiqo.ai, /chat)  
✅ Respects user choice (dismissible, 24h grace)  
✅ Beautiful design (matches CubiQo aesthetic)  
✅ Clear value proposition (benefit-focused)  
✅ Progressive disclosure (brief prompt → detailed modal)  
✅ Accessible (keyboard + screen reader friendly)

---

**Created:** 2026-02-15  
**Version:** 1.0  
**Status:** Implemented and ready for testing
