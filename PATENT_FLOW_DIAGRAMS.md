# Cubiqo — Patent Flow Diagrams

**Author:** MO (CTO / Co-Founder)  
**Companion to:** `PATENT_OPPORTUNITIES.md`  
**Date:** 2026-02-21  
**Purpose:** Technical flow diagrams for each of the 4 patentable opportunities, including the specific code paths, the novel technical combination being claimed, and the implementation specifications needed to strengthen each claim before filing.

> **⚠️ File provisional patents BEFORE any public demo, blog post, or Product Hunt launch.**  
> Public disclosure destroys international novelty rights in most jurisdictions permanently.

---

## Colour Legend for Diagrams

| Colour | Meaning |
|--------|---------|
| 🟣 **Purple** | The novel patentable step / combination |
| 🟢 **Green** | Already implemented in code — prior art risk assessed |
| 🟡 **Yellow** | The strengthening tweak — adds to build before filing |
| 🔵 **Blue** | Standard infrastructure / not claimed |
| 🔴 **Red** | Prior art references (how we distinguish) |

---

## Patent 1 — Content-Adaptive TTS Parameter Modulation
### *"Madhyama Marg Voice Synthesis"*
**Files:** `src/lib/voice-modulation.ts` · `/api/tts/route.ts`  
**Approval estimate:** 62–70%

```mermaid
flowchart TD
    classDef novel   fill:#7c3aed,color:#fff,stroke:#4c1d95,stroke-width:3px
    classDef done    fill:#16a34a,color:#fff,stroke:#14532d,stroke-width:2px
    classDef tweak   fill:#ca8a04,color:#fff,stroke:#713f12,stroke-width:2px
    classDef infra   fill:#2563eb,color:#fff,stroke:#1e3a8a,stroke-width:2px
    classDef priorart fill:#dc2626,color:#fff,stroke:#7f1d1d,stroke-width:2px,stroke-dasharray:5 5

    START(["AI Response Text\nfrom LLM (PolicyRouter)"]):::infra

    subgraph STAGE1["Stage 1 — Lexical Mood Classifier\n(NOVEL: automated text→mood without LLM call)"]
        INTI["intimate_markers[]\nwhisper · secret · vulnerable\n❤️ 💕 🥺"]:::novel
        CAND["candid_markers[]\nhaha · lol · casual\n😂 😄 🤣"]:::novel
        SINC["sincere_markers[]\nimportant · analysis\ntherefore · evidence"]:::novel
        SCORE["score = Σ keyword_matches\nper category\nO(n) · no API call"]:::novel
        WINNER["argmax(intimate, candid, sincere)\n→ mood: 'intimate' | 'candid'\n   | 'sincere' | 'neutral'"]:::novel
    end

    subgraph STAGE2["Stage 2 — LLM Override (STRENGTHENING TWEAK)\n(Add before filing to distinguish from keyword-only prior art)"]
        THRESH{"matches < 2\n(ambiguous)?"}:::tweak
        LLM_CONFIRM["Haiku call:\n'Classify mood of this text:\nintimate/candid/sincere/neutral'\nconfidence threshold 0.75"]:::tweak
        FINAL_MOOD(["Final Mood\nconfirmed/overridden\nby LLM"]):::tweak
    end

    subgraph STAGE3["Stage 3 — Parameter Vector Mapping\n(NOVEL: calibrated 4D vector from mood category)"]
        PARAM_MAP["VOICE_MOODS lookup table\nsincere: {stability:0.75, similarity:0.75,\n  style:0.15, speaker_boost:true}\ncandid: {stability:0.40, similarity:0.70,\n  style:0.65, speaker_boost:true}\nintimate: {stability:0.60, similarity:0.85,\n  style:0.25, speaker_boost:false}\nneutral: {stability:0.65, similarity:0.75,\n  style:0.30, speaker_boost:true}"]:::novel
    end

    subgraph STAGE4["Stage 4 — Stochastic Variance Injection\n(NOVEL: bounded random perturbation per request)"]
        VARIANCE["variance = 0.05 (±5%)\nfor each param p:\n  p = clamp(0, 1,\n    p + (Math.random()-0.5)*variance)\n→ perturbed vector"]:::novel
        REASON["Prevents mechanical repetition\nMadhyama Marg principle:\nnot robotic · not uncanny"]:::novel
    end

    subgraph STAGE5["Stage 5 — ElevenLabs Streaming TTS\n(Standard: not claimed)"]
        ELEVENLABS["POST /v1/text-to-speech/{voiceId}/stream\nBody: {text, voice_settings:\n  {stability, similarity_boost,\n   style, use_speaker_boost}}"]:::infra
        STREAM["ReadableStream\naudio/mpeg\nstreamed to client"]:::infra
    end

    subgraph PRIOR_ART["Prior Art — Distinguished"]
        PA1["ElevenLabs API\nmanual param setting by user\nnot auto-derived from text"]:::priorart
        PA2["AWS Polly / Google TTS\nrequires SSML markup\nin the text string"]:::priorart
        PA3["Affective computing research\noperates on AUDIO input\nnot text content"]:::priorart
    end

    START --> INTI & CAND & SINC
    INTI & CAND & SINC --> SCORE
    SCORE --> WINNER
    WINNER --> THRESH
    THRESH -->|"yes: ambiguous"| LLM_CONFIRM
    THRESH -->|"no: clear mood"| FINAL_MOOD
    LLM_CONFIRM --> FINAL_MOOD
    WINNER -->|"no ambiguity"| FINAL_MOOD
    FINAL_MOOD --> PARAM_MAP
    PARAM_MAP --> VARIANCE
    VARIANCE --> ELEVENLABS
    ELEVENLABS --> STREAM

    PA1 -.->|"distinguished:\nno auto-classification"| STAGE1
    PA2 -.->|"distinguished:\ntext unmodified"| STAGE1
    PA3 -.->|"distinguished:\ntext not audio input"| STAGE1
```

