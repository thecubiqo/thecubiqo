# Daily Journal - User Flow Diagrams

**Created by:** JO (Product Owner)  
**Date:** 2026-02-15  
**Purpose:** Visual flows for Daily Journal feature completion

---

## Flow 1: New User → First Journal Entry

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRY POINT                              │
│                                                             │
│  User discovers journal via:                                │
│  • Main nav menu (📝 Daily Journal badge)                  │
│  • Chat page header link                                    │
│  • CTA in settings                                          │
│  • Marketing email                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              /JOURNAL LANDING (No Auth)                     │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │  📔 Daily Journal                             │         │
│  │  Your private space for guided reflection     │         │
│  │                                               │         │
│  │  • 8 powerful prompts                         │         │
│  │  • 15-20 minutes                              │         │
│  │  • Once per day                               │         │
│  │                                               │         │
│  │  [Preview Sample Prompts]                     │         │
│  │                                               │         │
│  │  ┌─────────────────────────────────────┐     │         │
│  │  │  Sign In to Start Journaling 🚀    │     │         │
│  │  └─────────────────────────────────────┘     │         │
│  │  New to CubiQo? Signing in creates account   │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    [User Clicks Sign In]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    /AUTH (Magic Link)                       │
│                                                             │
│  Enter email → Receive magic link → Verify → Redirect      │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   [User Now Authenticated]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               /JOURNAL (Authenticated, First Time)          │
│                                                             │
│  API Check: Can user journal today?                         │
│  ✅ YES → Show JournalFlow                                  │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Daily Journal  [Progress: 1/8]              │          │
│  │  ────────────────────────────────            │          │
│  │                                               │          │
│  │  Listen up. Before we dive deep, tell me...  │          │
│  │                                               │          │
│  │  How are you feeling right now?              │          │
│  │                                               │          │
│  │  ┌────────────────────────────────────────┐  │          │
│  │  │ [Textarea: User types response]        │  │          │
│  │  │                                        │  │          │
│  │  │                                        │  │          │
│  │  └────────────────────────────────────────┘  │          │
│  │                                               │          │
│  │  [< Previous]          [Next (1/8) >]        │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  [User Completes 8 Prompts]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            SAVE ENTRY (Backend Processing)                  │
│                                                             │
│  1. Calculate word count, duration                          │
│  2. Detect mood from responses                              │
│  3. Assign color state (RED/YELLOW/GREEN)                   │
│  4. Save to database                                        │
│  5. Queue email summary                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           /JOURNAL (Journal Gate - Entry Complete)          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  🎉 Journal Entry Complete!                  │          │
│  │                                               │          │
│  │  Today's Stats:                              │          │
│  │  • 543 words                                 │          │
│  │  • 18 minutes                                │          │
│  │  • Mood: Reflective 🤔                       │          │
│  │  • Color: GREEN (Growth) 🟢                  │          │
│  │                                               │          │
│  │  ──────────────────────────────────          │          │
│  │                                               │          │
│  │  Come back tomorrow for your next entry!     │          │
│  │  Next available: 8:00 AM (14h 32m)           │          │
│  │                                               │          │
│  │  ┌────────────────┐  ┌──────────────────┐   │          │
│  │  │ View History 📚│  │ See Insights 📊  │   │          │
│  │  └────────────────┘  └──────────────────┘   │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
            [User Clicks "View History"]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               /JOURNAL/HISTORY (First Entry)                │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Journal History  [Search...] 🔍             │          │
│  │                                               │          │
│  │  1 entry found                               │          │
│  │                                               │          │
│  │  ┌────────────────────────────────────────┐  │          │
│  │  │  📅 Feb 15, 2026 • 18 min • 543 words │  │          │
│  │  │  Mood: Reflective 🤔 • Green 🟢        │  │          │
│  │  │                                        │  │          │
│  │  │  "Listen up. Before we dive deep..."  │  │          │
│  │  │  (First 200 characters)                │  │          │
│  │  │                                        │  │          │
│  │  │  [Read More]  [Edit]  [Delete]        │  │          │
│  │  └────────────────────────────────────────┘  │          │
│  │                                               │          │
│  │  🎊 Great start! Keep the streak going!      │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Success Metrics:**
- 60%+ completion rate (start → finish 8 prompts)
- 40%+ click "View History" after first entry
- 35%+ return next day to journal again

---

## Flow 2: Returning User → View & Search History

