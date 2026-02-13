# CubiQo Production Test Plan

## Pre-Deployment Checklist

### Build & Environment
- [ ] `npm run build` passes with 0 errors
- [ ] All environment variables configured in Vercel
- [ ] .env.prod-a configured for admin deployment
- [ ] .env.prod-b configured for public deployment

### Prod-A (Admin) Tests
- [ ] Login with admin credentials
- [ ] User management dashboard loads
- [ ] API key configuration UI works
- [ ] Analytics dashboard displays data
- [ ] Spending caps can be set/modified
- [ ] Rate limiting controls functional

### Prod-B (Public) Tests
- [ ] Voice recording starts/stops correctly
- [ ] Audio transcription works
- [ ] AI responses generate (BYO keys mode)
- [ ] Cube visualization responds to interaction
- [ ] Energy flows animate smoothly
- [ ] Color shifts match emotional tone
- [ ] Rate limiting enforces properly

### AI Integration
- [ ] Anthropic/Claude via Emergent works
- [ ] OpenAI via Emergent works
- [ ] Voice synthesis (ElevenLabs) works
- [ ] Model switching functions correctly

### Auth & Security
- [ ] Supabase auth login/logout
- [ ] Session persistence works
- [ ] Protected routes require auth
- [ ] API keys stored securely

### Performance
- [ ] Page load < 3s
- [ ] Voice latency < 500ms
- [ ] Cube animations smooth (60fps)
- [ ] No memory leaks

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Safari
- [ ] Firefox
- [ ] Mobile browsers

## Post-Deployment Verification
- [ ] admin.cubiqo.com loads
- [ ] cubiqo.com loads
- [ ] SSL certificates valid
- [ ] DNS configured correctly
- [ ] Analytics tracking active
- [ ] Error logging functional

## Critical Paths to Test

### User Journey 1: New User (Public)
1. Visit cubiqo.com
2. Click "Try CubiQo"
3. Grant microphone permission
4. Enter API keys (BYO mode)
5. Record voice message
6. Receive AI response with TTS
7. Watch cube visualization

### User Journey 2: Admin Access
1. Visit admin.cubiqo.com
2. Login with admin credentials
3. View analytics dashboard
4. Configure API keys
5. Set spending cap
6. View user list
7. Manage rate limits

## Known Issues / Limitations
- Only UK region configured (US, EU need region JSON files)
- Supabase credentials need real values (currently placeholders)
- Some staging features may need additional testing