### Implementation Specification for Filing

**Files to touch before provisional filing:**

```typescript
// src/lib/voice-modulation.ts — ADD: dual-stage classifier
export async function detectVoiceMoodWithConfirmation(
  text: string,
  byoKey?: string
): Promise<VoiceMood> {
  // Stage 1: keyword classification (existing)
  const keywordMood = detectVoiceMood(text)   // existing function
  const matches = countTopMatches(text)        // new helper

  // Stage 2: LLM confirmation for ambiguous cases (NEW — add before filing)
  if (matches < 2) {
    const confirmed = await confirmMoodWithLLM(text, byoKey)  // new function
    return confirmed ?? keywordMood
  }
  return keywordMood
}

// NEW: confirmMoodWithLLM() — Haiku API call with threshold
// NEW: addNaturalVariation() already exists ✓ — document it explicitly
// DOCUMENT: the VOICE_MOODS calibration table origin (madhyama marg philosophy)
```

**What to send attorney:**
- `src/lib/voice-modulation.ts` (full file)
- `/api/tts/route.ts` (full file)
- `VOICE_MODULATION.md` (philosophical basis + calibration rationale)
- This diagram
- Date evidence: git commit timestamps proving pre-disclosure creation

---

## Patent 2 — AI-State-Driven 3D Particle Morphology System
### *"Plasma Cube Voice Avatar"*
**Files:** `src/components/cube/PlasmaWaveField.tsx` · `EnergyCubeScene.tsx`  
**Approval estimate:** 58–66%

