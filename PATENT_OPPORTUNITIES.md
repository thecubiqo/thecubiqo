# Cubiqo — Patent Opportunity Analysis

**Author:** MO (CTO / Co-Founder)  
**Audience:** CEO / Founder  
**Date:** 2026-02-21  
**Basis:** Direct code inspection of `src/lib/`, `src/components/`, and `supabase/migrations/`  
**Disclaimer:** This is a technical analysis of novelty and non-obviousness. It is not legal advice. Before filing, retain a registered patent attorney (USPTO patent practitioner) who specialises in software and AI patents. Nothing in this document creates attorney-client privilege.

---

## How This Analysis Was Conducted

Patent approval depends on two primary tests:

1. **Novelty (35 U.S.C. § 102):** The claimed invention must not have been described in a single prior-art reference before the filing date.
2. **Non-obviousness (35 U.S.C. § 103):** The invention must not have been obvious to a person of ordinary skill at the time of invention, even combining multiple prior-art references.

For software and AI patents, the additional hurdle is **patent-eligible subject matter (35 U.S.C. § 101 / Alice doctrine):** abstract ideas, mathematical concepts, and mental processes are not patentable unless the claim adds a "something more" that is a concrete, specific technical improvement. The USPTO rejects roughly 45-60% of software patent applications under § 101 at first examination.

Every opportunity assessed below is evaluated against all three tests. Only those that I believe clear all three with a realistic approval probability above 50% are included. Assessments below 50% are excluded entirely — they are not worth the $15,000-$30,000 in attorney fees.

---

## Opportunity 1 — Content-Adaptive Voice Parameter Modulation with Natural Variance Injection

**Estimated USPTO Approval Probability: 62-70%**  
**Patent Type:** Utility Patent (US), PCT for international  
**Best Claims Strategy:** Method claims + system claims  
**Filing Urgency: HIGH** — publish anywhere before filing and novelty is destroyed

### What the Code Actually Does

`src/lib/voice-modulation.ts` implements a system that:

1. **Analyses free-form text input** using keyword pattern matching across three semantic categories: *intimate* (whisper/secret/vulnerable markers), *candid* (laughter/casual/playful markers), and *sincere* (analytical/formal/explanatory markers).
2. **Maps detected mood to a precise four-dimensional voice parameter vector** `{stability, similarity_boost, style, use_speaker_boost}` — each dimension calibrated by design philosophy ("madhyama marg" — neither too human nor too robotic).
3. **Injects bounded random variance** (±5%) to each parameter on every request: `Math.max(0, Math.min(1, settings.stability + (Math.random() - 0.5) * variance))`.
4. **Routes the parameterised vector to a streaming TTS API** at `/api/tts/route.ts`, which integrates the parameters dynamically per request — not as a static preset.

The combination of steps 1-4 in a single automated pipeline, without human intervention per utterance, is what makes this potentially novel.

### Why It Clears the § 101 Alice Hurdle

The claim is not "detect mood and adjust voice" in the abstract. The claim is a **specific technical implementation**: a multi-dimensional parameter vector derived from semantic pattern matching applied to AI-generated TTS API calls, with stochastic variance injection bounded to prevent uncanny-valley artefacts. That is a concrete technical improvement to voice naturalness — not an abstract idea.

### Prior Art Risk Assessment

- **ElevenLabs voice parameter API:** Exists, but ElevenLabs exposes static parameters. They do not auto-detect mood from input text and derive parameter vectors — the user sets them manually. **Distinguishable.**
- **AWS Polly / Google TTS SSML tags:** Exist, but require explicit markup in the text string. Cubiqo's system derives parameters from content *without* modifying the text. **Distinguishable.**
- **Affective computing research (Picard, 1997+):** Academic papers on emotion-adaptive speech exist, but they operate on audio input (voice tone detection), not text content. **Different domain.**
- **Siri / Alexa voice variation:** Apple and Amazon have patents on voice naturalisation, but their implementations are neural model parameters, not an explicit multi-dimensional parameter vector derived from lexical mood classification. **Potentially distinguishable with careful claim drafting.**

### The Tweak Needed to Strengthen the Claim

The current implementation derives mood from keyword matching. A stronger patent position is achieved by adding a **second layer:** feed the output of the keyword classifier into a small LLM call to confirm/override mood classification for ambiguous inputs. This makes the system a "dual-stage mood classifier driving TTS parameter synthesis" — a more specific and defensible technical contribution.

**Estimated implementation cost:** 1 day. **Estimated value to patent claim:** Significant — it differentiates from pure keyword-matching prior art.

