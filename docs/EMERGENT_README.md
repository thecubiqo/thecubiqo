# Emergent-Level AI App Builder - Architecture Documentation

**Project:** CubiQo Emergent AI App Builder + Post-Launch OS  
**Author:** MO (CTO/Tech Architect)  
**Date:** February 18, 2025  
**Status:** Architecture Design Complete

---

## 📚 Documentation Index

This directory contains the comprehensive architecture documentation for the Emergent-Level AI App Builder project.

### Core Architecture Documents

1. **[emergent-architecture.md](./emergent-architecture.md)** (54KB)
   - Overall system architecture
   - Three-layer design (Control Plane, Orchestrator, Runner)
   - Architecture diagrams (ASCII/Mermaid)
   - Component specifications
   - Data flow diagrams
   - Technology stack
   - Integration architecture
   - Deployment strategy
   - Scalability & performance
   - Future roadmap

2. **[emergent-tool-api.md](./emergent-tool-api.md)** (52KB)
   - Tool layer specification
   - Base tool interface
   - Bulk file operations (write, edit, view)
   - Testing sub-agent interface
   - Integration executor interface (Shopify, Stripe, etc.)
   - Image sub-agent interface
   - Human interaction interface ("Ask Human" tool)
   - Database sub-agent interface
   - Deployment tools
   - Monitoring & analytics tools
   - Error handling & retry logic
   - API security

3. **[emergent-security.md](./emergent-security.md)** (37KB)
   - Security overview & threat model
   - Security principles (Defense in Depth, Least Privilege, Zero Trust)
   - Secrets management architecture
   - Agent isolation (sub-agents cannot call each other)
   - Frontend security (XSS, CSRF, CSP)
   - Backend security (input validation, SQL injection prevention)
   - Runner security (sandbox isolation, command execution safety)
   - Database security (RLS, audit logging)
   - API security (authentication, authorization, rate limiting)
   - Network security (HTTPS, DDoS protection)
   - Compliance & audit (GDPR, SOC 2)
   - Incident response playbook
   - Security checklist

---

## 🎯 Quick Start Guide

### For Product Owners (JO)
Read **emergent-architecture.md** to understand:
- What we're building (system overview)
- Key features and capabilities
- Technology choices and trade-offs
- Deployment strategy
- Future roadmap

### For Developers (Blossom, Bubbles, Guy)
Read in order:
1. **emergent-architecture.md** - Understand the big picture
2. **emergent-tool-api.md** - Learn the API contracts
3. **emergent-security.md** - Understand security requirements

Focus on sections relevant to your role:
- **Blossom (Backend):** Control Plane API, Orchestrator, Tool implementations
- **Bubbles (Frontend):** UI components, Tool API consumption, Security (frontend section)
- **Guy (Database):** Database security, RLS policies, Audit logging

### For QA (Buttercup)
Read **emergent-security.md** to understand:
- Security testing requirements
- Attack vectors to test
- Validation rules
- Security checklist

### For UI/UX (Pushpa)
Read **emergent-architecture.md** sections:
- Frontend UI components
- User flows (build app, preview, deploy)
- Human interaction interface (design dialogs)

---

## 🏗️ System Overview

The Emergent platform enables users to build, deploy, and manage full-stack applications through natural language conversation.

### Three-Layer Architecture

```
┌─────────────────────────────────────┐
│       CONTROL PLANE                 │
│  (Portal Backend - Management)      │
│                                     │
│  Users • Projects • Billing         │
│  Secrets • Deployments • Domains    │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│       ORCHESTRATOR                  │
│  (Main Agent + Sub-Agents)          │
│                                     │
│  Request Parser → Task Planner      │
│  Tool Selector → Executor           │
│  Sub-agents: Code • Test • Image    │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│         RUNNER                      │
│  (Workspace Execution Environment)  │
│                                     │
│  Sandboxes • Terminal • Dev Servers │
│  Preview URLs • Build Tools         │
└─────────────────────────────────────┘
```

### Key Principles

1. **Separation of Concerns** - Clear boundaries between components
2. **Agent Isolation** - Sub-agents cannot directly communicate
3. **Security-First** - Secrets never exposed to frontend
4. **Stateless Orchestration** - Main agent coordinates but doesn't store state
5. **Sandboxed Execution** - Isolated workspaces with resource limits
6. **Audit Everything** - All operations logged

---

## 🔐 Security Highlights