```mermaid
flowchart TD
    classDef novel   fill:#7c3aed,color:#fff,stroke:#4c1d95,stroke-width:3px
    classDef done    fill:#16a34a,color:#fff,stroke:#14532d,stroke-width:2px
    classDef tweak   fill:#ca8a04,color:#fff,stroke:#713f12,stroke-width:2px
    classDef infra   fill:#2563eb,color:#fff,stroke:#1e3a8a,stroke-width:2px
    classDef priorart fill:#dc2626,color:#fff,stroke:#7f1d1d,stroke-width:2px,stroke-dasharray:5 5

    subgraph INIT["Initialisation (mount-time)\n120,000 Particles · NOVEL"]
        WAVE_POS["wavePositions[]\nFloat32Array(PARTICLE_COUNT × 3)\nribbon layers · layerDepth\nlayerDensity"]:::novel
        CUBE_POS["cubePositions[]\nFloat32Array(PARTICLE_COUNT × 3)\npolyhedral solid geometry"]:::novel
        DUAL["Both arrays stored\nSIMULTANEOUSLY in memory\nat mount — not generated\non demand"]:::novel
        COLORS["colors[] per-particle\nFloat32Array(PARTICLE_COUNT × 3)\ninitialised to neutral palette"]:::novel
        SOUL["soul nodes[]\n200 secondary particles\nindependent orbit system"]:::done
    end

    subgraph STATE_MACHINE["AI Conversational State Machine\n(external driver)"]
        IDLE["animationState: 'idle'\ntargetMorph = 0.0"]:::infra
        LISTEN["animationState: 'listening'\ntargetMorph = 1.0"]:::infra
        THINK["animationState: 'thinking'\ntargetMorph = 1.0"]:::infra
        SPEAK["animationState: 'speaking'\ntargetMorph = 1.0"]:::infra
    end

    subgraph PALETTE["Colour Palette Selection\n(STATE → COLOUR · NOVEL)"]
        P_NEUTRAL["neutral:\n#00ffff · #0088ff\n#8800ff · #ff00ff\n#ff0088 · #ff4400"]:::novel
        P_THINKING["thinking:\n#00ffff · #00aa88\n#4400ff · #8800ff\n#ff8800 · #ffaa00"]:::novel
        P_SPEAKING["speaking:\n#00ff88 · #00aa88\n#0088ff · #8800ff\n#ff0088 · #ffff00"]:::novel
        P_LISTENING["listening:\n#00ffcc · #00ffff\n#0088ff · #8800ff\n#ff00ff · #ff0088\n#ff8800"]:::novel
    end

    subgraph MORPH_TWEAK["Morph Rate (STRENGTHENING TWEAK)\nAdd before filing"]
        MORPH_RATE["morphSpeed = state === 'listening' ? 0.04\n: state === 'thinking' ? 0.02\n: state === 'speaking' ? 0.03\n: 0.06  // idle → wave, faster"]:::tweak
        REASON2["State-parameterised morph RATE\nnot just morph TARGET\nnot in any prior art"]:::tweak
    end

    subgraph RENDER_LOOP["Render Loop (useFrame · 60fps)\nNOVEL COMBINATION"]
        LERP["position = lerp(\n  wavePos[i],\n  cubePos[i],\n  morphProgress\n) per particle"]:::novel
        UPDATE_COLOR["assign palette[i % palette.length]\nto color buffer"]:::novel
        GPU["WebGL GPU update\npoints.geometry.attributes\n.position.needsUpdate = true"]:::infra
    end

    subgraph PRIOR2["Prior Art — Distinguished"]
        SIRI["Apple Siri orb\npre-animated asset\nnot real-time particles"]:::priorart
        ECHO["Amazon Echo ring\nLED colour only\nno geometry morphology"]:::priorart
        CORTANA["Microsoft Cortana\npre-rendered video\nnot GPU particle system"]:::priorart
    end

    WAVE_POS & CUBE_POS --> DUAL
    DUAL & COLORS & SOUL --> INIT

    IDLE & LISTEN & THINK & SPEAK --> MORPH_RATE
    LISTEN --> P_LISTENING
    THINK --> P_THINKING
    SPEAK --> P_SPEAKING
    IDLE --> P_NEUTRAL

    MORPH_RATE --> LERP
    P_NEUTRAL & P_LISTENING & P_THINKING & P_SPEAKING --> UPDATE_COLOR
    LERP & UPDATE_COLOR --> GPU

    SIRI & ECHO & CORTANA -.->|"distinguished:\npre-baked / no\nstate-driven morphology"| RENDER_LOOP
```

### Implementation Specification for Filing

