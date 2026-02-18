# AI App Factory - Engineering Kickoff Guide

**Version:** 1.0  
**Date:** 2026-02-18  
**Audience:** Engineering Team

---

## 🎯 What We're Building

Transform CubiQo into an **Emergent-level AI App Factory** with:

1. **Prompt → HD Frontend → Preview** (in <2 minutes)
2. **Terminal + Live Preview** (real development environment)
3. **Deploy to Production** (one-click with custom domains)
4. **Post-Launch Portal** (analytics, SEO, commerce)

---

## 📚 Documentation Map

### Start Here
- **[AI_APP_FACTORY_ARCHITECTURE.md](./AI_APP_FACTORY_ARCHITECTURE.md)** - Complete system design
- **[EPIC_IMPLEMENTATION_GUIDE.md](./EPIC_IMPLEMENTATION_GUIDE.md)** - Detailed Epic 1-3 specs
- **[SECURITY_COMPLIANCE_REQUIREMENTS.md](./SECURITY_COMPLIANCE_REQUIREMENTS.md)** - Security requirements

### Reference
- **[FEATURE_LOCATION_MAP.md](./FEATURE_LOCATION_MAP.md)** - Current codebase features
- **[INTEGRATIONS_MAP.md](./INTEGRATIONS_MAP.md)** - Existing integrations

---

## 🏗️ System Architecture (30-Second Version)

```
┌─────────────────────────────────────────────┐
│         CONTROL PLANE (Vercel)              │
│  • Users, Orgs, Projects                    │
│  • Secrets Management (encrypted)           │
│  • Deployment Triggers                      │
│  • Post-Launch Portal                       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       ORCHESTRATOR (Agent Loop)             │
│  • Main Agent (plan/execute/retry)          │
│  • Sub-Agents (files/tests/integrations)    │
│  • Tool Registry                            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        DATA PLANE (Containers)              │
│  • Isolated Workspaces                      │
│  • Terminal (WebSocket)                     │
│  • Preview Servers                          │
│  • Build/Test Runners                       │
└─────────────────────────────────────────────┘
```

---

## 👥 Team Structure

### Team 1: Control Plane (Backend + Platform)
**Lead:** Backend Engineer  
**Focus:** Epic 1 - Foundations
- Auth, orgs, projects
- Secrets management
- Database schema + RLS
- API routes

### Team 2: Data Plane (Infrastructure)
**Lead:** Infrastructure Engineer  
**Focus:** Epic 2 - Runner
- Container orchestration
- Terminal gateway (WebSocket)
- Preview proxy
- Log streaming

### Team 3: Studio UI (Frontend)
**Lead:** Frontend Engineer  
**Focus:** Epic 3 - HD Frontend-First
- File explorer, Monaco editor
- Preview frame, Terminal UI
- AI chat panel
- Design system generator

### Team 4: Orchestrator (AI/Backend)
**Lead:** AI/ML Engineer  
**Focus:** Epic 4 - Agent Loop
- Main agent loop
- Tool registry
- Sub-agent coordination
- Retry logic

### Team 5: Integrations (Full-Stack)
**Lead:** Integrations Engineer  
**Focus:** Epic 6 - Playbooks
- Playbook schema + executor
- Shopify, Printify playbooks
- Webhook handlers
- Commerce console

---

## 🚀 MVP Implementation Plan (16 Weeks)

### Phase 1: Foundation (Weeks 1-2)
**Epic 1: Tenancy + Secrets**

**Team 1 Deliverables:**
- [ ] Database migrations (orgs, projects, env_vars)
- [ ] Supabase RLS policies
- [ ] API routes (orgs, projects, env vars)
- [ ] Secrets encryption (pgcrypto)
- [ ] Audit logging
- [ ] RBAC middleware

**Acceptance:** User can create org/project, add env vars (encrypted), secrets never exposed to client

---

### Phase 2: Runner Infrastructure (Weeks 3-4)
**Epic 2: Terminal + Preview**

**Team 2 Deliverables:**
- [ ] Docker workspace image
- [ ] Container manager service
- [ ] Terminal gateway (WebSocket)
- [ ] Preview proxy service
- [ ] Log streamer
- [ ] Resource quotas + isolation

**Acceptance:** User can open terminal, run commands, start dev server, see live preview

---

### Phase 3: Studio UI (Weeks 5-6)
**Epic 3: HD Frontend-First**

**Team 3 Deliverables:**
- [ ] Studio layout component
- [ ] File explorer with tree view
- [ ] Monaco editor integration
- [ ] Terminal UI component
- [ ] Preview frame with responsive modes
- [ ] AI chat panel
- [ ] Design system generator

**Acceptance:** User enters prompt, gets HD frontend preview in <2 minutes with animations

---

### Phase 4: Orchestrator (Weeks 7-8)
**Epic 4: Agent Loop**

**Team 4 Deliverables:**
- [ ] Main agent loop (plan → execute → retry)
- [ ] Tool registry
- [ ] File operation tools (bulk read/write)
- [ ] Testing sub-agents
- [ ] Integration sub-agent
- [ ] Error correction logic

**Acceptance:** Agent can scaffold project, run tests, self-correct on failures

---

### Phase 5: Deployments (Weeks 9-10)
**Epic 5: Preview → Production**

