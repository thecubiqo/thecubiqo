# 🎨 Visual Testing Quick Reference - Sprint 1

**Tester:** PUSHPA  
**Focus:** UI/UX, Animations, Visual Design, Accessibility

---

## 🎯 Quick Visual Checks

### 1. Voice State Machine - Color Coding
| State | Color | Icon | Visual Cue |
|-------|-------|------|------------|
| READY | 🟠 Orange | Cube idle | Waiting for input |
| LISTENING | 🔴 Red | Pulse animation | Recording audio |
| THINKING | 🟡 Yellow | Rotating | AI processing |
| SPEAKING | 🟢 Green | Glowing | Playing TTS |

**Test:** Click mic → See red → Speak → See yellow → See green → See orange

---

### 2. BYO Settings Panel

**Layout Check:**
```
┌─────────────────────────────────────┐
│ BYO API Settings                     │
├─────────────────────────────────────┤
│ [x] Enable BYO Mode                  │
│                                      │
│ Claude API Key:                      │
│ [sk-ant-...] [👁] [Test Connection] │
│ ✓ Valid format                       │
│                                      │
│ OpenAI API Key:                      │
│ [sk-...] [👁] [Test Connection]      │
│ ✓ Valid format                       │
│                                      │
│ [Save] [Delete] [Cancel]             │
└─────────────────────────────────────┘
```

**Visual Elements:**
- [ ] Show/hide eye icon works
- [ ] Validation icons (✓ / ✗)
- [ ] Test connection button
- [ ] Loading spinner during test
- [ ] Success message (green checkmark)
- [ ] Error message (red X)

---

### 3. Consent Dialog

**Layout Check:**
```
┌─────────────────────────────────────┐
│         Browser Consent             │
├─────────────────────────────────────┤
│ 🌐 Domain: example.com               │
│ 🖱️ Action: Navigate                  │
│ Purpose: Extract product data        │
│                                      │
│ [Screenshot Preview]                 │
│                                      │
│ ⏱️ 60 seconds remaining               │
│                                      │
│ [x] Remember this choice             │
│                                      │
│ [Approve] [Deny]                     │
└─────────────────────────────────────┘
```

**Visual Elements:**
- [ ] Orange/red gradient header
- [ ] Icons for domain/action
- [ ] Countdown timer (updates every second)
- [ ] Screenshot preview (if available)
- [ ] Checkbox animation
- [ ] Button hover states
- [ ] Modal backdrop (semi-transparent)

---

## 🎨 Color Palette Verification

| Color | Hex | Usage |
|-------|-----|-------|
| Orange | `#f97316` | READY state, accent |
| Red | `#ef4444` | LISTENING state, errors |
| Yellow | `#f59e0b` | THINKING state, warnings |
| Green | `#10b981` | SPEAKING state, success |
| Gray | `#6b7280` | Neutral, disabled |
| White | `#ffffff` | Text on dark bg |
| Black | `#000000` | Text on light bg |

**Test:** Use browser DevTools color picker to verify hex codes

---

## 📐 Spacing & Typography

### Spacing (Tailwind Scale)
- [ ] Padding: 2, 3, 4, 6 units consistent
- [ ] Margins: 2, 3, 4, 6 units consistent
- [ ] Gap in flex/grid: 2, 3, 4 units

### Typography
| Element | Size | Weight |
|---------|------|--------|
| H1 | 2xl (24px) | bold |
| H2 | xl (20px) | bold |
| Body | base (16px) | normal |
| Small | sm (14px) | normal |
| Tiny | xs (12px) | normal |

---

## 🎭 Animation Checklist

### Voice State Transitions
- [ ] Smooth color fade (300ms ease-in-out)
- [ ] Cube rotation sync
- [ ] Pulse animation (listening)
- [ ] Glow effect (speaking)
- [ ] No janky transitions

### Consent Dialog
- [ ] Fade in on open (200ms)
- [ ] Fade out on close (150ms)
- [ ] Backdrop blur
- [ ] Modal slide up (optional)