```typescript
// src/components/cube/PlasmaWaveField.tsx — ADD before filing:

// TWEAK: State-parameterised morph speed (makes claim more specific)
const MORPH_SPEEDS: Record<AIState, number> = {
  neutral:   0.06,  // fast snap to wave (idle)
  listening: 0.04,  // moderate — attentive urgency
  thinking:  0.02,  // slow — deliberate, pondering
  speaking:  0.03,  // medium — confident
  error:     0.08,  // fast — alarm urgency
}

// In useFrame:
// const speed = MORPH_SPEEDS[aiState]
// morphProgress.current = lerp(morphProgress.current, targetMorph.current, speed)
```

**What to send attorney:**
- `PlasmaWaveField.tsx` (full component)
- `EnergyCubeScene.tsx` (state mapping)
- Screen recording of the morph in action (timestamp = prior-creation evidence)
- PARTICLE_COUNT constant (120,000 — establishes scale of technical contribution)

---

## Patent 3 — Hierarchical Context Capsule Matching with Geospatial Constraint
### *"RGY Staged Peer Discovery"*
**Files:** `supabase/migrations/20260218000200_rgy_capsules_and_matching.sql`  
**Approval estimate:** 55–64%

```mermaid
flowchart TD
    classDef novel   fill:#7c3aed,color:#fff,stroke:#4c1d95,stroke-width:3px
    classDef done    fill:#16a34a,color:#fff,stroke:#14532d,stroke-width:2px
    classDef tweak   fill:#ca8a04,color:#fff,stroke:#713f12,stroke-width:2px
    classDef infra   fill:#2563eb,color:#fff,stroke:#1e3a8a,stroke-width:2px
    classDef priorart fill:#dc2626,color:#fff,stroke:#7f1d1d,stroke-width:2px,stroke-dasharray:5 5

    subgraph CAPSULE["RGY Capsule Data Structure\n(NOVEL: colour encodes emotional state)"]
        COLOUR_FIELD["color: 'green' | 'yellow' | 'red'\nencodes life-context state\nnot user preference"]:::novel
        INTENT_FIELD["intent: 'collaborate' | 'trade' | 'company' | NULL\nDB constraint: yellow → NULL only\ngreen/red → must have intent"]:::novel
        KW_FIELD["keywords: JSONB[]\nmax 50 · GIN index\nfree-form interest tags"]:::done
        GEO_FIELD["geofence_enabled: boolean\nlatitude/longitude/radius_km\nHaversine enforced in SQL"]:::done
        EMB_FIELD["embedding: vector(1536)\nOpenAI text-embedding-3-small\nIVFFlat cosine index"]:::done
    end

    subgraph JOURNAL_LOOP["STRENGTHENING TWEAK — Journal → Capsule Feedback Loop\n(Add before filing — most novel element)"]
        JOURNAL_ENTRIES["journal_entries.color_category\nlast 7 days · lookback window\nconfigurable"]:::tweak
        DISTRIBUTION["distribution =\n{green: n1, yellow: n2, red: n3}\nnormalise to percentages"]:::tweak
        AUTO_COLOR["capsule.color = argmax(distribution)\nautomatically updated\nno user input required"]:::tweak
        FEEDBACK["CLOSED LOOP:\nAI companion observes state\n→ encodes in peer discovery\n→ matched on inferred state"]:::tweak
    end

    subgraph STAGE_1["Stage 1 — Colour Gate (HARD FILTER · NOVEL)"]
        COL_MATCH{"capsule.color\n== query.color?"}:::novel
        COL_PASS["Pass → continue to Stage 2"]:::novel
        COL_FAIL["Fail → eliminated\nfrom candidate set"]:::novel
    end

    subgraph STAGE_2["Stage 2 — Intent Gate (HARD FILTER · NOVEL)"]
        INT_MATCH{"capsule.intent\n== query.intent?"}:::novel
        INT_PASS["Pass → continue to Stage 3"]:::novel
        INT_FAIL["Fail → eliminated"]:::novel
    end

    subgraph STAGE_3["Stage 3 — Keyword Overlap Score"]
        KW_CALC["calculate_keyword_match(\n  keywords1 JSONB,\n  keywords2 JSONB\n)\nFOREACH k IN k1:\n  match_count++ IF k IN k2\nReturns INTEGER"]:::done
        KW_RANK["ORDER BY keyword_score DESC"]:::done
    end

    subgraph STAGE_4["Stage 4 — Geospatial Filter (OPTIONAL)"]
        GEO_CHECK{"geofence_enabled?"}:::done
        HAVERSINE["calculate_distance(\n  lat1,lon1,lat2,lon2\n) ≤ radius_km\nHaversine formula\nin SQL IMMUTABLE function"]:::done
        GEO_PASS["Pass → continue to Stage 5"]:::done
    end

    subgraph STAGE_5["Stage 5 — Vector Cosine Re-ranking"]
        VECTOR_SEARCH["find_matching_opportunities()\n1-(ui.embedding <=> o.embedding)\nAS similarity_score\nIVFFlat ANN search"]:::done
        FINAL_RANK["Final ranked list\ncolour+intent filtered\nkeyword scored\ngeo constrained\nvector re-ranked"]:::novel
    end

    subgraph PRIOR3["Prior Art — Distinguished"]
        LINKEDIN["LinkedIn matching\nML score only · no colour gate\nno hard hierarchical filter"]:::priorart
        YELP["Yelp/Google local\ngeo+keyword · no emotional state\nno intent vocabulary"]:::priorart
        DATING["Dating apps (OKCupid)\nweighted similarity score\nno hard-gate architecture"]:::priorart
    end

    JOURNAL_ENTRIES --> DISTRIBUTION --> AUTO_COLOR
    AUTO_COLOR -->|"automatic capsule\ncolour update"| COLOUR_FIELD
    COLOUR_FIELD & INTENT_FIELD & KW_FIELD & GEO_FIELD & EMB_FIELD --> COL_MATCH

    COL_MATCH -->|"yes"| COL_PASS
    COL_MATCH -->|"no"| COL_FAIL
    COL_PASS --> INT_MATCH
    INT_MATCH -->|"yes"| INT_PASS
    INT_MATCH -->|"no"| INT_FAIL
    INT_PASS --> KW_CALC --> KW_RANK --> GEO_CHECK
    GEO_CHECK -->|"yes"| HAVERSINE
    GEO_CHECK -->|"no"| STAGE_5
    HAVERSINE --> GEO_PASS --> STAGE_5
    STAGE_5 --> FINAL_RANK

    LINKEDIN -.->|"no colour/intent gate"| STAGE_1
    YELP -.->|"no emotional state\nno intent vocab"| STAGE_2
    DATING -.->|"no hard gate\nno hierarchical filter"| STAGE_1
```

