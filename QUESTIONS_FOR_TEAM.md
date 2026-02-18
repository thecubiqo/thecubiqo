# Questions & Clarifications for CUBIQO Team

**For Review By:** @Pushpa (Lead QA), @Mo (CTO), @Jo (Product Owner)  
**Date:** 2026-02-18  
**Status:** 🔴 BLOCKING - Need answers to proceed with implementation

---

## 15 Critical Questions Identified During Testing

These questions arose while implementing the comprehensive functional test suite. Answers are needed to complete the actual implementation and execute tests against real systems.

---

## CRITICAL (Must Answer Before Implementation)

### 1. Topic Detection AI Model
**Question:** Which AI model should be used for topic detection to switch colors?

**Context:** The color/voice system needs to analyze conversation topics to determine if content is GREEN (work), YELLOW (casual), or RED (adult). This requires real-time topic classification.

**Options:**
- GPT-4 (OpenAI)
- Claude (Anthropic)
- Gemini (Google)
- Custom fine-tuned model
- Rule-based system

**Impact:** Core feature - affects all conversations
**Assigned to:** @Mo

---

### 2. CUBIQO Voice TTS Engine
**Question:** Which Text-to-Speech engine should be used for CUBIQO's voice?

**Context:** When users send voice messages via CQ-to-CQ, the receiver hears it in CUBIQO's voice (not the sender's voice). Need a consistent, high-quality TTS engine.

**Options:**
- ElevenLabs (best quality, expensive)
- Google Cloud TTS (good quality, mid-price)
- Amazon Polly (decent quality, cheap)
- Azure TTS (good quality, mid-price)
- Custom voice model

**Requirements:**
- Must sound natural
- Support for 3 different tones (professional GREEN, friendly YELLOW, discreet RED)
- Low latency (<500ms)
- Cost-effective at scale

**Impact:** Core CQ-to-CQ feature
**Assigned to:** @Mo

---

### 3. Color Switching Time Threshold
**Question:** What is the minimum time interval between color switches to prevent spiraling?

**Context:** Requirement states "color switching is time controlled and is not spiraling out of control." Need specific threshold.

**Proposed Values:**
- 30 seconds minimum?
- 1 minute minimum?
- 2 minutes minimum?
- Dynamic based on conversation flow?

**Example:** User talks about work (GREEN), then mentions weekend plans (YELLOW), then back to work (GREEN). How fast can these switches happen?

**Impact:** User experience - too strict = frustrating, too loose = confusing
**Assigned to:** @Jo

---

### 4. Matching Algorithm Weights
**Question:** What are the exact weights for the RGY matching algorithm?

**Context:** When matching users in RGY rooms, need to score similarity. What weights should be used?

**Proposed Formula:**
```
MatchScore = (ColorMatch * W1) + (IntentMatch * W2) + (KeywordSimilarity * W3)
```

**Questions:**
- W1 (Color Match): Must be 100% or no match at all?
- W2 (Intent Match): Must be 100% or no match at all?
- W3 (Keyword Similarity): What percentage is "good match"?

**Example:**
- User A: [green|collab|react,typescript,nextjs]
- User B: [green|collab|react,javascript,vue]
- Should this match? Score = ?

**Impact:** Core matching feature
**Assigned to:** @Mo + @Jo

---

### 5. Geofence Default Radius
**Question:** What is the default geofence radius for location-based matching?

**Context:** RED (dating) and some YELLOW (hangout) capsules require geofencing. Need default radius.

**Options:**
- 5km (very local, same neighborhood)
- 10km (local, same city area)
- 25km (metro area)
- 50km (regional)
- User configurable?

**Impact:** Match relevance
**Assigned to:** @Jo

---

## DESIGN DECISIONS

### 6. Settings Cube Size Ratio
**Question:** What is the exact size of Settings Cube relative to main CUBIQO?

**Context:** Requirement: "smaller than main CUBIQO landing screen – but big enough that the code on the side is visible"

**Need Specifics:**
- Main CUBIQO: 400px × 400px → Settings Cube: 200px × 200px?
- Or: Main = 100vw → Settings = 50vw?
- Or: Percentage-based ratio?

**Impact:** UI implementation
**Assigned to:** @Jo + Designer (Pushpa?)

---

### 7. CQ Number Regeneration Timing
**Question:** How often should CQ numbers regenerate for security?

**Context:** Requirement mentions "Time‑bound regeneration with notifications" as an "up-a-notch" feature.

**Options:**
- Never (static CQ number)
- Monthly
- Quarterly
- Annually
- User-triggered only

**Impact:** User experience (changing CQ number affects contacts)
**Assigned to:** @Jo

---

### 8. Room Expiry Duration
**Question:** How long should unopened RGY chat rooms persist before expiring?

**Context:** Requirement: "unopened capsule rooms expire automatically"

**Options:**
- 7 days
- 14 days
- 30 days
- Until user manually deletes

**Impact:** User experience & database storage
**Assigned to:** @Jo

---

### 9. Proactive Match Confidence Threshold
**Question:** What confidence score qualifies as "high probability" for proactive match suggestions?

**Context:** System should "PROACTIVELY SUGGEST" matches only when confidence is very high.

