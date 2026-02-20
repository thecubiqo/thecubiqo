# 15 Critical Questions - Quick Reference

**Date:** 2026-02-18  
**For:** @Pushpa @Mo @Jo  
**Status:** 🔴 AWAITING ANSWERS

---

## 🔴 BLOCKING (Answer Now)

1. **Topic Detection AI Model** (@Mo)
   - Which AI for topic detection to switch colors?
   - GPT-4, Claude, Gemini, custom, rule-based?

2. **CUBIQO Voice TTS** (@Mo)
   - Which Text-to-Speech engine?
   - ElevenLabs, Google, Amazon, Azure?

3. **Color Switch Time Threshold** (@Jo)
   - Min time between color switches?
   - 30s, 1min, 2min, dynamic?

4. **Matching Algorithm Weights** (@Mo + @Jo)
   - How to score capsule matches?
   - Color, intent, keyword weights?

5. **Geofence Default Radius** (@Jo)
   - Default location radius?
   - 5km, 10km, 25km, 50km?

---

## 🟡 DESIGN (Phase 1)

6. **Settings Cube Size** (@Jo)
   - Size relative to main CUBIQO?

7. **CQ Number Regeneration** (@Jo)
   - How often? Never, monthly, quarterly?

8. **Room Expiry Duration** (@Jo)
   - Unopened room lifetime? 7, 14, 30 days?

9. **Proactive Match Threshold** (@Jo)
   - What confidence = "high"? 80%, 90%, 95%?

10. **Color Switch Sensitivity** (@Jo)
    - User control? Toggle, slider, none?

---

## 🟢 TECHNICAL (Before Deploy)

11. **Video Call Tech** (@Mo)
    - WebRTC or 3rd-party? Which service?

12. **Analytics Retention** (@Mo + @Jo)
    - Keep data how long? 30, 90, 365 days?

13. **Capsule Update Frequency** (@Mo)
    - Real-time, batched, on-demand?

14. **Recommendation Ranking** (@Mo + @Jo)
    - Formula for ranking products?

15. **Affiliate Networks** (@Jo)
    - Which networks? Amazon, CJ, ShareASale?

---

## ❓ CLARIFICATIONS (3)

**A. Keywords When Color Locked** (@Jo)
- Extract all color keywords even when locked?

**B. Settings Voice vs Keyboard** (@Jo + @Mo)
- Voice-only or fallback keyboard?

**C. Proactive Toggle** (@Jo)
- Can users turn proactive on/off?

---

## Assignment Summary

**@Mo (7 questions):** 1, 2, 4, 11, 12, 13, 14  
**@Jo (11 items):** 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, A, B, C  
**@Pushpa:** Review & approve

---

## Impact

**BLOCKING questions:** Each = 2-3 days delay  
**Total time to answer:** ~2-3 hours  
**Next step:** Implement based on answers

---

**Full Context:** See QUESTIONS_FOR_TEAM.md (355 lines)
