# Speaker Button Troubleshooting Guide

## 🎤 Speaker/Microphone Button Not Working

### Quick Diagnosis

**Button Location:** Bottom center of the screen (microphone icon)

**Expected Behavior:**
1. Click button → Microphone activates
2. Cube changes color (listening state)
3. Speak → Text appears
4. AI responds

**Current Issue:** Button not responding when tapped

---

## 🔍 Root Cause Analysis

### 1. Browser Compatibility Issue

**Web Speech API Support:**
- ✅ Chrome/Chromium (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)
- ✅ Safari (iOS 14.5+, macOS 12+)
- ❌ Firefox (No support)
- ❌ Opera (Limited support)

**Check Browser:**
```javascript
// Open browser console and run:
console.log('Speech Recognition:', 
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
)
```

### 2. Microphone Permission Not Granted

**Common Causes:**
- User clicked "Block" on permission prompt
- Browser settings deny microphone access
- System permissions not granted

**Check Permission:**
```javascript
// Open browser console and run:
navigator.permissions.query({ name: 'microphone' }).then(result => {
  console.log('Microphone permission:', result.state)
  // Result: 'granted', 'denied', or 'prompt'
})
```

### 3. HTTPS Required

**Web Speech API requires HTTPS:**
- ✅ https://www.cubiqo.ai (Has SSL)
- ❌ http://localhost (Won't work in production)
- ⚠️ http://localhost:3000 (Works in dev mode only)

### 4. Audio Context Issue

**Safari Specific:**
- Requires user interaction to unlock audio
- First click might not work
- Need to initialize audio context on first interaction

---

## 🔧 Debugging Steps

### Step 1: Check Browser Console

1. Open www.cubiqo.ai
2. Press F12 (or right-click → Inspect)
3. Go to Console tab
4. Look for errors when clicking speaker button

**Common Errors:**
```
"Speech recognition not supported"
→ Wrong browser, use Chrome/Safari

"Microphone permission denied"
→ User needs to allow microphone

"NotAllowedError: Permission denied"
→ Browser blocked microphone access

"SecurityError: getUserMedia requires secure connection"
→ Not using HTTPS (shouldn't happen on www.cubiqo.ai)
```

### Step 2: Check Microphone Permission

**Chrome:**
1. Click padlock icon in address bar
2. Check "Microphone" permission
3. Should be "Allow" or "Ask"
4. If "Block", change to "Allow" and reload

**Safari:**
1. Safari → Settings → Websites → Microphone
2. Find cubiqo.ai
3. Change to "Allow"
4. Reload page

**Edge:**
1. Settings → Site permissions → Microphone
2. Find cubiqo.ai
3. Change to "Allow"
4. Reload page

### Step 3: Test Voice Functionality

1. Click speaker/microphone button
2. Browser should show "Allow microphone?" prompt
3. Click "Allow"
4. Speak into microphone
5. Transcript should appear

**If no prompt appears:**
- Permission already denied
- Check browser settings
- Clear site data and try again

### Step 4: Check Vercel Logs

1. Go to Vercel Dashboard
2. Select cubiqo project
3. Click latest deployment
4. View "Runtime Logs"

**Look for:**
- Voice API errors
- Speech recognition initialization errors
- Audio context errors

---

## 🛠️ Fixes to Apply

### Fix 1: Add Browser Compatibility Check

**File:** `src/components/FullscreenApp.tsx`

Add warning for unsupported browsers:

```typescript
// After line 30
const [browserSupported, setBrowserSupported] = useState(true)

useEffect(() => {
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  setBrowserSupported(isSupported)
  
  if (!isSupported) {
    console.warn('Speech Recognition not supported in this browser')
  }
}, [])
```

### Fix 2: Add Permission Request UI

Show clear message when permission is needed:

```typescript
const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

useEffect(() => {
  if (typeof window !== 'undefined' && navigator.permissions) {
    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then(result => {
        setMicPermission(result.state as any)
        result.onchange = () => {
          setMicPermission(result.state as any)
        }
      })
      .catch(() => {
        // Permissions API not supported, assume prompt
        setMicPermission('prompt')
      })
  }
}, [])
```

### Fix 3: Add Error Handling

Catch and display errors to user:

```typescript
const handleVoiceClick = () => {
  if (!browserSupported) {
    alert('Voice input not supported in this browser. Please use Chrome, Edge, or Safari.')
    return
  }
  
  if (micPermission === 'denied') {
    alert('Microphone access denied. Please enable microphone in browser settings.')
    return
  }
  
  // Existing voice toggle logic
  if (appState === 'listening') {
    stopListening()
  } else {
    startListening()
  }
}
```