```
┌─────────────────────────────────────────────────────────────┐
│         /JOURNAL (Returning User, Already Journaled)        │
│                                                             │
│  API Check: Can user journal today?                         │
│  ❌ NO → Show JournalGate                                   │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  📝 You've journaled today!                  │          │
│  │                                               │          │
│  │  🔥 7-Day Streak                             │          │
│  │  543 words • 18 minutes • Reflective 🤔      │          │
│  │                                               │          │
│  │  Come back tomorrow at 8:00 AM               │          │
│  │  ⏳ Next available in: 14h 32m               │          │
│  │                                               │          │
│  │  ┌────────────────┐  ┌──────────────────┐   │          │
│  │  │ View History 📚│  │ See Insights 📊  │   │          │
│  │  └────────────────┘  └──────────────────┘   │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
            [User Clicks "View History"]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            /JOURNAL/HISTORY (Multiple Entries)              │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Journal History  [Search...] 🔍  [Filter▼] │          │
│  │                                               │          │
│  │  Showing 24 entries                          │          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  📅 Feb 15, 2026 • 18 min • 543 words       │          │
│  │  Reflective 🤔 • Green 🟢                    │          │
│  │  "Today was a challenging day at work but..." │          │
│  │  [Read More]  [Edit]  [Delete]               │          │
│  │                                               │          │
│  │  📅 Feb 14, 2026 • 15 min • 421 words       │          │
│  │  Positive 😊 • Yellow 🟡                     │          │
│  │  "Had an amazing breakthrough on my project..."│         │
│  │  [Read More]  [Edit ⚠️ Expired]  [Delete]   │          │
│  │                                               │          │
│  │  📅 Feb 13, 2026 • 20 min • 678 words       │          │
│  │  Challenged 😰 • Red 🔴                      │          │
│  │  "Feeling stuck on my goals this week..."    │          │
│  │  [Read More]  [Edit ⚠️ Expired]  [Delete]   │          │
│  │                                               │          │
│  │  [Load More...]                              │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
              [User Types "anxiety" in Search]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         /JOURNAL/HISTORY?search=anxiety                     │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Journal History  [anxiety] 🔍  [Clear]      │          │
│  │                                               │          │
│  │  3 entries found matching "anxiety"          │          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  📅 Feb 13, 2026 • 20 min • 678 words       │          │
│  │  Challenged 😰 • Red 🔴                      │          │
│  │  "Feeling stuck... my **anxiety** about..."  │          │
│  │  [Read More]                                 │          │
│  │                                               │          │
│  │  📅 Feb 7, 2026 • 22 min • 712 words        │          │
│  │  Challenged 😰 • Orange 🟠                   │          │
│  │  "Work **anxiety** is back again today..."   │          │
│  │  [Read More]                                 │          │
│  │                                               │          │
│  │  📅 Jan 28, 2026 • 18 min • 534 words       │          │
│  │  Reflective 🤔 • Green 🟢                    │          │
│  │  "Learning to manage my **anxiety**..."      │          │
│  │  [Read More]                                 │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
         [User Clicks "Read More" on Feb 13 Entry]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              ENTRY DETAIL MODAL                             │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  📅 February 13, 2026                     [X]│          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  ⏱️ Duration: 20 minutes                     │          │
│  │  📝 Words: 678                               │          │
│  │  😰 Mood: Challenged                         │          │
│  │  🔴 Color: Red (Passion/Energy)              │          │
│  │                                               │          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  [Full journal entry content...]             │          │
│  │  "Feeling stuck on my goals this week.       │          │
│  │   My anxiety about work is making it hard    │          │
│  │   to focus. I keep procrastinating on..."    │          │
│  │                                               │          │
│  │  [Full 678 words displayed here...]          │          │
│  │                                               │          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  [✏️ Edit]   [🗑️ Delete]   [📧 Email Copy]  │          │
│  │   ⚠️ Edit expired (>24h old)                 │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
          [User Clicks "Edit" → Sees Upgrade Modal]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│             PREMIUM UPGRADE MODAL                           │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  ✨ Upgrade to Journal Pro                   │          │
│  │                                               │          │
│  │  Edit entries up to 7 days old               │          │
│  │  + Unlimited history                         │          │
│  │  + AI-generated insights                     │          │
│  │  + Export to PDF/JSON                        │          │
│  │  + Unlimited voice journaling                │          │
│  │                                               │          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  $9.99/month  or  $99/year (save $20)        │          │
│  │                                               │          │
│  │  ┌─────────────────────────────────────┐     │          │
│  │  │  Start 7-Day Free Trial 🚀         │     │          │
│  │  └─────────────────────────────────────┘     │          │
│  │  No credit card required                     │          │
│  │                                               │          │
│  │  [Maybe Later]                               │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Success Metrics:**
- 50%+ of users view history within 7 days
- 20%+ search at least once per month
- 5%+ click "Edit expired" → see premium modal (upsell opportunity)

---

## Flow 3: Free User → Premium Conversion

```
┌─────────────────────────────────────────────────────────────┐
│                  PREMIUM TRIGGER POINTS                     │
│                                                             │
│  User encounters premium feature gate:                      │
│  1. Export button (PDF/JSON)                                │
│  2. Edit entry > 24 hours old                               │
│  3. View history > 30 days                                  │
│  4. AI insights tab                                         │
│  5. Unlimited voice journaling                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
           [User Clicks Any Premium Feature]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│             PREMIUM UPGRADE MODAL (Detailed)                │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  ✨ Unlock Journal Pro                    [X]│          │