### Critical Rules

1. **⚠️ Secrets NEVER in Frontend Code**
   - Frontend code is visible to anyone
   - All secrets stored server-side, encrypted
   - Secrets injected into runner at runtime

2. **⚠️ Sub-Agents Cannot Call Other Sub-Agents**
   - All coordination flows through Main Agent
   - Prevents infinite loops and untracked operations
   - Ensures audit trail and cost tracking

3. **⚠️ Always Validate User Input**
   - Never trust user input
   - Use Zod for schema validation
   - Sanitize before rendering or executing

4. **⚠️ Always Authenticate & Authorize**
   - Check JWT token on every API request
   - Verify user has access to project
   - Use RLS for database-level security

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui
- **Code Editor:** Monaco Editor
- **Terminal:** Xterm.js
- **3D Graphics:** Three.js, React Three Fiber

### Backend (Control Plane)
- **Framework:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Queue:** BullMQ + Redis
- **Email:** Resend
- **Payments:** Stripe

### Orchestrator (AI Agents)
- **AI Models:** Claude Sonnet 3.5, GPT-4o, Llama 3.3 70B
- **Framework:** LangChain / Custom agent loop
- **Vector DB:** Pinecone (for RAG)

### Runner (Workspace Execution)
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx (preview URLs)
- **Runtimes:** Node.js 20, Python 3.11, PHP 8.2, Ruby 3.2

### External Services
- **Hosting:** Vercel (Control Plane), AWS EC2 (Runner)
- **CDN:** Cloudflare
- **Monitoring:** Sentry, Vercel Analytics
- **Integrations:** Shopify, Printify, Stripe

---

## 📊 Implementation Phases

### Phase 1: MVP (Months 1-3) ✅
- Control Plane basic features
- Main Agent with Code + Test sub-agents
- Runner with Docker sandboxes
- Preview URLs
- Shopify + Stripe integrations

### Phase 2: Enhancement (Months 4-6)
- Image Sub-Agent
- Human Sub-Agent ("Ask Human" tool)
- Custom domain support
- Multi-language support (Python, PHP)
- Post-launch dashboards

### Phase 3: Scale (Months 7-9)
- Kubernetes orchestration
- Multi-region deployment
- Advanced monitoring
- Collaborative workspaces
- Marketplace

### Phase 4: Enterprise (Months 10-12)
- Self-hosted option
- SSO authentication
- Advanced RBAC
- SLA guarantees
- Dedicated support

---

## 🚀 Next Steps

### Immediate Actions (This Week)

1. **Review Architecture** (All Team)
   - Read all three documents
   - Ask questions in team meeting
   - Propose modifications if needed

2. **Break Down into Tasks** (MO)
   - Create GitHub issues for each component
   - Assign to team members based on expertise
   - Estimate story points

3. **Set Up Development Environment** (All Developers)
   - Install Docker
   - Set up Supabase local instance
   - Configure environment variables

4. **Start Phase 1 Implementation** (Week 2)
   - Blossom: Control Plane API
   - Bubbles: Frontend UI
   - Guy: Database schema + RLS policies
   - Buttercup: Test framework setup

### Weekly Cadence

- **Monday:** Sprint planning, task assignment
- **Wednesday:** Mid-week check-in, unblock developers
- **Friday:** Demo working features, retrospective

---

## 📝 Document Changelog

### v1.0.0 - February 18, 2025
- Initial architecture design complete
- Created three core documents
- Defined system architecture
- Specified tool API
- Documented security requirements

---

## 💬 Feedback & Questions

If you have questions or suggestions about the architecture:

1. **Technical Questions:** Ask MO (CTO) directly
2. **Product Questions:** Discuss with JO (Product Owner)
3. **Architecture Proposals:** Create RFC (Request for Comments) document
4. **Security Concerns:** Email security@cubiqo.com immediately

---

## 📖 Related Documentation

- [CubiQo Architecture](../ARCHITECTURE.md) - Current CubiQo system
- [Coding Agent API](./CODING_AGENT_API.md) - Existing code execution features
- [Phase 2 Coding Brief](../PHASE2_CODING_BRIEF.md) - Phase 2 requirements
- [Self-Heal System](./SELF_HEAL.md) - Self-healing capabilities

---

**Maintained By:** MO (CTO/Tech Architect)  
**Last Updated:** February 18, 2025  
**Status:** ✅ Ready for Review & Implementation