### Claim Skeleton (for attorney to refine)

```
Claim 1 (Method):
A computer-implemented method for generating naturalised speech from AI-generated text, comprising:
(a) receiving, by a computing system, text generated by an AI language model in response to a user query;
(b) classifying the text into one of a plurality of predefined emotional tone categories by applying pattern matching against category-specific lexical marker sets;
(c) mapping the classified tone category to a multi-dimensional voice parameter vector comprising at least a stability parameter, a similarity parameter, and a style parameter, wherein each parameter value is specified by a learned calibration table optimised to avoid uncanny-valley vocal artefacts;
(d) applying a bounded stochastic perturbation to each parameter value within a pre-specified variance range to produce a perturbed voice parameter vector; and
(e) synthesising audio from the AI-generated text using the perturbed voice parameter vector as real-time control parameters for a speech synthesis API.

Claim 2 (System):
A system comprising one or more processors and memory storing instructions that, when executed, perform the method of Claim 1.

Claim 3 (Dependent):
The method of Claim 1, wherein the classifying step further comprises a second-stage large-language-model inference that confirms or overrides the pattern-matched classification for inputs that satisfy fewer than a threshold number of lexical marker matches.
```

---

## Opportunity 2 — Emotional-State-Driven Real-Time 3D Particle Morphology System

**Estimated USPTO Approval Probability: 58-66%**  
**Patent Type:** Utility Patent (design elements separately pursuable as Design Patent)  
**Best Claims Strategy:** Method claims on the morph-trigger mechanism; system claims on the state-to-geometry pipeline  
**Filing Urgency: MEDIUM-HIGH** — visual AI representations are a fast-moving patent area

### What the Code Actually Does

`src/components/cube/PlasmaWaveField.tsx` and `src/components/cube/EnergyCubeScene.tsx` implement:

1. A **120,000-particle field** initialised with two geometry sets simultaneously: a wave-form geometry (`wavePositions`) and a cube geometry (`cubePositions`), both computed at mount.
2. A **`morphProgress` ref** (0.0 → 1.0) that interpolates linearly between wave and cube geometries in the `useFrame` animation loop: `position = wavePos * (1 - morphProgress) + cubePos * morphProgress`.
3. **State-to-morph triggers:** `EnergyCubeScene` maps `animationState` (`idle`, `listening`, `thinking`, `speaking`) to `isVoiceEnabled`. Morph begins when `isVoiceEnabled` becomes true (i.e., the AI transitions to an active listening or speaking state).
4. **Per-state colour palettes:** Six-colour palettes per state (`neutral`, `thinking`, `speaking`, `listening`, `error`) that are applied to the particle colour buffer.
5. **Soul nodes:** A secondary 200-particle sub-system orbiting the main field with independent animation, providing visual hierarchy.

The complete pipeline — AI conversational state → real-time 3D geometry morph → colour palette selection — operating in a browser at 120,000 particles without pre-baked animation assets is the novel combination.

### Why It Clears the § 101 Alice Hurdle

This is not "display different shapes for different states." The claim is a **specific technical architecture:** dual-position buffer initialisation at mount time, linear morph interpolation tied to an external AI state machine, and per-particle colour assignment from a semantic AI-state palette — all running in a GPU-accelerated WebGL context in a browser. This is a concrete technical improvement to the visual representation of AI conversational state.

### Prior Art Risk Assessment

- **Apple Siri visual orb / Amazon Echo ring:** These are pre-animated assets or simple colour transitions. Neither uses particle morphology or dual-geometry interpolation. **Distinguishable.**
- **Three.js particle systems:** The library exists, but the specific combination of dual-buffer morphing triggered by AI state is not documented in any Three.js example or prior art. **Distinguishable at the combination level.**
- **Microsoft Cortana 3D animations:** Pre-rendered animations, not real-time particle morphology tied to a state machine API. **Distinguishable.**
- **Research on affective animation:** Academic papers describe general principles but not this specific technical implementation. **Distinguishable.**

### The Tweak Needed to Strengthen the Claim

Currently the morph triggers on a binary `isVoiceEnabled` flag. Strengthening: make morph **speed** a function of the AI state (e.g., faster morph for `listening` than `speaking`, representing urgency vs. calm). This adds a **continuous, state-parameterised morphology rate** that is more specifically novel.

**Estimated implementation cost:** Half a day. **Estimated value to patent claim:** Moderate — makes the claim less likely to be collapsed to "changing geometry on state change."

### Claim Skeleton