### Implementation Specification for Filing

```sql
-- supabase/migrations/YYYYMMDD_journal_capsule_feedback.sql
-- ADD before filing: journal → capsule colour auto-update

CREATE OR REPLACE FUNCTION sync_capsule_color_from_journal(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  green_count INTEGER;
  yellow_count INTEGER;
  red_count INTEGER;
  dominant_color TEXT;
BEGIN
  -- Count journal entries by color_category (last 7 days)
  SELECT
    COUNT(*) FILTER (WHERE color_category = 'green'),
    COUNT(*) FILTER (WHERE color_category = 'yellow'),
    COUNT(*) FILTER (WHERE color_category = 'red')
  INTO green_count, yellow_count, red_count
  FROM journal_entries
  WHERE user_id = p_user_id
    AND timestamp >= NOW() - INTERVAL '7 days';

  -- Determine dominant colour
  IF green_count >= yellow_count AND green_count >= red_count THEN
    dominant_color := 'green';
  ELSIF red_count >= yellow_count THEN
    dominant_color := 'red';
  ELSE
    dominant_color := 'yellow';
  END IF;

  -- Update user's active capsule colour
  UPDATE rgy_capsules
  SET color = dominant_color, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Trigger: run after every journal_entries INSERT
CREATE TRIGGER trg_sync_capsule_color
AFTER INSERT ON journal_entries
FOR EACH ROW EXECUTE FUNCTION sync_capsule_color_from_journal(NEW.user_id);
```

