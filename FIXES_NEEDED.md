# Critical Fixes for Audio & Chat

## Problem Summary
1. **Voice Won't Start** - `chatInitialized` gate blocking audio
2. **Chat API Failures** - `conversationId` not initializing properly for guests  
3. **Biometrics Not Visible** - Actually working, just needs testing

---

## Fix 1: Remove Chat Dependency from Voice (CRITICAL)

**File:** `src/components/FullscreenApp.tsx` (Line 293-299)

**Current Code:**
```typescript
if (!voiceEnabled) {
  setVoiceEnabled(true)
  setAppState('listening')
  setAnimationState('listening')
  if (chatInitialized) {  // ❌ BLOCKING VOICE
    startListening()
  }
}
```

**Fixed Code:**
```typescript
if (!voiceEnabled) {
  setVoiceEnabled(true)
  setAppState('listening')
  setAnimationState('listening')
  startListening()  // ✅ Start immediately, chat will queue messages
}
```

**Why This Works:**
- Voice recognition can start independently
- `sendMessage` will queue/init conversation on first message
- No need to block user interaction on backend readiness

---

## Fix 2: Ensure Guest Session Initialization

**File:** `src/hooks/useChat.ts` (Line 235-239)

**Current Code:**
```typescript
useEffect(() => {
  if (!sessionId || lastSessionIdRef.current === sessionId) return
  lastSessionIdRef.current = sessionId
  ensure Conversation(session Id)
}, [sessionId, ensureConversation])
```

**Problem:** For guests, `sessionId` might be null initially.

**Fixed Code:**
```typescript
useEffect(() => {
  if (!sessionId) {
    // For guests without session, mark as initialized anyway
    // Conversation will be created on first message
    setState(prev => ({ ...prev, isInitialized: true }))
    return
  }
  
  if (lastSessionIdRef.current === sessionId) return
  lastSessionIdRef.current = sessionId
  ensureConversation(sessionId)
}, [sessionId, ensureConversation])
```

**Why This Works:**
- Guest sessions can start voice immediately
- Conversation creates lazily on first message
- No blocking initialization for anonymous users

---

## Fix 3: Test Biometric Login Visibility

**Action Required:** Test `/auth` page in incognito

**Expected Behavior:**
1. Email input field
2. "Continue" button  
3. **Divider line** (border-t)
4. **"Sign in with Passkey"** button (white background)

**If Missing:**
- Check browser supports WebAuthn (`chrome://settings/privacy`)
- Verify component renders: Open DevTools → Search for "Sign in with Passkey"
- Check z-index conflicts in login modal

---

## Implementation Priority

1. **Fix 1** (Voice) - Deploy immediately
2. **Fix 2** (Session) - Deploy with Fix 1
3. **Fix 3** (Biometrics) - Test only, no code change needed

---

## Testing Steps

### Voice Fix:
1. Deploy fixes
2. Visit `/?landing=true`
3. Click voice button
4. Should hear "listening" immediately
5. Speak test message
6. Should get AI response

### Chat Fix:
1. Open in incognito (guest mode)
2. Click voice button
3. Say "Hello"
4. Verify response comes through
5. Check developer console for conversation creation logs

### Biometric Test:
1. Visit `/auth` in Chrome/Edge
2. Look for "Sign in with Passkey" button
3. Click it - browser should prompt for fingerprint/face/PIN
4. Verify login works