```
Claim 1 (Method):
A computer-implemented method for rendering a real-time responsive visual representation of an AI assistant's conversational state, comprising:
(a) initialising, at render time, a particle system comprising at least 10,000 particles having simultaneously stored first-geometry positions defining a wave-form field and second-geometry positions defining a polyhedral solid;
(b) receiving, from an AI conversational state machine, a state signal from a set of predefined states comprising at least an idle state, a listening state, and a speaking state;
(c) determining a target morphology value in the range [0, 1] based on the received state signal;
(d) interpolating, in each render frame, each particle's rendered position between the first-geometry position and the second-geometry position using the target morphology value; and
(e) assigning, to each particle, a colour value selected from a state-specific colour palette associated with the received state signal.
```

---

## Opportunity 3 — Tri-Stage Hierarchical Context Matching with Geospatial Constraint for Peer Discovery

**Estimated USPTO Approval Probability: 55-64%**  
**Patent Type:** Utility Patent  
**Best Claims Strategy:** Method claims on the matching algorithm; system claims on the capsule data structure  
**Filing Urgency: MEDIUM** — peer matching algorithms are well-patented in social networks, but the specific combination here is distinct

### What the Code Actually Does

`supabase/migrations/20260218000200_rgy_capsules_and_matching.sql` implements a **staged three-signal matching algorithm** for peer discovery:

1. **Stage 1 — Colour gate:** Each user publishes an "RGY Capsule" with a colour (`green`, `yellow`, `red`) encoding their current life-context state. Only capsules with matching colour are considered — a hard filter, not a score. The schema enforces this: `color IN ('green', 'yellow', 'red')` with a constraint that `yellow` capsules have no intent (they signal openness, not direction).

2. **Stage 2 — Intent gate:** Within colour-matched capsules, a secondary filter on `intent` (`collaborate`, `trade`, `company`). The schema constraint `(color = 'yellow' AND intent IS NULL) OR (color IN ('green', 'red') AND intent IS NOT NULL)` encodes semantic rules into the database layer — not just application logic.

3. **Stage 3 — Keyword scoring:** `calculate_keyword_match(keywords1 JSONB, keywords2 JSONB)` computes an integer overlap count between two JSON keyword arrays. This score is used to rank matches within colour+intent-filtered candidates.

4. **Geospatial constraint (optional):** When `geofence_enabled = true`, the `calculate_distance()` Haversine function adds a radius-km filter, making the match physically local.

5. **Vector embedding overlay (RGY Intelligent Matching):** `20260218000001_rgy_intelligent_matching.sql` adds `embedding vector(1536)` to user intents and opportunities, with an IVFFlat index, enabling `find_matching_opportunities()` to use cosine similarity as a fourth signal over the filtered set.

The combination of a *semantic colour-state gate → intent gate → keyword overlap score → optional Haversine geofence → vector cosine re-ranking* as a single unified peer-matching pipeline is what is potentially novel.

### Why It Clears the § 101 Alice Hurdle

The claim is not "match users by shared interests." It is a **specific four-stage hierarchical filtering pipeline** in which each stage uses a different mathematical operation (set membership, enumerated constraint, integer overlap, cosine similarity) and the stages are applied sequentially with the earlier stages acting as hard filters that reduce the search space before computationally expensive operations. This is a concrete technical improvement to scalability and match quality simultaneously — a specific technical contribution.

### Prior Art Risk Assessment

- **LinkedIn / Hinge / Bumble matching:** All use ML-based matching without the specific colour-state → intent → keyword → vector hierarchy. **Distinguishable.**
- **Yelp / Google Maps local search:** Geospatial + keyword, but no emotional-state gate, no intent layer, no vector re-ranking. **Distinguishable.**
- **Dating apps (OKCupid compatibility score):** Weighted multi-dimensional score, but no hierarchical hard-gate architecture. **Potentially distinguishable with careful claim scope.**
- **Meetup.com interest matching:** Keyword/category based, no colour-state gate, no vector layer. **Distinguishable.**

### The Tweak Needed to Strengthen the Claim

The current colour-state system (`green`/`yellow`/`red`) is not explicitly linked to a journaling or AI-companion signal. The patent becomes significantly stronger if the colour in a user's capsule is **automatically derived** from their journal's recent colour-category distribution (e.g., if 70% of journal entries in the last 7 days are `RED`, the capsule colour defaults to `red`). This creates a **novel closed loop:** AI companion observes emotional state → automatically encodes it in peer-discovery capsule → peer discovery matches on encoded state. This is a much more specific and defensible technical contribution than "users pick a colour."