### BYO Settings
- [ ] Button hover lift (scale 1.05)
- [ ] Input focus border glow
- [ ] Success/error message fade in
- [ ] Loading spinner rotation

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations should be disabled or simplified */
}
```
**Test:** Enable "Reduce motion" in OS settings → Verify animations disabled

---

## ♿ Accessibility Quick Checks

### Keyboard Navigation
1. Press `Tab` → Should cycle through interactive elements
2. Press `Enter` → Should activate buttons
3. Press `Escape` → Should close dialog
4. Press `Space` → Should toggle checkboxes

### Focus Indicators
- [ ] All interactive elements have visible focus (2px ring)
- [ ] Focus ring color has 3:1 contrast
- [ ] Tab order is logical (top to bottom, left to right)

### Screen Reader
**macOS:** Cmd+F5 to enable VoiceOver  
**Windows:** Win+Ctrl+Enter to enable Narrator

**Test:**
- [ ] All buttons have labels
- [ ] All inputs have labels
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Dialog announced when opening

### Color Contrast
**Tool:** Chrome DevTools → Lighthouse → Accessibility

**Minimum:**
- Normal text: 4.5:1
- Large text: 3:1
- UI components: 3:1

**Test:**
- [ ] Body text on white bg: 4.5:1
- [ ] Button text on colored bg: 4.5:1
- [ ] Disabled text: 3:1 (acceptable)

---

## 📱 Responsive Design Breakpoints

### Mobile (< 640px)
- [ ] Single column layout
- [ ] Touch targets ≥ 44x44px
- [ ] Text readable (min 16px)
- [ ] No horizontal scroll
- [ ] Buttons stacked vertically
- [ ] Consent dialog fits screen

### Tablet (640px - 1024px)
- [ ] Two column layout (optional)
- [ ] Comfortable spacing
- [ ] Touch-friendly
- [ ] Landscape mode works

### Desktop (> 1024px)
- [ ] Multi-column layout
- [ ] Mouse hover states
- [ ] Keyboard shortcuts (optional)
- [ ] Large screen utilization

---

## 🔍 Browser DevTools Checks

### Console (F12)
- [ ] No red errors
- [ ] No yellow warnings (or acceptable ones)
- [ ] No `Failed to load resource`
- [ ] No CORS errors

### Network Tab
- [ ] API calls succeed (200/201)
- [ ] No 404 errors
- [ ] No 500 errors
- [ ] Fast response times (< 300ms)

### Performance Tab
- [ ] 60fps animations
- [ ] No memory leaks
- [ ] No excessive repaints
- [ ] Smooth scrolling

### Lighthouse Report
- [ ] Performance: ≥ 90
- [ ] Accessibility: ≥ 95
- [ ] Best Practices: ≥ 90
- [ ] SEO: ≥ 80

---

## 🐛 Common Visual Bugs to Look For

### Layout Issues
- [ ] Text overflow (use ellipsis)
- [ ] Broken grid/flexbox
- [ ] Overlapping elements
- [ ] Z-index conflicts (modals)
- [ ] Incorrect alignment

### Animation Issues
- [ ] Janky transitions
- [ ] Animation doesn't complete
- [ ] Flashing/flickering
- [ ] Animations on wrong elements
- [ ] No animation fallback

### Color Issues
- [ ] Wrong color used
- [ ] Low contrast
- [ ] Color-only indicators (need icon too)
- [ ] Inconsistent theming

### Typography Issues
- [ ] Wrong font size
- [ ] Wrong font weight
- [ ] Poor line height
- [ ] Text not readable
- [ ] Inconsistent spacing

### Responsiveness Issues
- [ ] Broken on mobile
- [ ] Horizontal scroll
- [ ] Tiny touch targets (< 44px)
- [ ] Text too small (< 16px mobile)
- [ ] Image not responsive

---

## 📸 Screenshot Checklist

**Take screenshots of:**
1. ✅ Voice state - READY (orange)
2. ✅ Voice state - LISTENING (red)
3. ✅ Voice state - THINKING (yellow)
4. ✅ Voice state - SPEAKING (green)
5. ✅ BYO Settings - Empty state
6. ✅ BYO Settings - Filled with validation
7. ✅ BYO Settings - Success message
8. ✅ BYO Settings - Error message
9. ✅ Consent Dialog - With screenshot
10. ✅ Consent Dialog - Countdown in progress
11. ✅ Consent Dialog - Remember checkbox
12. ✅ Mobile view - Voice states
13. ✅ Mobile view - BYO Settings
14. ✅ Mobile view - Consent Dialog
15. ✅ Tablet view - All features

**Tool:** Browser screenshot (Cmd+Shift+5 macOS, Win+Shift+S Windows)

---

## 🎬 Video Recording Checklist

**Record videos of:**
1. ✅ Complete voice state cycle (idle → listening → thinking → speaking → idle)
2. ✅ BYO settings flow (open → fill → test → save)
3. ✅ Consent dialog flow (open → countdown → approve → close)
4. ✅ Mobile responsiveness (resize browser)
5. ✅ Keyboard navigation (Tab through all elements)

**Tool:** Screen recorder (QuickTime macOS, Xbox Game Bar Windows)

---

## ✅ Final Visual Checklist

Before marking Sprint 1 visual testing as complete:

### Design System
- [ ] Colors match design tokens
- [ ] Typography consistent
- [ ] Spacing consistent (Tailwind)
- [ ] Icons consistent (lucide-react)
- [ ] Borders/shadows consistent

### Animations
- [ ] All animations smooth (60fps)
- [ ] Timing functions correct (ease-in-out)
- [ ] Durations appropriate (150-300ms)
- [ ] Reduced motion support
- [ ] No flashing/seizure risk

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Focus indicators visible
- [ ] Color contrast passes

### Responsiveness
- [ ] Mobile (< 640px) works
- [ ] Tablet (640-1024px) works
- [ ] Desktop (> 1024px) works
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44px

### Cross-Browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 🎯 Priority Issues to Catch

### P0 - Critical (Block deployment)
- [ ] Feature completely broken
- [ ] Cannot use keyboard
- [ ] Cannot use screen reader
- [ ] App crashes

### P1 - High (Fix before deployment)
- [ ] Visual bug on main feature
- [ ] Animation janky
- [ ] Color contrast fails
- [ ] Mobile broken

### P2 - Medium (Fix in next sprint)
- [ ] Minor visual inconsistency
- [ ] Animation too fast/slow
- [ ] Small spacing issue
- [ ] Minor responsiveness issue

### P3 - Low (Nice to have)
- [ ] Suggestion for improvement
- [ ] Enhancement idea
- [ ] Documentation update

---

**Quick Test Time Estimate:**
- Voice States: 5 minutes
- BYO Settings: 10 minutes
- Consent Dialog: 5 minutes
- Responsiveness: 10 minutes
- Accessibility: 15 minutes
- Cross-Browser: 20 minutes

**Total: ~65 minutes for comprehensive visual testing**

---

*"1px matters. 60fps matters. Accessibility matters. Test it all."*  
— **PUSHPA** 🎨