**Team 1 + 2 Deliverables:**
- [ ] Deployment pipeline
- [ ] Vercel integration
- [ ] Domain management + SSL
- [ ] Continuous deployment
- [ ] Rollback capability
- [ ] Deployment status UI

**Acceptance:** User can deploy to production with custom domain from working preview

---

### Phase 6: Integration Framework (Weeks 11-12)
**Epic 6: Playbooks**

**Team 5 Deliverables:**
- [ ] Playbook schema definition
- [ ] Playbook executor
- [ ] Verification system (verified/unverified)
- [ ] Shopify playbook
- [ ] Printify playbook
- [ ] Webhook handlers

**Acceptance:** User can add Shopify integration via playbook, receive webhook events

---

### Phase 7: Post-Launch Portal (Weeks 13-14)
**Epic 7: Analytics + SEO + Commerce**

**Team 5 + 3 Deliverables:**
- [ ] Analytics ingestion API
- [ ] Analytics dashboards
- [ ] SEO audit tools
- [ ] Commerce operations console
- [ ] Hosting management UI

**Acceptance:** Deployed app has analytics, SEO checks, and commerce dashboard

---

### Phase 8: Polish + Launch (Weeks 15-16)
**All Teams**
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Beta user testing
- [ ] Production launch

---

## 🔐 Critical Security Requirements

### Rule 1: Never Expose Secrets
```typescript
// ❌ WRONG - Secrets in frontend
const apiKey = 'sk-...';

// ✅ CORRECT - Server-side only
// /src/app/api/route.ts
const apiKey = process.env.OPENAI_API_KEY;
```

### Rule 2: Encrypt at Rest
- All secrets encrypted using pgcrypto
- Secrets never returned to client
- Rotation capability

### Rule 3: Workspace Isolation
- Separate containers per project
- Resource quotas enforced
- Network isolation
- No shared volumes

### Rule 4: Audit Everything
- Log all secret access
- Log deployments
- Log org/member changes
- Retention: 1 year

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// /src/__tests__/unit/
- secrets-encryption.test.ts
- rbac.test.ts
- workspace-isolation.test.ts
- webhook-verification.test.ts
```

### Integration Tests
```typescript
// /src/__tests__/integration/
- epic1-foundations.test.ts
- epic2-runner.test.ts
- epic3-studio.test.ts
- epic4-orchestrator.test.ts
```

### E2E Tests
```typescript
// /src/__tests__/e2e/
- user-flow-create-deploy.test.ts
- hd-frontend-generation.test.ts
- integration-shopify.test.ts
```

---

## 🎬 Week 1 Action Items

### Team 1 (Control Plane)
1. Set up Supabase project
2. Create database migrations for orgs/projects
3. Implement RLS policies
4. Build `/api/orgs` routes

### Team 2 (Data Plane)
1. Design Docker workspace image
2. Set up container orchestration
3. Plan WebSocket gateway architecture
4. Research preview proxy solutions

### Team 3 (Studio UI)
1. Design Studio layout mockups
2. Set up Monaco editor POC
3. Create design system generator spec
4. Build file explorer prototype

### Team 4 (Orchestrator)
1. Research agent frameworks (LangChain, AutoGPT)
2. Design main agent loop
3. Define tool interface
4. Plan sub-agent architecture

### Team 5 (Integrations)
1. Design playbook schema
2. Research Shopify API
3. Research Printify API
4. Define webhook security requirements

---

## 📊 Success Metrics

### Platform Health
- Uptime: 99.9%
- API latency: <200ms p95
- Preview generation: <60s
- Deploy time: <3min

### User Experience
- Time to first preview: <2min
- HD frontend satisfaction: >4.5/5
- Deploy success rate: >95%

### Business
- Active projects: Track growth
- Deployments/month: Track usage
- Integration adoption: % using playbooks

---

## 🆘 Getting Help

### Questions?
- **Architecture:** See AI_APP_FACTORY_ARCHITECTURE.md
- **Epic Details:** See EPIC_IMPLEMENTATION_GUIDE.md
- **Security:** See SECURITY_COMPLIANCE_REQUIREMENTS.md
- **Slack:** #ai-app-factory channel
- **Daily Standup:** 9:30 AM

### Code Reviews
- All PRs require 2 approvals
- Security-sensitive code requires security team review
- Integration changes require integration team review

---

## 🎯 This Week's Goals

**Week 1 (Feb 18-24):**
- ✅ Architecture review complete
- ✅ Documentation distributed
- [ ] Team kickoff meeting (Feb 19)
- [ ] Sprint 1 planning (Feb 20)
- [ ] Development environment setup (all teams)
- [ ] First PR: Database migrations (Team 1)

**Success Criteria:**
- All teams have clear understanding of architecture
- Development environments ready
- First code committed

---

## 🚦 Go/No-Go Checklist

Before starting implementation:
- [ ] All teams reviewed architecture docs
- [ ] All teams have access to Supabase project
- [ ] All teams have Docker set up locally
- [ ] Security requirements understood
- [ ] Testing strategy agreed upon
- [ ] Communication channels established
- [ ] Stakeholder sign-off obtained

---

**Let's build something amazing! 🚀**

---

**Document Owner:** Engineering Manager  
**Last Updated:** 2026-02-18  
**Questions:** dm in #ai-app-factory