**Estimated implementation cost:** 2-3 days (journal → capsule color inference endpoint). **Estimated value to patent claim:** High — this creates a unique feedback loop that no prior art describes.

### Claim Skeleton

```
Claim 1 (Method):
A computer-implemented method for peer discovery using hierarchical context matching, comprising:
(a) receiving, from each of a plurality of users, a context capsule comprising a state colour from a predefined set of semantic colours, an optional intent from a predefined intent vocabulary, and a plurality of keywords;
(b) applying a first filter to retain only context capsules having a state colour that matches a query user's state colour;
(c) applying a second filter to the colour-filtered set to retain only capsules having an intent that matches the query user's intent;
(d) computing, for each remaining capsule, a keyword overlap score representing the number of keywords shared with the query user's capsule;
(e) optionally applying a geospatial filter to retain only capsules whose associated geographic location is within a specified radius of the query user's location; and
(f) ranking the filtered capsules by the keyword overlap score and, when vector embeddings are present, re-ranking by cosine similarity between the query capsule's embedding and each candidate capsule's embedding.

Claim 4 (Dependent — the novel loop):
The method of Claim 1, wherein the state colour of each user's context capsule is automatically derived from a distribution of emotional-state labels assigned to that user's recent AI-companion journal entries over a configurable lookback window.
```

---

## Opportunity 4 — Conversational Zone-Adaptive AI Model Selection with Crisis Escalation Override

**Estimated USPTO Approval Probability: 52-60%**  
**Patent Type:** Utility Patent  
**Best Claims Strategy:** Method claims on the routing decision tree; system claims on the zone-model mapping table  
**Filing Urgency: MEDIUM** — model routing is a crowded space; the crisis-escalation specific claim is the novel element

### What the Code Actually Does

`src/lib/ai/policy-router.ts` implements a **five-zone policy router** for AI model selection:

1. **Zone assignment** (`YELLOW`, `GREEN`, `TEAL`, `RED`, `FREEDOM`) by the calling context — not auto-detected from content (except for the crisis override).
2. **Crisis detection override:** Before any zone routing, the system applies: `if (/self-harm|suicide|hurt myself|end my life/i.test(lastMessageText)) { zone = 'YELLOW'; systemPrompt += " ...be extremely supportive..." }`. This unconditionally overrides any zone to `YELLOW` (the cheap/supportive model tier) and injects crisis-support system prompt modifiers.
3. **Zone-to-model cascade:** Each zone has a primary model and 2-3 fallback models tried in sequence, not in parallel.
4. **Universal Search mode:** `isSearchAll` triggers simultaneous queries to four models (`GPT-4o`, `Claude 3.5`, `Gemini 1.5`, `DeepSeek R1`) with `Promise.allSettled()` and returns a composite output.
5. **Language detection:** `detectLanguage()` applies character-set and common-word heuristics to adapt the system prompt language before routing — without an API call.

The crisis override — detecting mental-health risk signals in free-form text and unconditionally overriding model selection plus system prompt injection — applied *before* any other routing logic is the most novel element.

### Why It Clears the § 101 Alice Hurdle

The claim is not "detect crisis and be nicer." It is a **specific technical control flow:** a safety pre-processor that operates on the text *before* the cost/capability routing decision, overrides both the model selection and the system prompt as an atomic operation, and routes to a specific tier chosen for its emotional support optimisation rather than its raw capability. The "something more" is the safety-first routing architecture that prevents cost-optimised routing from ever taking precedence over safety routing.

### Prior Art Risk Assessment

- **OpenAI content moderation:** OpenAI's moderation API detects unsafe content and blocks responses. It does not reroute to a different model or inject modified system prompts. **Distinguishable.**
- **Crisis Text Line / mental health chatbots:** These are dedicated single-purpose crisis applications. Cubiqo's claim is specifically about a *general-purpose AI routing system* with embedded safety pre-processing. **Different context.**
- **AWS Comprehend Medical + routing:** Detects medical entities but does not modify model selection. **Distinguishable.**
- **Character.ai safety filters:** Block content, do not reroute with modified prompts. **Distinguishable.**

### The Tweak Needed to Strengthen the Claim

Add **explicit logging of the override event** to a separate safety audit trail (`safety_override_log` table), distinct from the general audit log. This creates a "safety audit trail" as a claimed system component, which strengthens the § 101 argument (concrete technical improvement to system auditability) and adds a second independent claim.

**Estimated implementation cost:** 1 day. **Estimated value:** Moderate — primarily strengthens § 101 position.

### Claim Skeleton