│  │                                               │          │
│  │  You're using: Journal Starter (Free)        │          │
│  │  Upgrade to: Journal Pro                     │          │
│  │                                               │          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  What you get:                               │          │
│  │                                               │          │
│  │  ✅ Unlimited history (free = 30 days)       │          │
│  │  ✅ AI weekly insights (GPT-4 powered)       │          │
│  │  ✅ Export to PDF, JSON, Markdown            │          │
│  │  ✅ Edit entries up to 7 days                │          │
│  │  ✅ Unlimited voice journaling               │          │
│  │  ✅ Priority support                         │          │
│  │  ✅ Early access to new features             │          │
│  │                                               │          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  Choose your plan:                           │          │
│  │                                               │          │
│  │  ⚪ Monthly: $9.99/month                     │          │
│  │  ⚫ Annual: $99/year (save $20, 17% off) ⭐  │          │
│  │                                               │          │
│  │  ┌─────────────────────────────────────┐     │          │
│  │  │  Start 7-Day Free Trial 🚀         │     │          │
│  │  └─────────────────────────────────────┘     │          │
│  │                                               │          │
│  │  💳 No credit card required                  │          │
│  │  ✅ Cancel anytime                           │          │
│  │  🔒 Secure payment via Stripe                │          │
│  │                                               │          │
│  │  [Maybe Later]                               │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
           [User Clicks "Start Free Trial"]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               PREMIUM ONBOARDING FLOW                       │
│                                                             │
│  Step 1: Email confirmation (already have from auth)        │
│  Step 2: Choose plan (monthly vs. annual)                   │
│  Step 3: Payment info (Stripe checkout)                     │
│  Step 4: Confirmation & welcome                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            STRIPE CHECKOUT (Embedded or Redirect)           │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Complete Your Upgrade                       │          │
│  │                                               │          │
│  │  Journal Pro • Annual ($99/year)             │          │
│  │                                               │          │
│  │  Card Information:                           │          │
│  │  [4242 4242 4242 4242]                       │          │
│  │  [MM/YY]  [CVC]  [ZIP]                       │          │
│  │                                               │          │
│  │  📧 Email: user@example.com                  │          │
│  │                                               │          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  Trial Period: 7 days free                   │          │
│  │  First charge: Feb 22, 2026 ($99)            │          │
│  │  Next charge: Feb 22, 2027 ($99)             │          │
│  │                                               │          │
│  │  ┌─────────────────────────────────────┐     │          │
│  │  │  Subscribe to Journal Pro          │     │          │
│  │  └─────────────────────────────────────┘     │          │
│  │                                               │          │
│  │  🔒 Powered by Stripe • Secure Payment       │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  [Payment Successful]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               PREMIUM WELCOME SCREEN                        │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  🎉 Welcome to Journal Pro!                  │          │
│  │                                               │          │
│  │  Your trial has started!                     │          │
│  │  Explore all premium features now.           │          │
│  │                                               │          │
│  │  ✅ Unlimited history unlocked               │          │
│  │  ✅ Export to PDF enabled                    │          │
│  │  ✅ AI insights available                    │          │
│  │  ✅ Edit entries up to 7 days                │          │
│  │                                               │          │
│  │  💡 Tips:                                    │          │
│  │  • Try exporting your first PDF              │          │
│  │  • Check AI insights tab for weekly summary  │          │
│  │  • Edit your recent entries                  │          │
│  │                                               │          │
│  │  ┌─────────────────────────────────────┐     │          │
│  │  │  Start Exploring 🚀                │     │          │
│  │  └─────────────────────────────────────┘     │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
          [User Returned to Original Feature]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│      FEATURE NOW WORKS (e.g., Edit Old Entry)               │
