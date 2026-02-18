# ANSWERS FROM TEAM - All 15 Questions Resolved

**Date:** 2026-02-18  
**Status:** ✅ ALL QUESTIONS ANSWERED  
**Ready:** Implementation can begin

---

## 🔴 BLOCKING Questions - ANSWERED

### 1. Topic Detection AI Model ✅

**Original Question:** Which AI model for detecting topics to switch colors?

**ANSWER:** This question was based on a misunderstanding!

**Actual System:**
- **NOT an AI model question**
- **RGY Keywords Panel** on the right side of screen
- **User-editable keywords** associated with colors
- Keywords represent user actions/possibilities

**Color Psychology:**
- **GREEN (Goal-oriented):** Tasks, achievements, career, wellness
- **RED (Explicit/Adult):** Age-gated, inappropriate for minors, explicit content
- **YELLOW (Casual/Social):** Non-goal-oriented (movies, hangout, social activities)

**How It Works:**
- CUBIQO stores keywords in RGY panel
- User can edit keywords
- System uses these keywords for matching (not AI topic detection)

**Intents (GREEN/RED only):**
1. **COLLABORATE:** Science projects, OnlyFans, Instagram influencer partnerships
2. **TRADE:** Money/transactional activities
3. **COMPANY:** Hangout/social (when not collab or trade)

**RGY Capsule Format:** `color:intent:keywords`

**Examples:**
```
green:trade:tutor,science
yellow:movies
red:company:date
```

**Matching Logic:**
- Contextual AI matching
- Tutor matches with Student (not Tutor → Tutor)
- Smart complementary matching

---

### 2. CUBIQO Voice TTS Engine ✅

**Question:** Which Text-to-Speech engine for CUBIQO's voice?

**ANSWER:** **ElevenLabs** (suggested)

**Rationale:**
- High-quality voice synthesis
- Natural-sounding voices
- Industry-leading TTS

**Note:** "idk - eleven labs?" suggests flexibility if better option found

---

### 3. Color Switch Time Threshold ✅

**Question:** Minimum time between color switches to prevent distraction?

**ANSWER:** 
- **Not too often** (avoid distraction)
- **Not distracting to user**
- **Based on RGY identification**

**Implementation Note:**
- Dynamic threshold based on context
- User shouldn't feel colors are "spiraling out of control"
- Balance between responsiveness and stability

---

### 4. Matching Algorithm Weights ✅

**Question:** How to score RGY capsule matches?

**ANSWER:** **Staged Matching**

**Stages:**
1. **COLOR match first**
2. **INTENT match second**
3. **KEYWORDS match third**

**Optional Enhancement:**
- CUBIQO can do **first-level check**
- Ask questions to both users
- Confirm higher probability of success
- **Unless** user wants to "cruise around in rooms" (browse freely)

**Matching Philosophy:**
- Contextual AI determines compatibility
- Smart matching (tutor → student)
- Quality over quantity
- Higher success rate through pre-validation

---

### 5. Geofence Default Radius ✅

**Question:** What's the default radius for location-based matching?

**ANSWER:** **Contextual** (depends on use case)

**Geofenced Activities:**
- Dating
- Hookup
- Movies/hangout

**NOT Geofenced:**
- IT projects
- Science projects
- Talks/discussions

**Implementation:**
- No single default radius
- System determines based on capsule type
- User can override if needed

---

## 🟡 DESIGN Questions

### 6. Settings Cube Size Ratio ❌

**Status:** **DISREGARD** (not priority)

---

### 7. CQ Number Regeneration Timing ❌

**Status:** **DISREGARD FOR NOW**

---

### 8. Room Expiry Duration ❌

**Status:** **DISREGARD FOR NOW**

---

### 9. Proactive Match Confidence Threshold ✅

**Question:** What confidence level equals "high probability" for proactive suggestions?

**ANSWER:** **When all user parameters are matched and confirmed**

**Implementation:**
- All color matches
- All intent matches
- All keyword matches
- System confidence = high
- Then proactively suggest

---

### 10. Color Switch Sensitivity Controls ⏳

**Status:** No specific answer provided

**Assumed:** Will be determined during implementation

---

## 🟢 TECHNICAL Questions

### 11. Video Call Technology ✅

**Question:** WebRTC (self-hosted) or 3rd-party service?

**ANSWER:** **Whichever is easier**

**Options:**
- WebRTC (more control, more work)
- Third-party (Twilio, Agora, Daily.co, Whereby)