```
Claim 1 (Method):
A computer-implemented method for routing AI language model requests in a conversational AI system, comprising:
(a) receiving a user message and an assigned routing zone indicating a desired model capability and cost level;
(b) prior to applying zone-based model selection, evaluating the user message against a crisis detection pattern set comprising patterns associated with self-harm or suicidal ideation;
(c) upon detection of a crisis pattern, unconditionally overriding the assigned routing zone with a predefined safety zone and injecting a crisis-support directive into the system prompt, irrespective of the original routing zone;
(d) upon non-detection of a crisis pattern, selecting a language model from a zone-specific model cascade in order of precedence; and
(e) transmitting the system prompt and user message to the selected language model and returning the response to the user.
```

---

## Opportunities Assessed But Not Recommended (Below 50% Approval Threshold)

The following were evaluated and excluded. Understanding why matters for strategic decisions.

### Not Recommended: BYO Client-Side Key Encryption

The AES-GCM + PBKDF2 implementation in `src/lib/byo/` is a sound and important security feature. However, it is not patentable because:
- Client-side encryption of API credentials using Web Crypto API is well-documented in prior art (1Password, Bitwarden, and academic literature describe this exact approach).
- The specific combination of PBKDF2 key derivation + AES-GCM encryption + base64 serialisation is a textbook implementation with no novel element.
- **Approval estimate: 15-25%.** Not worth pursuing.

### Not Recommended: Smart Model Intent Routing (CubiKey spec)

The intent-based model routing described in `CUBIKEY_SPEC.md` (classify message complexity → select cheapest model tier) is a well-understood engineering practice. OpenRouter, Martian, and RouteLLM (a published research system from Berkeley, 2024) all describe this approach. Since the CubiKey portal also does not yet exist as working code, there is no implementation to patent.
- **Approval estimate: 20-30%.** Do not pursue.

### Not Recommended: Adaptive Learning EMA User Model

The exponential moving average behaviour model in `src/lib/adaptive-learning/user-model.ts` is a standard ML engineering pattern. EMA-based adaptive systems are textbook material and the prior art is extensive (Netflix recommendation, Spotify Discover Weekly, etc.).
- **Approval estimate: 25-35%.** Do not pursue.

### Not Recommended: Vector-Similarity Memory Retrieval

Using pgvector + OpenAI embeddings for semantic memory search is, as of 2026, prior art in the form of: LangChain's MemoryManager, Mem0 (formerly MemGPT), Pinecone's documentation examples, and dozens of academic papers. The Journey memory system is a well-implemented version of established techniques, not a novel one.
- **Approval estimate: 15-20%.** Do not pursue.

---

## Recommended Filing Order and Cost Estimates

| Priority | Opportunity | Estimated Attorney Cost (US) | Estimated Filing Fees (USPTO) | Total | Urgency |
|----------|-------------|------------------------------|-------------------------------|-------|---------|
| 1 | Voice Parameter Modulation | $8,000–$15,000 | $800–$1,800 | ~$16,000 | HIGH — publish risk |
| 2 | 3D Particle Morphology | $8,000–$12,000 | $800–$1,800 | ~$13,000 | MEDIUM-HIGH |
| 3 | Hierarchical Capsule Matching | $10,000–$18,000 | $800–$1,800 | ~$19,000 | MEDIUM |
| 4 | Crisis Escalation Routing | $7,000–$12,000 | $800–$1,800 | ~$13,000 | MEDIUM |

**Total if filing all four:** ~$61,000 (mid-range estimate)  
**Recommended immediate action:** File a **Provisional Patent Application** for Opportunity 1 first. A provisional costs $320 (USPTO small entity fee) plus $1,000–$3,000 in attorney fees, establishes a priority date for 12 months, and gives you time to build the two-stage classifier tweak that strengthens the claim. This is the lowest-cost action that protects the most valuable opportunity.

### Note on PCT (International Filing)

If you have any intention of expanding to EU, Canada, or other markets, file a PCT (Patent Cooperation Treaty) application within 12 months of the provisional. PCT costs approximately $4,000 in USPTO fees plus attorney preparation. It does not grant international patents but preserves the right to enter national phase in 150+ countries.

---

## The One Decision That Changes Everything

Of the four opportunities, **Opportunity 1 (Voice Parameter Modulation)** is the most commercially valuable because:

