# Journal Analytics Admin Page - Visual Preview

## Page URL
```
/admin/journal
```

## Page Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Journal Analytics                                                 │
│ Track journal entry metrics, mood patterns, and user engagement     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ [Last 7 Days]  [Last 30 Days ✓]  [Last 90 Days]                    │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │  Total   │ │  Unique  │ │   Avg    │ │   Avg    │               │
│ │ Entries  │ │  Users   │ │ Duration │ │  Words   │               │
│ │   150    │ │    42    │ │  5.2m    │ │   234    │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│ │ Completion % │ │    Emails    │ │    Emails    │                │
│ │              │ │    Queued    │ │     Sent     │                │
│ │    78.5%     │ │      12      │ │      98      │                │
│ └──────────────┘ └──────────────┘ └──────────────┘                │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 Mood Distribution                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ Happy  │  │Neutral │  │  Calm  │  │  Sad   │  │Anxious │       │
│  │   45   │  │   32   │  │   28   │  │   18   │  │   12   │       │
│  │entries │  │entries │  │entries │  │entries │  │entries │       │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘       │
│   (green)     (blue)      (teal)     (purple)    (orange)         │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ 📈 Daily Entries                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    5    8    6    12   9    7    11   10   8    6    4             │
│   ███  ███  ███  ███  ███  ███  ███  ███  ███  ███  ███            │
│   ███  ███  ███  ███  ███  ███  ███  ███  ███  ███  ███            │
│   ███  ███  ███  ███  ███  ███  ███  ███  ███  ███  ███            │
│   Jan  Jan  Jan  Jan  Jan  Jan  Jan  Jan  Jan  Jan  Jan            │
│   20   21   22   23   24   25   26   27   28   29   30             │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ 📝 Recent Entries                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Date       │ User           │ Mood      │ Words │ Duration          │
├────────────┼────────────────┼───────────┼───────┼──────────────────┤
│ 1/30/2024  │ User abc123... │ [Happy]   │ 245   │ 5.2m             │
│ 1/30/2024  │ User def456... │ [Calm]    │ 189   │ 4.8m             │
│ 1/29/2024  │ User ghi789... │ [Neutral] │ 312   │ 7.1m             │
│ 1/29/2024  │ User jkl012... │ [Sad]     │ 156   │ 3.5m             │
│ 1/28/2024  │ User mno345... │ [Happy]   │ 278   │ 6.2m             │
└────────────┴────────────────┴───────────┴───────┴──────────────────┘
```

## Responsive Behavior

### Desktop (lg: 1024px+)
- Stats grid: 4 columns for first row, 3 columns for second row
- Mood badges: Flex wrap with multiple badges per row
- Daily chart: Full width with all dates visible
- Table: Full width with all columns

### Tablet (md: 768px)
- Stats grid: 2 columns
- Mood badges: 2-3 badges per row
- Daily chart: Scrollable horizontally
- Table: Scrollable horizontally

### Mobile (sm: 640px)
- Stats grid: 1 column (stacked)
- Mood badges: 1-2 badges per row
- Daily chart: Scrollable horizontally
- Table: Scrollable horizontally
- Period buttons: Full width on mobile

## Color Theme

### Backgrounds
- Page: `#0a0a0f` (gray-950)
- Cards: `#111827` (gray-900)
- Hover: `rgba(31, 41, 55, 0.5)` (gray-800/50)

### Text
- Primary: `#ffffff` (white)
- Secondary: `#9ca3af` (gray-400)
- Error: `#f87171` (red-400)

### Stat Cards
- Blue: Border `#3b82f6`, Background `rgba(59, 130, 246, 0.1)`
- Green: Border `#22c55e`, Background `rgba(34, 197, 94, 0.1)`
- Purple: Border `#a855f7`, Background `rgba(168, 85, 247, 0.1)`

### Mood Badges
- Happy: Green (`#22c55e`)
- Excited: Yellow (`#eab308`)
- Neutral: Blue (`#3b82f6`)
- Calm: Teal (`#14b8a6`)
- Sad: Purple (`#a855f7`)
- Anxious: Orange (`#f97316`)
- Angry: Red (`#ef4444`)

## Interactive Elements

### Period Selector Buttons
- **Inactive**: Gray background, gray text, hover to lighter gray
- **Active**: Blue background, white text
- **Click**: Updates data, toggles active state

### Table Rows
- **Default**: Transparent background
- **Hover**: Gray-800/50 background
- **Border**: Gray-800 between rows

### Loading State
- Full screen centered "Loading..." text
- White text on gray-950 background

### Error State
- Red banner at top of content
- Red border, red/20 background
- Red-400 text with error message

## Data Flow

```
User Action → Period Button Click
              ↓
State Update → setSelectedPeriod(days)
              ↓
useEffect Trigger → fetchData(days)
              ↓
API Call → GET /api/admin/journal?days={days}
              ↓
Response → JSON data
              ↓
State Update → setData(result)
              ↓
UI Render → Updated stats, chart, table
```

## Empty States

### No Data
- **Daily Chart**: Section hidden (conditional render)
- **Mood Distribution**: "No mood data available" gray text
- **Recent Entries**: "No recent entries found" centered in table

### Loading
- Full page loading spinner/text
- Data persists during refetch (loading state only on initial load)

### Error
- Red error banner at top
- Previous data remains visible below (if available)
- Error message displayed: "Error: {message}"

---

**Access**: Requires admin/founder authentication  
**Route**: `/admin/journal`  
**Layout**: Wrapped by AdminLayout (sidebar + nav)  
**Status**: ✅ Production Ready