**Options:**
- >80% confidence?
- >85% confidence?
- >90% confidence?
- >95% confidence?

**Impact:** User trust (too many bad suggestions = spam)
**Assigned to:** @Jo

---

### 10. Color Switching Sensitivity Controls
**Question:** Should users be able to adjust how aggressively colors switch?

**Context:** Requirement mentions "Sensitivity controls for how aggressively colors switch."

**Implementation:**
- Simple toggle: High/Medium/Low?
- Slider: 1-10 scale?
- Not in Phase 1?

**Impact:** User control vs simplicity
**Assigned to:** @Jo

---

## TECHNICAL INTEGRATION

### 11. Video Call Technology
**Question:** WebRTC (self-hosted) or third-party service for audio/video in CQ-to-CQ?

**Context:** Requirement: "audio, video, file swap, screenshare" for CQ-to-CQ connections.

**Options:**
- WebRTC (self-hosted): More control, complex
- Twilio Video: Easy, expensive
- Agora: Mid-price, good quality
- Daily.co: Developer-friendly
- Whereby: Embed-ready

**Impact:** Development complexity & cost
**Assigned to:** @Mo

---

### 12. Analytics Retention Period
**Question:** How long should analytics events be retained?

**Context:** Need to balance insights vs privacy. No long-term profiling wanted.

**Options:**
- 30 days (minimal)
- 90 days (quarterly analysis)
- 1 year (annual trends)
- Forever (aggregated only)

**Impact:** Privacy compliance & insights depth
**Assigned to:** @Mo + @Jo

---

### 13. Capsule Update Frequency
**Question:** How often should user capsules update with new keywords from conversations?

**Context:** Requirement: "Capsules update dynamically as conversations and intents change."

**Options:**
- Real-time (after every message)
- Every 10 messages
- Daily batch update
- When user navigates to RGY chat (as stated in requirements)
- Hybrid approach?

**Impact:** Database load & match accuracy
**Assigned to:** @Mo

---

### 14. Recommendation Ranking Formula
**Question:** How should product recommendations be ranked?

**Context:** Multiple products may match conversation context. Need ranking logic.

**Factors:**
- Contextual relevance (%)
- Affiliate commission (%)
- Product rating (%)
- Price (lower = higher rank?)
- User past behavior (%)

**Impact:** Recommendation quality & revenue
**Assigned to:** @Mo + @Jo

---

### 15. Affiliate Network Integration
**Question:** Which affiliate networks should be integrated?

**Context:** Need actual product catalogs and affiliate links.

**Options:**
- Amazon Associates (huge catalog)
- CJ Affiliate (multi-merchant)
- ShareASale (diverse)
- Rakuten (cashback)
- Custom aggregator?

**Impact:** Product availability & commission rates
**Assigned to:** @Jo

---

## Questions About Requirements (Potential Contradictions)

### A. Keyword Storage When Color Locked
**Clarification Needed:** Requirements say "even if automatic color switch is disabled – the user keywords are still stored in our RGY pattern"

**Question:** Is this correct? If user locks to YELLOW but talks about work topics, do we still extract GREEN keywords?

**Our Understanding:** YES - keywords are always extracted regardless of color lock, because they're needed for RGY room matching.

**Confirm:** @Jo

---

### B. Settings Cube Voice vs Keyboard
**Contradiction Spotted:** Requirements say Settings Cube should be voice-only ("there should ideally be only way to chat with the settings cube- not keyboard for cubiqo")

**But:** How do users lock to a color if there's no keyboard? Voice command only? What if voice recognition fails?

**Propose:** Voice-primary with keyboard fallback for accessibility?

**Confirm:** @Jo + @Mo

---

### C. Proactive Match Opt-In
**Clarification Needed:** Requirements say users opt-in "Via side Panel and user also selects an intent"

**But also:** "proactive is proactive and should not have any toggles"

**Question:** Can users toggle proactive mode on/off, or is it always on once they create a capsule?

**Confirm:** @Jo

---

## Summary

### By Urgency
- **BLOCKING (must answer now):** Questions 1-5
- **DESIGN (Phase 1):** Questions 6-10
- **TECHNICAL (before deployment):** Questions 11-15
- **CLARIFICATIONS:** Questions A-C

### By Assignee
- **@Mo (CTO):** Questions 1, 2, 4, 11, 12, 13, 14
- **@Jo (Product):** Questions 3, 5, 6, 7, 8, 9, 10, 15, A, B, C
- **Both:** Questions 4, 12, 14

---

## How to Respond

**For Each Question, Please Provide:**
1. **Answer** (specific value/decision)
2. **Rationale** (why this choice)
3. **Phase** (Phase 1 MVP, Phase 2, or Later)

**Response Format:**
```markdown
### Q1: Topic Detection AI Model
**Answer:** GPT-4 Turbo
**Rationale:** Best accuracy for intent detection, worth the cost
**Phase:** Phase 1 MVP
**Implementation Notes:** Use streaming API for real-time
```

---

**Status:** 🔴 Awaiting responses  
**Next Steps:** Once answered → Implement → Test → Deploy  
**Timeline Impact:** Each unanswered question = ~2-3 days delay