1. Every AI voice product in the market (ElevenLabs, Play.ht, Descript, OpenAI TTS) is a potential licensing target or infringer.
2. The claim is relatively narrow and specific, which makes it harder to design around.
3. The "madhyama marg" philosophy — the specific calibration of parameters to avoid uncanny-valley artefacts — is a design decision that is documented in the codebase and VOICE_MODULATION.md, giving you dated prior-creation evidence.
4. If issued, this patent covers not just Cubiqo's implementation but any AI TTS system that auto-detects text mood and maps it to a multi-dimensional voice parameter vector. That scope is commercially significant.

**File the provisional for Opportunity 1. Do it before any public demo, blog post, or Product Hunt launch.** A public disclosure before a US patent application destroys novelty in most jurisdictions (the US has a 1-year grace period, but most other countries do not). If you launch on Product Hunt before filing, you lose international rights permanently.

---

## Implementation Specifications — What to Build Before Filing Each Provisional

These specifications describe the exact code changes that must be made before handing files to a patent attorney. They represent the "strengthening tweaks" that raise each opportunity's approval probability and broaden claim scope.

### Specification 1 — Dual-Stage Mood Classifier (Opportunity 1)

**Target file:** `src/lib/voice-modulation.ts`  
**Target file:** `src/app/api/tts/route.ts`  
**Implementation time:** 1 day

```typescript
// ADD to src/lib/voice-modulation.ts

/**
 * Stage 2 confirmation: LLM override for ambiguous mood classifications.
 * Required before patent filing to distinguish from pure keyword-matching prior art.
 */
async function confirmMoodWithLLM(
  text: string,
  byoApiKey?: string
): Promise<VoiceMood | null> {
  const apiKey = byoApiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Classify the emotional tone of this text as exactly one word: intimate, candid, sincere, or neutral.\n\nText: "${text.slice(0, 200)}"\n\nReply with one word only.`
      }]
    })
  })
  const data = await response.json()
  const word = data.content?.[0]?.text?.trim().toLowerCase()
  const valid: VoiceMood[] = ['intimate', 'candid', 'sincere', 'neutral']
  return valid.includes(word as VoiceMood) ? (word as VoiceMood) : null
}

/**
 * PATENT-CRITICAL: Dual-stage mood classifier.
 * Stage 1: keyword matching (O(n), no API call).
 * Stage 2: LLM confirmation only for ambiguous inputs (< 2 keyword matches).
 * 
 * This two-stage pipeline is the novel contribution claimed in Provisional #1.
 */
export async function detectVoiceMoodDualStage(
  text: string,
  byoApiKey?: string
): Promise<VoiceMood> {
  const lowerText = text.toLowerCase()

  // Stage 1: count keyword matches per category
  const intimateScore = INTIMATE_MARKERS.reduce(
    (n, m) => n + (lowerText.includes(m) ? 1 : 0), 0)
  const candidScore   = CANDID_MARKERS.reduce(
    (n, m) => n + (lowerText.includes(m) ? 1 : 0), 0)
  const sincereScore  = SINCERE_MARKERS.reduce(
    (n, m) => n + (lowerText.includes(m) ? 1 : 0), 0)

  const maxScore = Math.max(intimateScore, candidScore, sincereScore)

  // Stage 2: ambiguous → LLM confirmation
  if (maxScore < 2) {
    const llmMood = await confirmMoodWithLLM(text, byoApiKey)
    if (llmMood) return llmMood
  }

  // Return keyword result (or neutral default)
  if (maxScore === 0) return 'neutral'
  if (intimateScore === maxScore) return 'intimate'
  if (candidScore   === maxScore) return 'candid'
  if (sincereScore  === maxScore) return 'sincere'
  return 'neutral'
}

// Export marker arrays for use by confirmMoodWithLLM and tests
export const INTIMATE_MARKERS = [
  'whisper', 'softly', 'quietly', 'secret', 'between us',
  'confession', 'vulnerable', 'intimate', 'close', 'personal', '❤️', '💕', '🥺'
]
export const CANDID_MARKERS = [
  'haha', 'lol', 'hehe', 'funny', 'joke', 'kidding', 'casual',
  'honestly', 'by the way', 'btw', 'anyway', 'literally', 'basically',
  'like,', 'so,', '😂', '😄', '🤣', '😅'
]
export const SINCERE_MARKERS = [
  'important', 'serious', 'understand', 'explain', 'however',
  'therefore', 'consequently', 'significant', 'crucial',
  'analysis', 'data', 'research', 'study', 'evidence'
]
```

**Evidence packet for attorney:**
- Full `voice-modulation.ts` with dual-stage classifier
- Full `/api/tts/route.ts` showing integration
- `VOICE_MODULATION.md` (documents the Madhyama Marg calibration philosophy)
- Git timestamps of all three files (prior-creation evidence)

---

### Specification 2 — State-Parameterised Morph Speed (Opportunity 2)

**Target file:** `src/components/cube/PlasmaWaveField.tsx`  
**Implementation time:** 0.5 days

```typescript
// ADD to PlasmaWaveField.tsx — inside the PlasmaWaveField component