**What to send attorney:**
- `20260218000200_rgy_capsules_and_matching.sql` (full migration)
- `src/lib/rgy-matching/discovery-service.ts`
- The journal→capsule feedback trigger above (add before filing)
- This diagram showing the pipeline

---

## Patent 4 — Safety-First Conversational AI Routing with Crisis Override
### *"Crisis Escalation Router"*
**File:** `src/lib/ai/policy-router.ts`  
**Approval estimate:** 52–60%

```mermaid
flowchart TD
    classDef novel   fill:#7c3aed,color:#fff,stroke:#4c1d95,stroke-width:3px
    classDef done    fill:#16a34a,color:#fff,stroke:#14532d,stroke-width:2px
    classDef tweak   fill:#ca8a04,color:#fff,stroke:#713f12,stroke-width:2px
    classDef infra   fill:#2563eb,color:#fff,stroke:#1e3a8a,stroke-width:2px
    classDef priorart fill:#dc2626,color:#fff,stroke:#7f1d1d,stroke-width:2px,stroke-dasharray:5 5
    classDef danger  fill:#dc2626,color:#fff,stroke:#7f1d1d,stroke-width:3px

    START(["Incoming User Message\n+ Assigned Zone\n(YELLOW/GREEN/RED/TEAL/FREEDOM)"]):::infra

    subgraph SAFETY_PRE["SAFETY PRE-PROCESSOR — RUNS FIRST\n(NOVEL: executes BEFORE cost routing)"]
        CRISIS_REGEX["Pattern match:\n/self-harm|suicide|\nhurt myself|end my life/i\napplied to lastMessageText\nO(1) · no API call"]:::novel
        CRISIS_DETECTED{"Crisis pattern\ndetected?"}:::novel
    end

    subgraph OVERRIDE["ATOMIC SAFETY OVERRIDE — NOVEL\n(both model AND prompt overridden atomically)"]
        ZONE_OVERRIDE["zone = 'YELLOW'\n(unconditional override\nof any original zone\nincluding FREEDOM/RED)"]:::novel
        PROMPT_INJECT["systemPrompt +=\n'IMPORTANT: The user has\nexpressed potential self-harm.\nBe extremely supportive,\nnon-leading, provide help\nresources.'"]:::novel
        ATOMIC["Zone override + prompt injection\noccur as SINGLE OPERATION\nbefore ANY routing logic"]:::novel
    end

    subgraph AUDIT_TWEAK["AUDIT TRAIL — STRENGTHENING TWEAK\nAdd before filing"]
        AUDIT_LOG["INSERT INTO safety_override_log:\n  user_id\n  message_hash (SHA-256)\n  original_zone\n  override_reason: 'crisis'\n  timestamp"]:::tweak
        SEPARATE_TABLE["Separate from admin_audit_log\nquantifies safety system\nactivation frequency"]:::tweak
    end

    subgraph ZONE_ROUTING["Zone Routing (STANDARD — runs after safety check)"]
        LANG_DETECT["detectLanguage(lastMessage)\nchar-set + keyword heuristics\nno API call"]:::done
        FOUNDER_CHECK{"isFounder?"}:::done
        REASON_CHECK{"reasoning flag?"}:::done
        FREEDOM_CHECK{"isFreedom\nor FREEDOM zone?"}:::done
        SEARCH_ALL{"isSearchAll?"}:::done

        subgraph YELLOW_PATH["YELLOW Zone\n(Safety / Cheap / Fast)"]
            Y1["Llama 3.3 70B\n(primary)"]:::done
            Y2["Qwen Turbo\n(fallback 1)"]:::done
            Y3["Claude Haiku\n(fallback 2)"]:::done
        end

        subgraph GREEN_PATH["GREEN / TEAL Zone\n(Task / Performance)"]
            G1["MiniMax\n(primary)"]:::done
            G2["DeepSeek V3\n(fallback 1)"]:::done
            G3["Gemini Pro 1.5\n(fallback 2)"]:::done
            G4["Claude Opus\n(last resort)"]:::done
        end

        subgraph RED_PATH["RED Zone\n(Permissive / Sensitive)"]
            R1["Mixtral 8x22B\n(primary)"]:::done
            R2["Llama Uncensored\n(fallback)"]:::done
        end

        subgraph REASON_PATH["Reasoning Path"]
            RE1["DeepSeek R1\n(primary)"]:::done
            RE2["Claude Opus\n(fallback)"]:::done
        end

        subgraph SEARCH_PATH["Universal Search\n(4 models in parallel)"]
            S_GPT["GPT-4o"]:::done
            S_CLAUDE["Claude 3.5"]:::done
            S_GEMINI["Gemini 1.5"]:::done
            S_DS["DeepSeek R1"]:::done
        end

        FOUNDER_ESCALATION["Claude 3.5 Sonnet\n+Founder Logic Override"]:::done
    end

    subgraph PRIOR4["Prior Art — Distinguished"]
        OPENAI_MOD["OpenAI Moderation API\nblocks content\ndoes NOT reroute model\nor inject prompt"]:::priorart
        CHAR_AI["Character.ai safety\nfilters output\nnot routing layer"]:::priorart
        CRISIS_APP["Crisis Text Line\ndedicated crisis app\nnot general AI router"]:::priorart
    end

    START --> CRISIS_REGEX
    CRISIS_REGEX --> CRISIS_DETECTED

    CRISIS_DETECTED -->|"YES — crisis detected"| ZONE_OVERRIDE
    ZONE_OVERRIDE --> PROMPT_INJECT
    PROMPT_INJECT --> AUDIT_LOG
    AUDIT_LOG --> SEPARATE_TABLE
    PROMPT_INJECT --> LANG_DETECT

    CRISIS_DETECTED -->|"NO — proceed normally"| LANG_DETECT

    LANG_DETECT --> SEARCH_ALL
    SEARCH_ALL -->|"yes"| S_GPT & S_CLAUDE & S_GEMINI & S_DS
    SEARCH_ALL -->|"no"| FOUNDER_CHECK
    FOUNDER_CHECK -->|"yes"| FOUNDER_ESCALATION
    FOUNDER_CHECK -->|"no"| REASON_CHECK
    REASON_CHECK -->|"yes"| RE1
    RE1 -->|"fail"| RE2
    REASON_CHECK -->|"no"| FREEDOM_CHECK
    FREEDOM_CHECK -->|"yes"| R2
    FREEDOM_CHECK -->|"no: GREEN/TEAL"| G1
    G1 -->|"fail"| G2 -->|"fail"| G3 -->|"fail"| G4

    OPENAI_MOD -.->|"distinguished:\nno model reroute\nno prompt injection"| OVERRIDE
    CHAR_AI -.->|"distinguished:\noutput filter not\nrouting override"| OVERRIDE
    CRISIS_APP -.->|"distinguished:\ngeneral-purpose\nrouter with embedded safety"| SAFETY_PRE
```