### Fix 4: Safari Audio Context Unlock

Ensure audio context is unlocked on first interaction:

```typescript
const unlockAudio = useCallback(() => {
  if (typeof window !== 'undefined' && 'AudioContext' in window) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContext()
    
    // Play silent sound to unlock
    const buffer = audioContext.createBuffer(1, 1, 22050)
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    source.start(0)
    
    console.log('Audio context unlocked')
  }
}, [])

// Call on first user interaction
useEffect(() => {
  const handler = () => {
    unlockAudio()
    document.removeEventListener('click', handler)
  }
  document.addEventListener('click', handler)
  return () => document.removeEventListener('click', handler)
}, [unlockAudio])
```

---

## 🧪 Testing Checklist

### Test in Different Browsers:

- [ ] Chrome (Desktop) - Should work ✅
- [ ] Chrome (Mobile) - Should work ✅
- [ ] Safari (iOS) - Should work ✅
- [ ] Safari (macOS) - Should work ✅
- [ ] Edge (Desktop) - Should work ✅
- [ ] Firefox - Show "not supported" message ⚠️

### Test Permission States:

- [ ] First visit (prompt) - Show permission request ✅
- [ ] Permission granted - Button works ✅
- [ ] Permission denied - Show error message ⚠️
- [ ] Permission revoked - Handle gracefully ⚠️

### Test Functionality:

- [ ] Click button - Activates microphone ✅
- [ ] Speak - Transcript appears ✅
- [ ] Stop button - Stops listening ✅
- [ ] Multiple clicks - Toggles correctly ✅

---

## 📊 Current Implementation Status

### What's Working:

- ✅ Voice recognition hook (`useSpeechRecognition.ts`)
- ✅ Voice button UI (`FullscreenApp.tsx`)
- ✅ Audio context management
- ✅ State machine (idle → listening → thinking → speaking)

### What Needs Fixing:

- ⚠️ Browser compatibility check
- ⚠️ Permission error handling
- ⚠️ User feedback for denied permissions
- ⚠️ Safari audio context unlock (may be missing)

---

## 🚀 Deployment Steps

### After Implementing Fixes:

1. **Test Locally:**
   ```bash
   npm run dev
   # Test on http://localhost:3000
   ```

2. **Test Production Build:**
   ```bash
   npm run build
   npm start
   # Test on http://localhost:3000
   ```

3. **Commit Changes:**
   ```bash
   git add .
   git commit -m "Fix speaker button with permission handling and browser checks"
   git push origin copilot/debug-code-issues
   ```

4. **Merge to Main:**
   - Create PR to main
   - Merge and deploy

5. **Test on Production:**
   - Visit www.cubiqo.ai
   - Test speaker button
   - Check different browsers
   - Verify error messages

---

## 📝 Expected Behavior After Fix

### User Flow:

1. **First Visit:**
   - User clicks speaker button
   - Browser shows "Allow microphone?" prompt
   - User clicks "Allow"
   - Button activates, listening starts

2. **Subsequent Visits:**
   - User clicks speaker button
   - Button immediately activates
   - No permission prompt (already granted)

3. **Permission Denied:**
   - User clicks speaker button
   - Clear error message appears
   - Instructions to enable microphone
   - Link to browser settings

4. **Unsupported Browser:**
   - User visits in Firefox
   - Warning message on page load
   - Button shows "Not supported" tooltip
   - Suggests using Chrome/Safari

---

## 🔗 Related Code Files

- `src/hooks/useSpeechRecognition.ts` - Voice recognition logic
- `src/hooks/useElevenLabsTTS.ts` - Text-to-speech
- `src/components/FullscreenApp.tsx` - Main app with voice button
- `src/lib/audio/audioContext.ts` - Audio context management

---

## 📞 Quick Support Commands

### Check Voice Support:
```javascript
console.log('Voice support:', 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
```

### Check Mic Permission:
```javascript
navigator.permissions.query({ name: 'microphone' }).then(r => console.log('Mic:', r.state))
```

### Test Recognition:
```javascript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
recognition.start()
recognition.onresult = (e) => console.log('Said:', e.results[0][0].transcript)
```

---

**Status:** 🔧 Ready to implement fixes

**Priority:** 🟡 High (after auth fixes are merged)

**Estimated Time:** 1-2 hours to implement and test