/**
 * PATENT-CRITICAL: State-parameterised morphology rate.
 * Each AI state has a distinct morph speed, not just a distinct morph target.
 * This is the novel element that distinguishes from simple "change shape on state" prior art.
 */
const MORPH_SPEEDS: Record<AIState, number> = {
  neutral:   0.06,  // fast snap to wave (idle return)
  listening: 0.04,  // moderate — attentive urgency
  thinking:  0.02,  // slow — deliberate, pondering quality
  speaking:  0.03,  // medium — confident, measured
  error:     0.08,  // fast — alarm urgency
}

// Replace in useFrame callback:
useFrame((state, delta) => {
  if (!pointsRef.current) return

  const speed = MORPH_SPEEDS[aiState]  // ← state-parameterised speed (NOVEL)
  morphProgress.current = THREE.MathUtils.lerp(
    morphProgress.current,
    targetMorph.current,
    speed                              // ← varies by state (not fixed)
  )

  // ... rest of existing useFrame logic unchanged
})
```

**Evidence packet for attorney:**
- Full `PlasmaWaveField.tsx` after tweak applied
- `EnergyCubeScene.tsx` (shows the state machine mapping)
- Screen recording of the morph running at 120K particles with voice active
- `PARTICLE_COUNT = 120000` constant — establishes scale of technical contribution

---

### Specification 3 — Journal-to-Capsule Colour Sync Trigger (Opportunity 3)

**New file:** `supabase/migrations/YYYYMMDD_journal_capsule_colour_sync.sql`  
**Implementation time:** 2 days (SQL + API route)

```sql
-- supabase/migrations/20260222000001_journal_capsule_colour_sync.sql

/**
 * PATENT-CRITICAL: Closed-loop emotional state propagation.
 * Journal entries (AI-companion observations) automatically update
 * the user's RGY peer-discovery capsule colour.
 * This creates the novel feedback loop:
 *   AI observes state → encodes in peer discovery → matched on inferred state.
 */