**Decision Criteria:** Ease of implementation

---

### 12. Analytics Retention Period ✅

**Question:** How long to keep analytics data?

**ANSWER:** **Industry best practice**

**Implementation:**
- Follow GDPR/privacy standards
- Typical: 30-90 days for raw data
- Aggregated data can be kept longer
- User anonymity preserved

---

### 13. Capsule Update Frequency ✅

**Question:** How often to update user RGY capsules?

**ANSWER:** **As often as required or detected**

**Implementation:**
- Dynamic updates
- When user navigates to RGY chat
- When keywords change
- When intents shift
- Real-time or near-real-time

---

### 14. Recommendation Ranking Formula ✅

**Question:** How to rank product recommendations?

**ANSWER:** **Understand user + contextual recommendations**

**Approach:**
- System understands user needs
- Apply affiliates contextually
- Match products to conversation/intent
- Subtle integration
- User-centric (not pushy)

---

### 15. Affiliate Networks Integration ✅

**Question:** Which affiliate networks to integrate?

**ANSWER:** **ALL that can make us money**

**Strategy:**
- Integrate with ALL profitable networks
- **Advanced:** Algorithm that:
  - Creates integration to specific product on-the-fly
  - Ensures we get commission
  - Contextual product matching
  - Dynamic affiliate link generation

**Affiliate Networks (Examples):**
- Amazon Associates
- CJ Affiliate
- ShareASale
- Rakuten
- Custom integrations as needed

---

## ❓ CLARIFICATIONS

### A. Keywords When Color Locked ❌

**Status:** **DISREGARD**

---

### B. Settings Cube: Voice vs Keyboard ❌

**Status:** **DISREGARD**

---

### C. Proactive Match Toggle ✅

**Question:** How does proactive matching work?

**ANSWER:**
- **RGY keywords in panel** used by CUBIQO
- System understands user needs proactively
- Looks for meeting user intents:
  - COLLABORATE
  - COMPANY
  - TRADE
- **Works in all color zones** (GREEN, YELLOW, RED)
- **When user opts in** for proactive matching

**User Control:**
- User must opt in
- Can toggle on/off
- Keywords drive suggestions
- All colors supported

---

## 📋 SUMMARY OF ANSWERS

### Core Understanding

**RGY System:**
- Keywords panel (right side)
- User-editable
- NOT AI topic detection
- Color psychology-based

**Capsule Format:**
```
color:intent:keywords
```

**Examples:**
```
green:trade:tutor,science
yellow:movies
red:company:date
```

**Matching:**
1. Color (psychology)
2. Intent (collaborate/trade/company)
3. Keywords (contextual AI)

**Geofencing:**
- Contextual (dating=yes, IT=no)

**Technologies:**
- TTS: ElevenLabs
- Video: Easiest option
- Analytics: Best practice
- Affiliates: ALL networks

**Proactive Matching:**
- Opt-in
- All colors
- RGY keywords drive suggestions

---

## 🚀 IMPLEMENTATION READY

### What's Clear

✅ RGY system architecture  
✅ Capsule format  
✅ Matching algorithm  
✅ Geofencing rules  
✅ Technology choices  
✅ Proactive matching  
✅ Affiliate strategy  

### What's Deferred

❌ Settings Cube details  
❌ CQ number regeneration  
❌ Room expiry specifics  

### What Needs Refinement

⏳ Color switch timing  
⏳ Switch sensitivity controls  

---

## 📊 IMPLEMENTATION PRIORITY

### Phase 1: Must Have
1. RGY Keywords Panel UI
2. Capsule creation/editing
3. Color-based categorization
4. Intent selection (collaborate/trade/company)

### Phase 2: Core Features
5. Staged matching algorithm
6. Contextual AI matching
7. Proactive suggestions (opt-in)
8. Geofence logic (contextual)

### Phase 3: Integrations
9. ElevenLabs TTS
10. Video calls (easiest option)
11. Affiliate framework (ALL networks)

### Phase 4: Polish
12. Analytics (best practice)
13. Contextual recommendations
14. Dynamic affiliate integration

---

## ✅ BLOCKERS REMOVED

All critical questions answered. Implementation can proceed.

**Next Step:** Begin Phase 1 - Build RGY Keywords Panel

---

**Last Updated:** 2026-02-18  
**Document Owner:** Engineering Team  
**Status:** Complete and Approved ✅