│                                                             │
│  ✅ Premium active → Edit button enabled                    │
│  ✅ User can now edit entry from Feb 13                     │
│  ✅ Export button downloads PDF                             │
│  ✅ AI insights tab shows weekly summary                    │
└─────────────────────────────────────────────────────────────┘
```

**Success Metrics:**
- 5-8% free → paid conversion rate
- 70%+ trial → paid conversion rate (after 7 days)
- 80% choose annual plan (higher LTV)
- < 10% monthly churn rate

---

## Flow 4: Premium User → AI Insights

```
┌─────────────────────────────────────────────────────────────┐
│           /JOURNAL/INSIGHTS (Premium Feature)               │
│                                                             │
│  ✨ Premium badge visible in nav                            │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Journal Insights  [Last 30 Days ▼]         │          │
│  │                                               │          │
│  │  ───────────────────────────────────────     │          │
│  │  📊 Your Journey at a Glance                 │          │
│  │  ───────────────────────────────────────     │          │
│  │                                               │          │
│  │  🔥 Streaks                                  │          │
│  │  ┌─────────────┬─────────────┬──────────┐   │          │
│  │  │ Current: 14 │ Longest: 23 │ Total: 67│   │          │
│  │  └─────────────┴─────────────┴──────────┘   │          │
│  │                                               │          │
│  │  😊 Mood Trends (Last 30 Days)               │          │
│  │  ┌────────────────────────────────────────┐  │          │
│  │  │     [Interactive Line Chart]           │  │          │
│  │  │  😊 Positive      ──────╱╲────╱╲──     │  │          │
│  │  │  🤔 Reflective    ─────╱──╲─╱───╲─     │  │          │
│  │  │  😰 Challenged    ────────╱╲─────╲─    │  │          │
│  │  │  😐 Neutral       ─────────────────     │  │          │
│  │  └────────────────────────────────────────┘  │          │
│  │                                               │          │
│  │  🎨 Color Distribution                       │          │
│  │  ┌────────────────────────────────────────┐  │          │
│  │  │     [Pie Chart]                        │  │          │
│  │  │  🔴 Red (Passion): 35%                 │  │          │
│  │  │  🟡 Yellow (Energy): 28%               │  │          │
│  │  │  🟢 Green (Growth): 37%                │  │          │
│  │  └────────────────────────────────────────┘  │          │
│  │                                               │          │
│  │  💭 AI-Generated Insights                    │          │
│  │  ┌────────────────────────────────────────┐  │          │
│  │  │  "This week, you journaled about work  │  │          │
│  │  │   anxiety 3 times. Pattern detected:   │  │          │
│  │  │   Most stress on Mondays/Wednesdays.   │  │          │
│  │  │                                        │  │          │
│  │  │   Suggestion: Try morning meditation   │  │          │
│  │  │   before work on these days."          │  │          │
│  │  │                                        │  │          │
│  │  │   [Read Full Analysis]                │  │          │
│  │  └────────────────────────────────────────┘  │          │
│  │                                               │          │
│  │  📈 Goal Tracking                            │          │
│  │  ┌────────────────────────────────────────┐  │          │
│  │  │  Tomorrow's Goals (from entries):      │  │          │
│  │  │  ✅ Finish project report (achieved)   │  │          │
│  │  │  ✅ Exercise 30 min (achieved)         │  │          │
│  │  │  ❌ Read 20 pages (not mentioned)      │  │          │
│  │  │                                        │  │          │
│  │  │  Achievement Rate: 67%                │  │          │
│  │  └────────────────────────────────────────┘  │          │
│  │                                               │          │
│  │  ┌─────────────────────────────────────┐     │          │
│  │  │  📧 Email Weekly Summary            │     │          │
│  │  └─────────────────────────────────────┘     │          │
│  │                                               │          │
│  │  ┌─────────────────────────────────────┐     │          │
│  │  │  📊 Export Insights (PNG)           │     │          │
│  │  └─────────────────────────────────────┘     │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Success Metrics:**
- 80%+ of premium users view insights at least once per week
- 50%+ enable weekly email summary
- 30%+ export insights as PNG at least once

