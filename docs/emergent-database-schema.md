# Emergent Database Schema Documentation

**Version:** 1.0.0  
**Author:** GUY (Database Administrator)  
**Date:** February 18, 2026  
**Status:** Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Schema Organization](#schema-organization)
4. [Entity Relationship Diagrams](#entity-relationship-diagrams)
5. [Core Entities](#core-entities)
6. [Runner System](#runner-system)
7. [Integration Framework](#integration-framework)
8. [Post-Launch System](#post-launch-system)
9. [Security & Encryption](#security--encryption)
10. [Indexes & Performance](#indexes--performance)
11. [Row-Level Security (RLS)](#row-level-security-rls)
12. [Triggers & Functions](#triggers--functions)
13. [Data Retention](#data-retention)
14. [Migration Guide](#migration-guide)

---

## Overview

The Emergent platform database is designed to support a multi-tenant AI-powered app builder with comprehensive post-launch management capabilities. The schema is organized into four main domains:

1. **Foundations** - Core entities (users, organizations, projects, RBAC, billing)
2. **Runner** - Workspace execution (sandboxes, deployments, domains)
3. **Integrations** - Third-party services (Shopify, Stripe, OAuth, playbooks)
4. **Post-Launch** - Analytics, SEO, commerce, monitoring

### Technology Stack

- **Database:** PostgreSQL 15+ (via Supabase)
- **Extensions:** uuid-ossp, pgcrypto
- **Features:** Row-Level Security (RLS), JSON columns, triggers, views
- **Encryption:** AES-256-GCM for secrets

---

## Architecture Principles

### 1. Normalization (3NF Minimum)

All tables are normalized to at least Third Normal Form (3NF) to:
- Eliminate redundancy
- Ensure data integrity
- Optimize for updates

### 2. Multi-Tenancy

Organizations are the root entity for multi-tenancy:
```
Organization (root)
  └─ Projects
      ├─ Workspaces
      ├─ Deployments
      ├─ Integrations
      └─ Analytics
```

### 3. Soft Deletes

Critical entities use soft deletes (`deleted_at` timestamp) instead of hard deletes:
- Preserves audit trails
- Enables data recovery
- Maintains referential integrity

### 4. Audit Everything

Comprehensive logging via:
- `audit_logs` table for user actions
- `secret_access_logs` for security
- `integration_logs` for sync history
- Timestamps on all tables (`created_at`, `updated_at`)

### 5. Row-Level Security (RLS)

Every table has RLS policies enforcing:
- Users can only access their organization's data
- Role-based access control (owner, admin, member, viewer)
- Service role has elevated permissions

### 6. Performance-First Design

- Strategic indexes on foreign keys, timestamps, and query columns
- Composite indexes for common query patterns
- Materialized views for analytics (future optimization)
- Partitioning strategy for high-volume tables (analytics_events)

---

## Schema Organization

### Migration Files

```
supabase/migrations/
├── 20260218064853_emergent_foundations.sql   # Core entities
├── 20260218064854_emergent_runner.sql        # Runner system
├── 20260218064855_emergent_integrations.sql  # Integrations
└── 20260218064856_emergent_postlaunch.sql    # Post-launch features
```

### Total Schema Size

- **32 tables**
- **7 views**
- **15+ functions/triggers**
- **100+ indexes**

---

## Entity Relationship Diagrams

### High-Level ERD (Core System)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MULTI-TENANCY LAYER                         │
└─────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────┐
                    │  Organizations    │
                    │ ================  │
                    │ PK: id            │
                    │ FK: owner_id      │
                    │                   │
                    │ • name            │
                    │ • plan            │
                    │ • stripe_*        │
                    └─────────┬─────────┘
                              │
                 ┌────────────┼────────────┐
                 │                         │
                 ▼                         ▼
     ┌─────────────────────┐   ┌─────────────────────┐
     │   Org Members       │   │     Projects        │
     │ ==================  │   │ ==================  │
     │ PK: id              │   │ PK: id              │
     │ FK: org_id          │   │ FK: org_id          │
     │ FK: user_id         │   │ FK: created_by      │
     │                     │   │                     │
     │ • role (RBAC)       │   │ • name, slug        │
     │ • joined_at         │   │ • status, stack     │
     └─────────────────────┘   │ • workspace_id      │
                               └──────────┬──────────┘
                                          │
            ┌─────────────────────────────┼──────────────────────────────┐
            │                             │                              │
            ▼                             ▼                              ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  Project Secrets     │    │  Project Members     │    │  Workspaces          │
│ ===================  │    │ ===================  │    │ ===================  │
│ PK: id               │    │ PK: id               │    │ PK: id               │
│ FK: project_id       │    │ FK: project_id       │    │ FK: project_id       │
│                      │    │ FK: user_id          │    │                      │
│ • key_name           │    │ • role               │    │ • workspace_id       │
│ • encrypted_value 🔒 │    └──────────────────────┘    │ • subdomain          │
│ • environment        │                                 │ • status             │
│ • last_rotated_at    │                                 │ • container_id       │
└──────────────────────┘                                 │ • resource_limits    │
                                                         └──────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        BILLING & CREDITS                            │
└─────────────────────────────────────────────────────────────────────┘

     ┌─────────────────────┐          ┌─────────────────────────┐
     │      Credits        │          │  Credit Transactions    │
     │ ==================  │◄─────────│ ======================  │
     │ PK: id              │          │ PK: id                  │
     │ FK: org_id (unique) │          │ FK: org_id              │
     │                     │          │                         │
     │ • balance           │          │ • amount (+/-)          │
     │ • reserved          │          │ • transaction_type      │
     │ • free_tier_balance │          │ • balance_after         │
     └─────────────────────┘          │ • stripe_payment_id     │
                                      └─────────────────────────┘

     ┌─────────────────────┐
     │    Usage Logs       │
     │ ==================  │
     │ PK: id              │
     │ FK: org_id          │
     │ FK: project_id      │
     │                     │
     │ • resource_type     │
     │ • quantity          │
     │ • credits_consumed  │
     └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          AUDIT TRAIL                                │
└─────────────────────────────────────────────────────────────────────┘

     ┌─────────────────────────┐       ┌──────────────────────────┐
     │     Audit Logs          │       │  Secret Access Logs      │
     │ ======================  │       │ =======================  │
     │ PK: id                  │       │ PK: id                   │
     │ FK: user_id             │       │ FK: secret_id            │
     │ FK: org_id              │       │ FK: accessed_by          │
     │                         │       │                          │
     │ • action                │       │ • operation              │
     │ • resource_type         │       │ • accessed_from (IP)     │
     │ • resource_id           │       │ • accessed_at            │
     │ • metadata (JSONB)      │       └──────────────────────────┘
     │ • ip_address            │
     │ • status                │
     └─────────────────────────┘
```

---

### Runner System ERD

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RUNNER SYSTEM                               │
└─────────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │   Projects   │
                         └──────┬───────┘
                                │
        ┌───────────────────────┼──────────────────────┐
        │                       │                      │
        ▼                       ▼                      ▼
┌──────────────────┐   ┌─────────────────┐   ┌──────────────────┐
│   Workspaces     │   │  Deployments    │   │ Custom Domains   │
│ ===============  │   │ ==============  │   │ ===============  │
│ PK: id           │   │ PK: id          │   │ PK: id           │
│ FK: project_id   │   │ FK: project_id  │   │ FK: project_id   │
│                  │   │                 │   │                  │
│ • workspace_id   │   │ • deployment#   │   │ • domain         │
│ • subdomain      │   │ • version       │   │ • ssl_status     │
│ • status         │   │ • environment   │   │ • verified       │
│ • container_id   │   │ • status        │   │ • dns_records    │
│ • port           │   │ • preview_url   │   └────────┬─────────┘
│                  │   │ • platform      │            │
│ • cpu_limit      │   └────────┬────────┘            │
│ • memory_limit   │            │                     │
│ • storage_limit  │            │                     │
│                  │            ▼                     │
│ • last_activity  │   ┌─────────────────┐            │
└────────┬─────────┘   │  Build Logs     │            │
         │             │ ==============  │            │
         │             │ PK: id          │            │
         ▼             │ FK: deploy_id   │            │
┌──────────────────┐   │                 │            │
│ Env Variables    │   │ • log_line      │            │
│ ===============  │   │ • log_text      │            │
│ PK: id           │   │ • log_level     │            │
│ FK: project_id   │   │ • phase         │            │
│                  │   └─────────────────┘            │
│ • key_name       │                                  │
│ • value_enc 🔒   │                                  │
│ • environment    │                                  │
│ • is_secret      │                                  │
└──────────────────┘                                  │
                                                      │
┌──────────────────┐                                  │
│ Workspace        │                                  │
│ Snapshots        │◄─────────────────────────────────┘
│ ===============  │
│ PK: id           │
│ FK: workspace_id │
│                  │
│ • snapshot_name  │
│ • storage_path   │
│ • size_mb        │
│ • status         │
└──────────────────┘
```

---

### Integration Framework ERD

```
┌─────────────────────────────────────────────────────────────────────┐
│                      INTEGRATION FRAMEWORK                          │
└─────────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │   Projects   │
                         └──────┬───────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   Integrations      │
                    │ ==================  │
                    │ PK: id              │
                    │ FK: project_id      │
                    │                     │
                    │ • service           │
                    │ • config (JSONB)    │
                    │ • credentials_enc🔒  │
                    │ • oauth_tokens_enc🔒 │
                    │ • status            │
                    │ • webhook_url       │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
    ┌─────────────────┐ ┌─────────────┐ ┌────────────────────┐
    │ Integration     │ │  Webhook    │ │ Integration Rate   │
    │ Logs            │ │  Events     │ │ Limits             │
    │ ==============  │ │ ==========  │ │ =================  │
    │ PK: id          │ │ PK: id      │ │ PK: id             │
    │ FK: integ_id    │ │ FK: integ_id│ │ FK: integ_id       │
    │                 │ │             │ │                    │
    │ • event_type    │ │ • event_id  │ │ • endpoint         │
    │ • status        │ │ • payload   │ │ • requests_made    │
    │ • duration_ms   │ │ • status    │ │ • requests_limit   │
    └─────────────────┘ └─────────────┘ │ • is_throttled     │
                                        └────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          PLAYBOOKS SYSTEM                           │
└─────────────────────────────────────────────────────────────────────┘

     ┌─────────────────────┐         ┌──────────────────────┐
     │     Playbooks       │         │  Project Playbooks   │
     │ ==================  │         │ ===================  │
     │ PK: id              │◄────────│ PK: id               │
     │                     │         │ FK: project_id       │
     │ • name, slug        │         │ FK: playbook_id      │
     │ • service           │         │ FK: integration_id   │
     │ • instructions      │         │                      │
     │ • code_templates    │         │ • custom_config      │
     │ • is_verified       │         │ • is_enabled         │
     │ • usage_count       │         │ • usage_count        │
     │ • rating_average    │         └──────────────────────┘
     └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         OAUTH CONNECTIONS                           │
└─────────────────────────────────────────────────────────────────────┘

     ┌─────────────────────────┐
     │   OAuth Connections     │
     │ ======================  │
     │ PK: id                  │
     │ FK: user_id             │
     │                         │
     │ • provider              │
     │ • provider_user_id      │
     │ • access_token_enc 🔒   │
     │ • refresh_token_enc 🔒  │
     │ • token_expires_at      │
     │ • scopes                │
     └─────────────────────────┘
```

---

### Post-Launch System ERD

```
┌─────────────────────────────────────────────────────────────────────┐
│                       POST-LAUNCH SYSTEM                            │
└─────────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │   Projects   │
                         └──────┬───────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────────┐   ┌─────────────────┐   ┌──────────────────┐
│ Analytics Events │   │  SEO Metadata   │   │ Commerce Orders  │
│ ===============  │   │ ==============  │   │ ===============  │
│ PK: id           │   │ PK: id          │   │ PK: id           │
│ FK: project_id   │   │ FK: project_id  │   │ FK: project_id   │
│                  │   │                 │   │ FK: integration  │
│ • event_name     │   │ • page_path     │   │                  │
│ • session_id     │   │ • title, desc   │   │ • order_number   │
│ • user_id (end)  │   │ • og_* fields   │   │ • customer_*     │
│ • page_url       │   │ • twitter_*     │   │ • amounts        │
│ • device_type    │   │ • schema_markup │   │ • status         │
│ • properties     │   │ • robots_*      │   │ • addresses      │
└──────────────────┘   └─────────────────┘   └────────┬─────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Order Items    │
                                              │ ==============  │
                                              │ PK: id          │
                                              │ FK: order_id    │
                                              │                 │
                                              │ • product_name  │
                                              │ • quantity      │
                                              │ • prices        │
                                              └─────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      MONITORING SYSTEM                              │
└─────────────────────────────────────────────────────────────────────┘

     ┌──────────────────────┐          ┌─────────────────────┐
     │  Uptime Monitors     │          │   Uptime Checks     │
     │ ===================  │◄─────────│ ==================  │
     │ PK: id               │          │ PK: id              │
     │ FK: project_id       │          │ FK: monitor_id      │
     │                      │          │                     │
     │ • url                │          │ • status            │
     │ • check_interval     │          │ • http_status_code  │
     │ • current_status     │          │ • response_time_ms  │
     │ • uptime_percentage  │          │ • error_message     │
     │ • alert_threshold    │          │ • checked_at        │
     └──────────────────────┘          └─────────────────────┘

     ┌──────────────────────┐          ┌─────────────────────┐
     │    Error Logs        │          │ Performance Metrics │
     │ ===================  │          │ ==================  │
     │ PK: id               │          │ PK: id              │
     │ FK: project_id       │          │ FK: project_id      │
     │                      │          │                     │
     │ • error_hash         │          │ • page_url          │
     │ • error_type         │          │ • lcp_ms            │
     │ • error_message      │          │ • fid_ms            │
     │ • stack_trace        │          │ • cls               │
     │ • occurrence_count   │          │ • fcp_ms            │
     │ • status             │          │ • ttfb_ms           │
     └──────────────────────┘          └─────────────────────┘
```

---

## Core Entities

### Organizations

**Purpose:** Root multi-tenancy entity

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  ...
);
```

**Relationships:**
- One-to-Many: `org_members`, `projects`
- One-to-One: `credits`

**Indexes:**
- `owner_id`, `slug`, `stripe_customer_id`

**RLS Policies:**
- Users can view organizations they own or are members of
- Only owners can update their organizations

---

### Projects

**Purpose:** Individual applications built by users

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  stack VARCHAR(50) DEFAULT 'nextjs',
  status VARCHAR(50) DEFAULT 'initializing',
  workspace_id VARCHAR(255) UNIQUE,
  ...
  UNIQUE(org_id, slug)
);
```

**Key Columns:**
- `stack` - Tech stack (nextjs, react, vue, etc.)
- `status` - Project lifecycle state
- `workspace_id` - Link to runner workspace
- `storage_used_mb`, `compute_hours_used` - Resource tracking

**Relationships:**
- Many-to-One: `organizations`
- One-to-Many: `deployments`, `integrations`, `workspaces`

---

### Project Secrets

**Purpose:** Encrypted API keys and environment variables

```sql
CREATE TABLE project_secrets (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  key_name VARCHAR(255) NOT NULL,
  encrypted_value TEXT NOT NULL, -- AES-256-GCM
  environment VARCHAR(50) DEFAULT 'production',
  last_rotated_at TIMESTAMP,
  rotation_schedule_days INTEGER,
  ...
  UNIQUE(project_id, key_name, environment)
);
```

**Security:**
- Values encrypted with AES-256-GCM
- Only service role can read `encrypted_value`
- Users can only see key names via RLS
- All access logged in `secret_access_logs`

---

### Credits & Billing

**Purpose:** Credit-based usage tracking

```sql
CREATE TABLE credits (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) UNIQUE,
  balance DECIMAL(12,2) NOT NULL CHECK (balance >= 0),
  reserved DECIMAL(12,2) DEFAULT 0,
  free_tier_balance DECIMAL(12,2),
  ...
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  amount DECIMAL(12,2), -- +/- for credit/debit
  balance_after DECIMAL(12,2),
  transaction_type VARCHAR(50), -- 'purchase', 'usage', 'refund'
  ...
);
```

**Credit Rates:**
```typescript
const CREDIT_RATES = {
  agent_request: 1,
  code_generation: 5,
  test_execution: 2,
  image_generation: 10,
  deployment: 20,
  compute_hour: 50,
  storage_gb_month: 10,
};
```

---

### Audit Logs

**Purpose:** Comprehensive activity tracking

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  org_id UUID REFERENCES organizations(id),
  action VARCHAR(100) NOT NULL, -- 'user.login', 'project.created'
  resource_type VARCHAR(50),
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  status VARCHAR(50) DEFAULT 'success',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Logged Events:**
- User login/logout
- Project CRUD operations
- Secret access
- Deployment triggers
- Integration connections
- Billing transactions

---

## Runner System

### Workspaces

**Purpose:** Sandboxed execution environments

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) UNIQUE,
  workspace_id VARCHAR(255) UNIQUE, -- External runner ID
  subdomain VARCHAR(100) UNIQUE, -- e.g., proj-abc.emergent.dev
  status VARCHAR(50) DEFAULT 'initializing',
  container_id VARCHAR(255),
  port INTEGER DEFAULT 3000,
  cpu_limit_cores DECIMAL(4,2) DEFAULT 1.0,
  memory_limit_mb INTEGER DEFAULT 2048,
  storage_limit_mb INTEGER DEFAULT 1024,
  last_activity_at TIMESTAMP,
  auto_shutdown_minutes INTEGER DEFAULT 60,
  ...
);
```

**Features:**
- One workspace per project
- Auto-shutdown after inactivity
- Resource limits enforced
- Activity tracking

---

### Deployments

**Purpose:** Build and deployment history

```sql
CREATE TABLE deployments (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  deployment_number INTEGER, -- Auto-increment per project
  version VARCHAR(50),
  environment VARCHAR(50) DEFAULT 'preview',
  status VARCHAR(50) DEFAULT 'pending',
  preview_url VARCHAR(500),
  production_url VARCHAR(500),
  git_commit_sha VARCHAR(255),
  platform VARCHAR(50) DEFAULT 'vercel',
  ...
  UNIQUE(project_id, deployment_number)
);
```

**Deployment Flow:**
1. Trigger → `status='pending'`
2. Build → `status='building'` → logs in `build_logs`
3. Deploy → `status='deploying'`
4. Live → `status='active'` → URL available
5. Health check

---

### Custom Domains

**Purpose:** Custom domain management with SSL

```sql
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  domain VARCHAR(255) UNIQUE NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'pending',
  verification_token VARCHAR(255),
  ssl_status VARCHAR(50) DEFAULT 'pending',
  ssl_cert_issued_at TIMESTAMP,
  ssl_cert_expires_at TIMESTAMP,
  dns_records JSONB DEFAULT '[]',
  ...
);
```

**Verification Process:**
1. User adds domain
2. System generates verification token
3. User adds DNS TXT record
4. System verifies DNS
5. SSL cert issued (Let's Encrypt/Cloudflare)
6. Domain goes live

---

## Integration Framework

### Integrations

**Purpose:** Third-party service connections

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  service VARCHAR(50) CHECK (service IN ('shopify', 'printify', 'stripe', ...)),
  config JSONB DEFAULT '{}',
  credentials_encrypted TEXT, -- AES-256-GCM
  oauth_access_token_encrypted TEXT,
  oauth_refresh_token_encrypted TEXT,
  oauth_token_expires_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'configuring',
  ...
);
```

**Supported Services:**
- **E-commerce:** Shopify, Printify
- **Payments:** Stripe
- **Communication:** SendGrid, Twilio
- **Infrastructure:** Vercel, Cloudflare, AWS, GCP, Azure
- **Version Control:** GitHub, GitLab, Bitbucket

---

### Playbooks

**Purpose:** AI agent integration recipes

```sql
CREATE TABLE playbooks (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  service VARCHAR(50) NOT NULL,
  instructions TEXT NOT NULL, -- For AI agent
  code_templates JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2),
  ...
);
```

**Verified Playbooks:**
- Official playbooks created by platform
- Community-submitted, reviewed and approved
- Higher trust, guaranteed to work

**Unverified Playbooks:**
- Community-contributed
- Not officially tested
- Use at your own risk

---

### Webhook Events

**Purpose:** Incoming webhooks from integrations

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id),
  event_id VARCHAR(255), -- External event ID
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  signature VARCHAR(500),
  signature_verified BOOLEAN,
  ...
);
```

**Processing Flow:**
1. Webhook received → `status='pending'`
2. Signature verified
3. Process event → `status='processing'`
4. Complete → `status='processed'`
5. If error → `status='failed'` → retry

---

## Post-Launch System

### Analytics Events

**Purpose:** User behavior tracking

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  event_name VARCHAR(100) NOT NULL,
  session_id VARCHAR(255),
  user_id VARCHAR(255), -- End-user, not system user
  page_url TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  country VARCHAR(2),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Common Events:**
- `page_view`
- `button_click`
- `form_submit`
- `purchase_complete`
- `error_occurred`

**Partitioning Strategy:**
- Partition by month for performance
- Archive old data after 12 months

---

### SEO Metadata

**Purpose:** Per-page SEO configuration

```sql
CREATE TABLE seo_metadata (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  page_path VARCHAR(500) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  og_title VARCHAR(255),
  og_image VARCHAR(500),
  twitter_card VARCHAR(50),
  schema_markup JSONB,
  robots_index BOOLEAN DEFAULT TRUE,
  ...
  UNIQUE(project_id, page_path)
);
```

**Features:**
- Basic meta tags
- Open Graph tags
- Twitter Card tags
- Schema.org structured data
- Robots directives

---

### Commerce Orders

**Purpose:** E-commerce transaction tracking

```sql
CREATE TABLE commerce_orders (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_email VARCHAR(255),
  subtotal_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  order_status VARCHAR(50),
  payment_status VARCHAR(50),
  fulfillment_status VARCHAR(50),
  ...
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES commerce_orders(id),
  product_name VARCHAR(500) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  ...
);
```

**Order Lifecycle:**
1. `pending` → Customer places order
2. `paid` → Payment successful
3. `fulfilled` → Items shipped
4. Complete

---

### Uptime Monitors

**Purpose:** Site availability tracking

```sql
CREATE TABLE uptime_monitors (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  url VARCHAR(500) NOT NULL,
  check_interval_seconds INTEGER DEFAULT 300,
  current_status VARCHAR(50) DEFAULT 'unknown',
  uptime_percentage DECIMAL(5,2),
  alert_threshold INTEGER DEFAULT 3,
  ...
);

CREATE TABLE uptime_checks (
  id UUID PRIMARY KEY,
  monitor_id UUID REFERENCES uptime_monitors(id),
  status VARCHAR(50) NOT NULL,
  http_status_code INTEGER,
  response_time_ms INTEGER,
  checked_at TIMESTAMP DEFAULT NOW()
);
```

**Check Flow:**
1. Scheduled job pings URL
2. Record response time and status
3. Update monitor stats
4. If threshold exceeded → send alert

---

### Error Tracking

**Purpose:** Application error monitoring

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  error_hash VARCHAR(64) UNIQUE, -- For grouping duplicates
  error_type VARCHAR(255) NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  occurrence_count INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'unresolved',
  ...
);
```

**Error Grouping:**
- Errors with same signature grouped by `error_hash`
- `occurrence_count` incremented for duplicates
- Prevents log spam

---

## Security & Encryption

### Encryption at Rest

All sensitive data encrypted with **AES-256-GCM**:

```typescript
// Encryption
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.SECRETS_ENCRYPTION_KEY!, 'base64');

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Encrypted Columns

- `project_secrets.encrypted_value`
- `integrations.credentials_encrypted`
- `integrations.oauth_access_token_encrypted`
- `integrations.oauth_refresh_token_encrypted`
- `oauth_connections.access_token_encrypted`
- `oauth_connections.refresh_token_encrypted`
- `environment_variables.value_encrypted`

### Secret Rotation

Automatic key rotation:

```sql
CREATE TABLE project_secrets (
  ...
  rotation_schedule_days INTEGER, -- e.g., 90
  last_rotated_at TIMESTAMP,
  next_rotation_at TIMESTAMP,
  ...
);
```

Scheduled job checks `next_rotation_at` and rotates secrets automatically.

---

## Indexes & Performance

### Index Strategy

1. **Primary Keys** - Automatically indexed (UUID)
2. **Foreign Keys** - Always indexed
3. **Timestamps** - `created_at DESC` for recent queries
4. **Status Fields** - For filtering
5. **Composite Indexes** - For multi-column queries

### Example Indexes

```sql
-- Single column indexes
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_analytics_events_project_event_time 
  ON analytics_events(project_id, event_name, created_at DESC);

-- Partial indexes (conditional)
CREATE INDEX idx_projects_deleted_at 
  ON projects(deleted_at) WHERE deleted_at IS NULL;

-- GIN indexes for JSONB/arrays
CREATE INDEX idx_playbooks_categories 
  ON playbooks USING GIN(categories);
```

### Query Optimization Tips

1. **Use EXPLAIN ANALYZE** to understand query plans
2. **Avoid N+1 queries** - use joins or batch queries
3. **Paginate large result sets** - LIMIT/OFFSET or cursor-based
4. **Cache expensive queries** - application or database level
5. **Monitor slow queries** - pg_stat_statements extension

---

## Row-Level Security (RLS)

### Organization-Based Access

All tables enforce organization membership:

```sql
CREATE POLICY "Users can view org data" ON {table}
  FOR SELECT
  USING (
    {org_id or derived} IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );
```

### Role-Based Access Control

Different roles have different permissions:

```sql
CREATE POLICY "Admins can modify" ON projects
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

### Service Role Bypass

Service role (backend) bypasses RLS for:
- Reading encrypted secrets
- Writing audit logs
- System operations

---

## Triggers & Functions

### Auto-Update Timestamps

```sql
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER {table}_updated_at
  BEFORE UPDATE ON {table}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Auto-Increment Deployment Number

```sql
CREATE FUNCTION set_deployment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deployment_number IS NULL THEN
    SELECT COALESCE(MAX(deployment_number), 0) + 1
    INTO NEW.deployment_number
    FROM deployments
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Update Credits on Transaction

```sql
CREATE FUNCTION update_credits_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE credits
  SET balance = balance + NEW.amount
  WHERE org_id = NEW.org_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credit_transactions_update_balance
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_credits_balance();
```

---

## Data Retention

### Retention Policies

| Data Type | Retention | Action |
|-----------|-----------|--------|
| Audit Logs | 2 years | Archive to cold storage |
| Analytics Events | 1 year | Delete after 1 year |
| Build Logs | 90 days | Delete after 90 days |
| Uptime Checks | 6 months | Aggregate to daily summaries |
| Error Logs | Until resolved + 90 days | Delete 90 days after resolution |
| Usage Logs | 2 years | Archive annually |

### Soft Deletes

Tables with soft deletes:
- `organizations`
- `projects`
- `project_secrets`
- `integrations`
- `custom_domains`
- `environment_variables`
- `playbooks`
- `oauth_connections`

Hard delete after 30 days:

```sql
DELETE FROM projects 
WHERE deleted_at < NOW() - INTERVAL '30 days';
```

---

## Migration Guide

### Running Migrations

```bash
# Local development
supabase db reset --local

# Production (via Supabase dashboard)
# Migrations auto-run on push to main
```

### Migration Order

**MUST** run in this order:
1. `20260218064853_emergent_foundations.sql`
2. `20260218064854_emergent_runner.sql`
3. `20260218064855_emergent_integrations.sql`
4. `20260218064856_emergent_postlaunch.sql`

### Rollback Strategy

Each migration should have a rollback script:

```sql
-- Up migration
CREATE TABLE my_table (...);

-- Down migration (rollback)
DROP TABLE IF EXISTS my_table CASCADE;
```

### Zero-Downtime Migrations

For production:
1. Add new columns as nullable
2. Deploy code that writes to both old and new
3. Backfill data
4. Deploy code that reads from new
5. Drop old columns

---

## Performance Benchmarks

### Query Performance Targets

| Query Type | Target Time |
|------------|-------------|
| Single row by ID | < 5ms |
| List with pagination | < 50ms |
| Analytics aggregation | < 500ms |
| Full-text search | < 100ms |

### Connection Pooling

Supabase provides connection pooling via Supavisor:
- Max connections: 100 (default)
- Pool mode: Transaction
- Timeout: 15s

---

## Monitoring & Observability

### Key Metrics to Monitor

1. **Query Performance**
   - Slow query log (> 1s)
   - Most frequent queries
   - Cache hit ratio

2. **Database Health**
   - Connection count
   - Replication lag
   - Disk usage
   - CPU/memory usage

3. **Table Stats**
   - Row counts
   - Table sizes
   - Index usage
   - Vacuum stats

### Monitoring Tools

- **Supabase Dashboard** - Query logs, performance insights
- **pg_stat_statements** - Query statistics
- **Sentry** - Error tracking
- **Datadog/New Relic** - APM (optional)

---

## Future Optimizations

### Planned Enhancements

1. **Partitioning**
   - `analytics_events` by month
   - `audit_logs` by quarter
   - `uptime_checks` by week

2. **Materialized Views**
   - Pre-aggregate analytics
   - Dashboard summaries
   - Real-time refresh

3. **Read Replicas**
   - Separate read/write traffic
   - Reduce main DB load
   - Geographic distribution

4. **Caching Layer**
   - Redis for hot data
   - Application-level caching
   - Query result caching

---

## Contact & Support

**Database Administrator:** GUY  
**Issues:** Report via GitHub Issues  
**Schema Questions:** Tag @guy in team chat  

---

## Changelog

### Version 1.0.0 (2026-02-18)
- Initial schema design
- 32 tables, 7 views, 15+ functions
- Full RLS policies
- Comprehensive indexing strategy

---

**End of Documentation**

*"Data is the foundation. If the foundation is weak, everything collapses."* - GUY