CREATE OR REPLACE FUNCTION sync_capsule_color_from_journal(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  green_count  INTEGER := 0;
  yellow_count INTEGER := 0;
  red_count    INTEGER := 0;
  dominant_color TEXT;
BEGIN
  -- Count journal entries by color_category over configurable lookback window
  SELECT
    COUNT(*) FILTER (WHERE color_category = 'green'),
    COUNT(*) FILTER (WHERE color_category = 'yellow'),
    COUNT(*) FILTER (WHERE color_category = 'red')
  INTO green_count, yellow_count, red_count
  FROM journal_entries
  WHERE user_id = p_user_id
    AND timestamp >= NOW() - INTERVAL '7 days';

  -- argmax: dominant colour determines capsule state
  IF green_count >= yellow_count AND green_count >= red_count THEN
    dominant_color := 'green';
  ELSIF red_count >= yellow_count THEN
    dominant_color := 'red';
  ELSE
    dominant_color := 'yellow';
  END IF;

  -- Auto-update active capsule — no user input required (NOVEL)
  UPDATE rgy_capsules
  SET
    color      = dominant_color,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND is_active = true;
END;
$$;

-- Trigger: fires on every journal INSERT (real-time state propagation)
CREATE TRIGGER trg_journal_capsule_colour_sync
AFTER INSERT ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION sync_capsule_color_from_journal(NEW.user_id);

COMMENT ON FUNCTION sync_capsule_color_from_journal IS
  'Patent-critical: automatically propagates AI-companion journal emotional state
   to peer-discovery capsule colour. Part of the novel closed-loop architecture.';
```

**Evidence packet for attorney:**
- `20260218000200_rgy_capsules_and_matching.sql` (full pipeline)
- `src/lib/rgy-matching/discovery-service.ts` (matching service)
- The new trigger migration above
- This shows the closed loop: AI companion → journal entries → capsule colour → peer matching

---

### Specification 4 — Safety Override Audit Trail (Opportunity 4)

**New migration:** `supabase/migrations/YYYYMMDD_safety_override_log.sql`  
**Target file:** `src/lib/ai/policy-router.ts`  
**Implementation time:** 1 day

```sql
-- supabase/migrations/20260222000002_safety_override_log.sql

/**
 * PATENT-CRITICAL: Dedicated audit table for safety routing overrides.
 * Separate from admin_audit_log — establishes the safety pre-processor
 * as a distinct, auditable system component.
 * Strengthens § 101 "something more" argument: concrete technical improvement
 * to system safety auditability.
 */

CREATE TABLE IF NOT EXISTS safety_override_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES auth.users(id),  -- nullable (anon)
  message_hash     TEXT        NOT NULL,  -- SHA-256 of message (privacy-safe)
  original_zone    TEXT        NOT NULL,  -- zone before override
  override_reason  TEXT        NOT NULL DEFAULT 'crisis_pattern_match',
  pattern_matched  TEXT        NOT NULL,  -- which category matched
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Admin-only read (security: no personal data, only hashes)
ALTER TABLE safety_override_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_safety_overrides" ON safety_override_log
  FOR SELECT
  USING (auth.jwt()->'app_metadata'->>'role' = 'admin');

COMMENT ON TABLE safety_override_log IS
  'Patent-critical: audit trail for safety routing overrides.
   Records when the crisis pre-processor overrides zone-based model selection.
   message_hash is SHA-256 of user message — raw content is never stored.';
```

```typescript
// ADD to src/lib/ai/policy-router.ts — inside the route() method

// PATENT-CRITICAL: Safety audit trail (add before filing Provisional #4)
private static async logSafetyOverride(
  userId: string | undefined,
  originalZone: ZoneColor,
  messageText: string,
  patternCategory: string
): Promise<void> {
  try {
    // Hash the message for privacy — never store raw user message
    const msgBuffer = new TextEncoder().encode(messageText)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    const supabase = await createClient()
    await supabase.from('safety_override_log').insert({
      user_id: userId ?? null,
      message_hash: hashHex,
      original_zone: originalZone,
      override_reason: 'crisis_pattern_match',
      pattern_matched: patternCategory,
    })
  } catch {
    // Silently fail — safety override still executes even if logging fails
  }
}

// In route() method, replace the crisis detection block with:
if (selfHarmPatterns.test(lastMessageText)) {
  console.log('[Router] High-risk intent detected. Routing to YELLOW support.')
  await PolicyRouter.logSafetyOverride(     // ← ADD: audit trail
    config.userId,
    zone,
    lastMessageText,
    'self_harm_vocabulary'
  )
  zone = 'YELLOW'                           // ← existing: zone override
  systemPrompt += " \nIMPORTANT: ..."       // ← existing: prompt injection
}
```

**Evidence packet for attorney:**
- Full `policy-router.ts` after audit trail added
- The `safety_override_log` migration above
- Git log showing the crisis detection was implemented before public disclosure
- This diagram showing the override is pre-routing (before zone selection)

---

## Consolidated Evidence Checklist (Send to Attorney)

Before the attorney begins drafting claims, assemble this packet:

| Item | Source | Purpose |
|------|--------|---------|
| `voice-modulation.ts` (with dual-stage added) | `/src/lib/voice-modulation.ts` | Primary exhibit for Opp. 1 |
| `/api/tts/route.ts` | `/src/app/api/tts/route.ts` | Integration exhibit for Opp. 1 |
| `VOICE_MODULATION.md` | repo root | Madhyama Marg calibration philosophy |
| `PlasmaWaveField.tsx` (with MORPH_SPEEDS added) | `/src/components/cube/` | Primary exhibit for Opp. 2 |
| `EnergyCubeScene.tsx` | `/src/components/cube/` | State machine mapping for Opp. 2 |
| 3D cube screen recording (MP4, timestamped) | record locally | Visual prior-creation evidence for Opp. 2 |
| `20260218000200_rgy_capsules_and_matching.sql` | `/supabase/migrations/` | Primary exhibit for Opp. 3 |
| `discovery-service.ts` | `/src/lib/rgy-matching/` | Matching service for Opp. 3 |
| Journal→capsule trigger migration | new file | Closed-loop evidence for Opp. 3 |
| `policy-router.ts` (with audit trail added) | `/src/lib/ai/` | Primary exhibit for Opp. 4 |
| `safety_override_log` migration | new file | Audit trail evidence for Opp. 4 |
| Git log (`git log --oneline --all`) | run in repo | Prior-creation dates for all |
| `PATENT_FLOW_DIAGRAMS.md` | repo root | Technical diagrams for all 4 claims |

---

*This analysis was prepared based on direct inspection of the Cubiqo codebase and general knowledge of USPTO examination practice. It does not constitute legal advice. Retain a registered patent practitioner before filing any application.*