---

## Flow 5: Quick Journal Mode (Phase 2)

```
┌─────────────────────────────────────────────────────────────┐
│            /JOURNAL (User on Busy Day)                      │
│                                                             │
│  API Check: Can user journal today?                         │
│  ✅ YES → Show mode selector                                │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Daily Journal                               │          │
│  │                                               │          │
│  │  How much time do you have today?            │          │
│  │                                               │          │
│  │  ┌────────────────┐  ┌──────────────────┐   │          │
│  │  │ Quick (2 min)  │  │ Full (15-20 min) │   │          │
│  │  │ 2 prompts      │  │ 8 prompts        │   │          │
│  │  └────────────────┘  └──────────────────┘   │          │
│  │                                               │          │
│  │  Both modes count toward your streak! 🔥     │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
              [User Clicks "Quick (2 min)"]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          QUICK JOURNAL FLOW (2 Prompts)                     │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Quick Journal  [Progress: 1/2] ⚡            │          │
│  │  ──────                                       │          │
│  │                                               │          │
│  │  How are you feeling right now?              │          │
│  │                                               │          │
│  │  ┌────────────────────────────────────────┐  │          │
│  │  │ [Textarea: 1-2 sentences]             │  │          │
│  │  └────────────────────────────────────────┘  │          │
│  │                                               │          │
│  │  [Next (1/2) >]                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ↓ User completes Prompt 1                                 │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Quick Journal  [Progress: 2/2] ⚡            │          │
│  │  ────────────                                 │          │
│  │                                               │          │
│  │  What's one thing you want to capture?       │          │
│  │  (Optional)                                  │          │
│  │                                               │          │
│  │  ┌────────────────────────────────────────┐  │          │
│  │  │ [Textarea: Optional note]              │  │          │
│  │  └────────────────────────────────────────┘  │          │
│  │                                               │          │
│  │  [< Previous]  [Finish ✓]                    │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    [Entry Saved]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         QUICK JOURNAL COMPLETE                              │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  ⚡ Quick journal saved!                      │          │
│  │                                               │          │
│  │  • 47 words • 2 minutes                      │          │
│  │  • Streak maintained: 15 days 🔥             │          │
│  │                                               │          │
│  │  Come back tomorrow for another entry!       │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Success Metrics:**
- 30%+ of users choose Quick Mode at least once per month
- Quick Mode has 80%+ completion rate (vs. 60% for Full Mode)
- Quick Mode users have 15% higher Day 30 retention (flexibility = habit)

---

## Decision Points Summary

### When to Show Premium Modal?
1. User clicks "Export" button
2. User clicks "Edit" on entry > 24 hours old
3. User tries to view entry > 30 days old
4. User clicks "AI Insights" tab
5. User exceeds 10 voice entries in free tier

### When to Show Quick vs. Full Mode?
1. User hasn't journaled today → Show mode selector
2. User has < 5 minutes → Recommend Quick Mode
3. User is on mobile → Default to Quick Mode (faster)
4. User is on desktop → Default to Full Mode (better UX)

### When to Send Weekly Email Summary?
1. User has 5+ entries in past 7 days
2. User is premium subscriber
3. User hasn't opted out of emails
4. Send every Sunday at 8 PM (user's timezone)

---

## Mobile vs. Desktop Flows

### Mobile-Specific Changes:
1. **Swipe gestures** - Swipe entry cards to delete
2. **Full-screen modals** - No overlays, full-screen entry details
3. **Voice-first** - Default to 🎤 voice mode (faster than typing on phone)
4. **Quick Mode default** - Most mobile journaling is on-the-go
5. **Persistent "Journal Now" FAB** - Floating action button on main screen

### Desktop-Specific Features:
1. **Keyboard shortcuts** - Cmd+K search, Cmd+J new journal
2. **Split view** - History list on left, entry detail on right
3. **Rich text editor** - Bold, italics, lists (desktop typing is easier)
4. **Export options** - Drag-and-drop to download PDF

---

**End of User Flow Documentation** 🎯

Questions? Need clarification? Hit me up: jo@cubiqo.ai