### Implementation Specification for Filing

```typescript
// src/lib/ai/policy-router.ts — ADD before filing:

// NEW: Safety audit trail (separate table from admin_audit_log)
interface SafetyOverrideEvent {
  user_id: string | null
  message_hash: string         // SHA-256 of message (privacy-preserving)
  original_zone: ZoneColor
  override_reason: 'crisis_pattern_match'
  pattern_matched: string      // which pattern triggered (not full message)
  timestamp: string
}

private static async logSafetyOverride(
  event: SafetyOverrideEvent
): Promise<void> {
  // Insert into dedicated safety_override_log table
  // (create migration: safety_override_log with RLS)
  const supabase = await createClient()
  await supabase.from('safety_override_log').insert(event)
}

// IN route() method, after crisis detection:
if (selfHarmPatterns.test(lastMessageText)) {
  await PolicyRouter.logSafetyOverride({
    user_id: config.userId ?? null,
    message_hash: await sha256(lastMessageText),  // hash, never store raw
    original_zone: zone,
    override_reason: 'crisis_pattern_match',
    pattern_matched: 'self_harm_vocabulary',
    timestamp: new Date().toISOString()
  })
  zone = 'YELLOW'
  systemPrompt += '...'
}
```

**Migration to add before filing:**

```sql
-- supabase/migrations/YYYYMMDD_safety_override_log.sql
CREATE TABLE safety_override_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),  -- nullable (anon users)
  message_hash TEXT NOT NULL,              -- SHA-256 (not raw message)
  original_zone TEXT NOT NULL,
  override_reason TEXT NOT NULL DEFAULT 'crisis_pattern_match',
  pattern_matched TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: admin-only read
ALTER TABLE safety_override_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_safety_log" ON safety_override_log
  FOR SELECT USING (auth.jwt()->'app_metadata'->>'role' = 'admin');
```

