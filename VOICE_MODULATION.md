# Voice Modulation System - Madhyama Marg

## Philosophy

CubiQo's voice follows the **madhyama marg** (middle path) principle - finding balance between:
- Too human-like (sounds fake/uncanny)
- Too robotic (sounds cold/mechanical)

The voice dynamically shifts between emotional contexts while maintaining the same core identity.

## Voice Moods

### 1. **Sincere** (Professional/Focused)
- Use when: Explaining concepts, serious topics, professional advice
- Parameters:
  - Stability: 0.75 (consistent but not monotone)
  - Similarity: 0.75 (strong identity)
  - Style: 0.15 (minimal exaggeration)
- Example: "Let me explain how this works..."

### 2. **Candid** (Playful/Conversational)
- Use when: Casual chat, jokes, friendly banter
- Parameters:
  - Stability: 0.40 (more expressive variation)
  - Similarity: 0.70 (still recognizable)
  - Style: 0.65 (high expressiveness for laughter)
- Example: "Haha, honestly that's hilarious..."

### 3. **Intimate** (Whisper/Vulnerable)
- Use when: Personal moments, secrets, romantic contexts
- Parameters:
  - Stability: 0.60 (intimate but not flat)
  - Similarity: 0.85 (very close to original)
  - Style: 0.25 (subtle for natural whisper)
  - Speaker boost: OFF (softer sound)
- Example: "Just between us..."

### 4. **Neutral** (Balanced Default)
- Use when: General conversation, no strong markers
- Parameters:
  - Stability: 0.65
  - Similarity: 0.75
  - Style: 0.30

## Auto-Detection

The system analyzes message content for mood markers:

**Intimate:** "whisper", "softly", "secret", "personal", heart emojis
**Candid:** "haha", "lol", "funny", "casual", "honestly", laugh emojis
**Sincere:** "important", "serious", "explain", "therefore", "analysis"

## Natural Variation

Each request adds 5% random variance to prevent mechanical repetition - the madhyama marg approach ensures variations are subtle and natural, not jarring.

## API Usage

```typescript
// Auto-detect mood from content
POST /api/tts
{
  "text": "Haha, that's so funny!",
  // No mood specified - will detect 'candid'
}

// Override mood explicitly
POST /api/tts
{
  "text": "I need to tell you something important.",
  "mood": "sincere"
}

// Manual parameter control (advanced)
POST /api/tts
{
  "text": "Custom settings",
  "stability": 0.5,
  "similarity_boost": 0.8,
  "style": 0.4
}
```

## Implementation

See:
- `/src/lib/voice-modulation.ts` - Core logic
- `/src/app/api/tts/route.ts` - API integration

## Future Enhancements

- Context awareness (conversation history)
- User preference learning
- Real-time emotion detection from chat sentiment
- Voice blending for gradual transitions
