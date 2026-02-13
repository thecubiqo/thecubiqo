# CubiQo Production Merge Plan

## Current Status
- Branch `production` created from main (154509c)
- Attempted merge from staging → 29 conflicts detected
- Merge aborted - need strategic approach

## Branches to Integrate

### 1. origin/staging
**Key Commits:**
- Energy cube visual updates (FlowingEnergyCube)
- Supabase environment fixes
- Build error fixes

### 2. origin/ui/energy-cube-staging  
**Key Commits:**
- Wireframe energy cube design
- Zoom-only visuals

### 3. origin/develop
**Key Commits:**
- Deployment workflows
- Vercel configuration
- Auth system
- AI services layer
- Spending caps
- BYO API keys

## Strategy: Incremental Cherry-Pick

### Phase 1: Build Stability (Priority 1)
Pick commits that fix build errors:
- Supabase fallback values
- TypeScript error fixes
- Region list fixes

### Phase 2: Core Features (Priority 2)
- Energy cube visuals
- Voice modulation
- AI service layer updates

### Phase 3: Infrastructure (Priority 3)
- Deployment workflows
- Environment configs
- Auth system

### Phase 4: Admin Features (Priority 4)
- Admin dashboard
- API key management
- Analytics

## Conflict Resolution Strategy
1. Keep main's structure for critical files (package.json, tsconfig)
2. Accept staging's UI components where improved
3. Merge both versions of new features
4. Test after each group of cherry-picks

## Testing Checkpoints
- [ ] Build passes (`npm run build`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Core features work (chat, voice, cube)
- [ ] No TypeScript errors
- [ ] Environment configs valid

---

**Next Step:** Ed, do you want me to proceed with incremental cherry-picking, or should we get Windows Henry involved since he can test in real-time with browser access?