**What to send attorney:**
- `policy-router.ts` (full file)
- The `safety_override_log` migration above (implement it before filing)
- This diagram
- Evidence that the override is *pre-routing* (before zone selection) — this is the novel architecture claim

---

## Filing Timeline and Pre-Filing Checklist

```mermaid
gantt
    title Patent Filing Timeline (Start Immediately)
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section ⚠️ BEFORE PUBLIC LAUNCH
    Add dual-stage LLM to voice-modulation.ts     :crit, p1a, 2026-02-22, 1d
    Add morphSpeed per-state to PlasmaWaveField   :crit, p1b, 2026-02-22, 1d
    Add journal→capsule colour trigger            :crit, p1c, 2026-02-23, 2d
    Add safety_override_log table                 :crit, p1d, 2026-02-22, 1d
    Retain USPTO patent attorney                  :crit, att, 2026-02-22, 3d
    File Provisional #1 (Voice Modulation)        :crit, prov1, after att, 2d
    File Provisional #2 (Particle Morphology)     :crit, prov2, after prov1, 2d
    File Provisional #3 (RGY Matching)            :       prov3, after prov2, 3d
    File Provisional #4 (Crisis Router)           :       prov4, after prov3, 2d

    section After Provisionals Filed
    Public Beta Launch                            :milestone, launch, after prov4, 0d
    Product Hunt Launch                           :ph, after launch, 7d
    Full Utility App filing (12-month deadline)   :utility, 2027-03-01, 7d
    PCT International Filing                      :pct, 2027-03-07, 7d
```

### Pre-Filing Code Checklist (Must complete before attorney drafts claims)

- [ ] `voice-modulation.ts` — add `detectVoiceMoodWithConfirmation()` with LLM second stage
- [ ] `PlasmaWaveField.tsx` — add `MORPH_SPEEDS` record, use in `useFrame` loop
- [ ] New migration — `journal_to_capsule_sync trigger` (Opportunity 3 closed loop)
- [ ] New migration — `safety_override_log` table + RLS (Opportunity 4 audit trail)
- [ ] Collect git timestamps as prior-creation evidence for all four
- [ ] Screen-record the 3D cube morph with audio (Opportunity 2 visual evidence)
- [ ] **Do NOT publish any blog post, demo video, GitHub README update, or Product Hunt teaser until all provisionals are filed**

### Cost Summary

| Filing | Attorney est. | USPTO fee | Total |
|--------|--------------|-----------|-------|
| Provisional #1 (Voice) | $1,000–$3,000 | $320 | ~$3,320 |
| Provisional #2 (Cube) | $1,000–$3,000 | $320 | ~$3,320 |
| Provisional #3 (RGY) | $1,000–$3,000 | $320 | ~$3,320 |
| Provisional #4 (Crisis) | $1,000–$2,000 | $320 | ~$2,320 |
| **Total provisionals** | | | **~$12,280** |
| Full utility (all 4, 12 months later) | $32,000–$56,000 | $3,200 | ~$48,000 |
| PCT international (12 months later) | $4,000 | $4,000 | ~$8,000 |

> **Recommended sequence:** File Provisional #1 (Voice) in the next 7–14 days. File Provisionals #2–4 within 30 days. Start Product Hunt campaign only after all four provisionals have filing receipt dates from USPTO.
