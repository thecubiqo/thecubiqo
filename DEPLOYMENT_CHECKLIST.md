# CubiQo Completion Checklist - Deploy One by One

**Goal:** Achieve 100% Clawdbot parity + Complete Founder Portal

**Strategy:** Small, testable deployments. Each item = one commit + one deploy.

---

## 🔴 CRITICAL (Must Have)

### ✅ DONE
- [x] Core agent engine
- [x] Basic Founder Portal UI
- [x] Session cookie handling for auth
- [x] Connections tab (GitHub + Vercel)
- [x] Feature toggles tab

### 🚧 IN PROGRESS

#### 1. Agent-to-Agent Messaging Tool
**Priority:** CRITICAL  
**Status:** Not started  
**Estimated Time:** 2 hours  
**Deliverable:** Agents can send messages to each other

**Steps:**
- [ ] Create `sessions_send` tool in `src/lib/engine/tools/sessions-send.ts`
- [ ] Add to tool registry
- [ ] Test: Henry sends message to Dev
- [ ] Deploy

#### 2. Session Compaction/Pruning
**Priority:** CRITICAL  
**Status:** Not started  
**Estimated Time:** 2 hours  
**Deliverable:** Long conversations don't eat all tokens

**Steps:**
- [ ] Implement compaction logic in `src/lib/engine/session.ts`
- [ ] Add `/api/sessions/[id]/compact` endpoint
- [ ] Trigger compaction at 75% token limit
- [ ] Test with long conversation
- [ ] Deploy

#### 3. Telegram Channel Integration
**Priority:** CRITICAL  
**Status:** Was working, got reverted  
**Estimated Time:** 2 hours  
**Deliverable:** CubiQo works via Telegram

**Steps:**
- [ ] Restore `/api/telegram/webhook` route
- [ ] Restore Telegram bot setup
- [ ] Add Telegram config to Founder Portal Connections
- [ ] Test: Send message to bot, get response
- [ ] Deploy

---

## 🟡 IMPORTANT (Should Have)

#### 4. Supabase pgvector Setup
**Priority:** HIGH  
**Status:** Not started  
**Estimated Time:** 1 hour  
**Deliverable:** Semantic memory search works

**Steps:**
- [ ] Enable pgvector extension in Supabase
- [ ] Create embeddings table with vector column
- [ ] Update memory.ts to use vector search
- [ ] Test memory search with similar queries
- [ ] Deploy

#### 5. WhatsApp Channel Integration
**Priority:** HIGH  
**Status:** Not started  
**Estimated Time:** 3 hours  
**Deliverable:** CubiQo works via WhatsApp

**Steps:**
- [ ] Set up WhatsApp Business API
- [ ] Create `/api/whatsapp/webhook` route
- [ ] Add WhatsApp config to Founder Portal
- [ ] Test: Send WhatsApp message, get response
- [ ] Deploy

#### 6. Vision/Image Analysis
**Priority:** MEDIUM  
**Status:** Not started  
**Estimated Time:** 2 hours  
**Deliverable:** Agents can analyze images

**Steps:**
- [ ] Add vision tool using GPT-4V or Claude
- [ ] Create `/api/tools/vision` endpoint
- [ ] Test: Upload image, get description
- [ ] Add to tool registry
- [ ] Deploy

---

## 🟢 NICE TO HAVE (Could Have)

#### 7. Discord Channel
**Priority:** LOW  
**Status:** Not started  
**Estimated Time:** 2 hours  
**Steps:**
- [ ] Create Discord bot
- [ ] Add webhook endpoint
- [ ] Add to Connections panel
- [ ] Test & Deploy

#### 8. Slack Channel
**Priority:** LOW  
**Status:** Not started  
**Estimated Time:** 2 hours  
**Steps:**
- [ ] Create Slack app
- [ ] Add webhook endpoint
- [ ] Add to Connections panel
- [ ] Test & Deploy

#### 9. Email Channel
**Priority:** LOW  
**Status:** Not started  
**Estimated Time:** 2 hours  
**Steps:**
- [ ] Set up email parsing (SendGrid/Mailgun)
- [ ] Add inbound email handler
- [ ] Add to Connections panel
- [ ] Test & Deploy

---

## 🎨 FOUNDER PORTAL ENHANCEMENTS

#### 10. GitHub Connection Flow
**Priority:** HIGH  
**Status:** UI built, needs OAuth  
**Estimated Time:** 1 hour  
**Steps:**
- [ ] Set up GitHub OAuth app
- [ ] Create `/api/admin/connections/github/callback`
- [ ] Store access token securely
- [ ] Show connected repos
- [ ] Deploy

#### 11. Vercel Connection Flow
**Priority:** HIGH  
**Status:** UI built, needs OAuth  
**Estimated Time:** 1 hour  
**Steps:**
- [ ] Set up Vercel OAuth integration
- [ ] Create `/api/admin/connections/vercel/callback`
- [ ] Show deployment status
- [ ] Enable one-click deploys
- [ ] Deploy

#### 12. Integration Toggles with Persistence
**Priority:** MEDIUM  
**Status:** UI exists, needs backend  
**Estimated Time:** 2 hours  
**Steps:**
- [ ] Add integration settings to user_integrations table
- [ ] Create API to save toggle states
- [ ] Load toggle states on page load
- [ ] Test: Toggle Gmail read, verify tools filtered
- [ ] Deploy

---

## 📊 DEPLOYMENT ORDER

**Week 1 (Critical Path):**
1. Agent-to-Agent Messaging ← Deploy
2. Session Compaction ← Deploy
3. Telegram Integration ← Deploy
4. GitHub Connection Flow ← Deploy
5. Vercel Connection Flow ← Deploy

**Week 2 (Important Features):**
6. Supabase pgvector ← Deploy
7. WhatsApp Integration ← Deploy
8. Vision/Image Analysis ← Deploy
9. Integration Toggle Persistence ← Deploy

**Week 3 (Nice to Have):**
10. Discord Channel ← Deploy
11. Slack Channel ← Deploy
12. Email Channel ← Deploy

---

## 📝 DEPLOYMENT PROTOCOL

**For each item:**
1. ✅ Build feature
2. ✅ Test locally
3. ✅ Commit with clear message
4. ✅ Push to GitHub
5. ✅ Deploy to Vercel production
6. ✅ Test on live site
7. ✅ Mark as complete
8. ✅ Move to next item

**No batch deploys. One feature = One deployment.**

---

## 🎯 SUCCESS CRITERIA

**100% Clawdbot Parity:**
- [ ] All 35 requirements completed
- [ ] All channels working
- [ ] All tools functional
- [ ] Memory search semantic
- [ ] Vision support enabled

**Complete Founder Portal:**
- [ ] GitHub connected
- [ ] Vercel connected
- [ ] Feature toggles persist
- [ ] Integration toggles work
- [ ] Clean, professional UI

**Total Estimated Time:** ~25 hours of focused work

**Completion Target:** End of Week 2 (2026-02-21)

---

**Current Status:** Ready to begin deployment sequence!
