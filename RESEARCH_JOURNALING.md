# Journaling Feature - Research & Design

## Concept
A daily 15-minute guided conversation where CubiQo helps users reflect on:
- Where they're coming from (today's experiences)
- Where they're going (goals: today, short-term, long-term)
- RGY activities (Red/Yellow/Green context activities)
- Emotions, progress, challenges

## Industry Best Practices Research

### Successful Journaling Apps
**Day One:**
- Prompts appear contextually
- Save drafts automatically
- Export to PDF/email
- Review past entries easily

**Reflectly:**
- Conversational AI prompts
- Mood tracking integrated
- Daily reminder notifications
- Visual progress tracking

**Stoic:**
- Morning + Evening check-ins
- Guided questions change daily
- Review weekly summaries
- Focus on growth tracking

### Key Patterns
1. **Time-bounded:** 10-15 min sessions work best
2. **Guided but flexible:** Prompts help but don't restrict
3. **Progressive questions:** Start light, go deeper
4. **Visible progress:** Show streaks, insights over time
5. **Privacy first:** Users own their data
6. **Easy review:** Quick access to past entries

## Proposed Implementation

### Flow Design

**Entry Point:**
- Button/card on main screen: "Daily Journal" or "Reflect with CubiQo"
- Shows streak counter (e.g., "7-day streak 🔥")
- Best time: Evening (before bed) or morning

**Conversation Structure (15 min):**

```
Phase 1: Check-in (2-3 min)
- "How are you feeling right now?"
- "What's on your mind today?"

Phase 2: Looking Back (4-5 min)
- "What happened today that stood out?"
- "Did anything surprise you?"
- "What made you feel [emotion they mentioned]?"

Phase 3: RGY Context (3-4 min)
- "What color best represents today - Red, Yellow, or Green?"
- If Green: "What helped you grow today?"
- If Yellow: "What brought you joy or relaxation?"
- If Red: "What sparked your energy or passion?"

Phase 4: Looking Forward (4-5 min)
- "What's one thing you want to achieve tomorrow?"
- "Where do you see yourself in a month?"
- "What's your bigger vision - where are you heading?"

Phase 5: Closing (1-2 min)
- "Anything else you want to capture?"
- "Great session! I'll send this to your email."
```

### UI/UX Design

**On-Screen Editor:**
```
┌─────────────────────────────────────┐
│ Daily Journal - Feb 6, 2026         │
│ [📝] 15 min conversation             │
├─────────────────────────────────────┤
│                                     │
│ [Live conversation transcript]       │
│ Cubiqo: How are you feeling?        │
│ You: Pretty good, had a busy day... │
│                                     │
│ [Real-time updates as you talk]     │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Key Insights (Auto-generated) │    │
│ │ • Busy but productive         │    │
│ │ • Focus: Green (growth)       │    │
│ │ • Tomorrow goal: Finish report│    │
│ └─────────────────────────────┘    │
│                                     │
│ [✏️ Edit Entry]  [📧 Email Copy]   │
└─────────────────────────────────────┘
```

**Features:**
- **Live editing:** User can edit any part during/after
- **Auto-save:** Every 10 seconds
- **Markdown support:** Bold, bullets, etc.
- **Tags:** Auto-tags RGY colors, emotions, topics
- **Search:** Find past entries by keyword/date
- **Export:** Email after each session (auto + manual)

### Technical Architecture

**Database Schema:**
```typescript
JournalEntry {
  id: string
  userId: string
  date: Date
  duration: number // seconds
  transcript: string[] // conversation turns
  editedContent: string // user's final version
  insights: {
    mood: string
    rgyColor: 'red' | 'yellow' | 'green'
    keyTopics: string[]
    goals: {
      today: string[]
      shortTerm: string[]
      longTerm: string[]
    }
  }
  createdAt: Date
  updatedAt: Date
}
```

**API Endpoints:**
```
POST /api/journal/start - Begin session
POST /api/journal/save - Save draft (auto-save)
PATCH /api/journal/:id - Update entry
POST /api/journal/:id/email - Send email copy
GET /api/journal/entries - Get history
GET /api/journal/stats - Streaks, insights
```

### Email Format

**Subject:** "Your CubiQo Journal - Feb 6, 2026"

```
Hi [Name],

Here's your journal entry from today:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 February 6, 2026
⏱️ 14 minutes
🎨 Today's Color: Green (Growth)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR REFLECTION:

[Full edited transcript here...]

KEY INSIGHTS:
• Mood: Productive but tired
• Focus: Career growth
• Tomorrow's goal: Finish project report
• Long-term vision: Build sustainable habits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keep going! You're on a 7-day streak 🔥

Review past entries: cubiqo.ai/journal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All conversations are confidential.
CubiQo never retains user voice by policy.

© 2025 Cubiqo United Inc.
```

### Privacy & Security
- **Local first:** Draft stored locally until save
- **End-to-end option:** Encrypt entries
- **User owns data:** Can export all entries anytime
- **Optional sync:** Cloud backup opt-in
- **Email privacy:** User controls frequency

### Engagement Mechanics

**Daily Reminder:**
- Push notification: "Time for your daily reflection 🌙"
- Best time: 8 PM (customizable)

**Streaks:**
- Visual counter on dashboard
- Celebrate milestones (7, 30, 100 days)
- Gentle nudge if missed, no guilt

**Insights Dashboard:**
- Weekly summary: mood trends, RGY balance
- Monthly review: goals vs achievements
- Year in review: biggest moments, growth arc

**Gamification (subtle):**
- Badges: "Reflective Soul" (30 days), "Deep Thinker" (100 days)
- No points/leaderboards (keeps it personal)

## Staging Implementation Plan

### Phase 1: Core Experience
1. Conversational journal flow
2. Live transcript editor
3. Auto-save drafts
4. Email delivery

### Phase 2: Intelligence
1. AI-generated insights
2. Topic/emotion tagging
3. Goal tracking over time

### Phase 3: Review & Analytics
1. Search past entries
2. Mood/RGY trend charts
3. Weekly/monthly summaries

### Phase 4: Engagement
1. Streak tracking
2. Smart reminders
3. Export options (PDF, JSON)

## UX Considerations

**Emotional Safety:**
- Warm, non-judgmental tone
- No pressure to share deeply
- Can skip questions
- Pause/resume anytime

**Accessibility:**
- Voice input for journaling
- Screen reader friendly
- Dark mode optimized
- Large text option

**Time Respect:**
- 15 min timer visible
- Can end early if needed
- Quick mode (5 min) option

## Competitive Differentiation

Unlike other journaling apps:
1. **Conversational:** Feels like talking to a friend, not filling a form
2. **RGY Framework:** Unique color-based life categorization
3. **Goal-oriented:** Bridges reflection with action
4. **Voice-first:** Can journal by speaking naturally
5. **Integration:** Connects to Signal (matching based on journal insights)

## Success Metrics

- Daily active users (% doing journal)
- Average session duration (target: 12-15 min)
- Completion rate (% finishing conversation)
- Retention (7-day, 30-day streaks)
- Email open rate
- Entry edit frequency (shows engagement)

## Next Steps for Staging

1. **Design mockups** (Figma/wireframes)
2. **Build conversation flow** (15 questions)
3. **Create UI components** (editor, transcript)
4. **Set up email templates**
5. **Test with 10 beta users**
6. **Iterate based on feedback**

---

**Key Question for You:**
- Should journaling be voice-first (speak your thoughts) or text-first (type)?
- Do you want mood tracking integrated with emoji reactions?
- Should entries be private-only or optionally shareable (anonymously) to Signal?
