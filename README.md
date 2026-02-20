# CubiQo - Open Source AI Companion

CubiQo is an open-source conversational AI platform with voice capabilities, journaling, and intent-based matching.

> 📚 **New to the codebase?** Looking for specific features?  
> → Read **[BRANCHES_ULTRA_QUICK.md](BRANCHES_ULTRA_QUICK.md)** - Which branch has what  
> → Read **[START_HERE_FEATURES.md](START_HERE_FEATURES.md)** - Where to find everything

## ✨ Features

- 🎙️ **Voice Conversations** - Natural voice interaction with emotional modulation
- 📔 **Rozana Journal** - Daily reflections with AI-guided conversations
- 🎨 **RGY Context** - Color-coded life categorization (Red/Yellow/Green)
- 🤖 **Intelligent Matching** - AI-powered opportunity discovery based on your interests
- 🔐 **Privacy-First** - BYO (Bring Your Own) mode - use your own API keys
- 🌐 **Open Source** - Built with open models (Llama, Mixtral, DeepSeek)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/thecubiqo/thecubiqo.git
cd thecubiqo

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# (Optional) Add your API keys to .env.local
# Or use BYO mode - enter keys in the UI

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Supabase Setup (Required)

CubiQo uses Supabase for authentication and data storage. Follow these steps:

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a free account
   - Create a new project

2. **Get Your API Keys**
   - Navigate to Project Settings → API
   - Copy your `Project URL` and `anon` key
   - Copy your `service_role` key (keep this secret!)

3. **Set Up Environment Variables**
   - Edit `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run Database Migrations**
   - Install Supabase CLI: `npm install -g supabase`
   - Link your project: `supabase link --project-ref your-project-ref`
   - Run migrations: `supabase db push`

   Or manually run the SQL files in `supabase/migrations/` in order:
   - `20251124000001_initial_schema.sql`
   - `20251126000001_fix_color_constraint.sql`
   - `20251127000001_ensure_profile_function.sql`

### BYO Mode (Recommended for AI)
No AI API setup needed! Click "Settings" → "Try BYO Mode" and enter your own API keys.

### Hosted Mode (Optional)
If you want to provide API keys for users, edit `.env.local`:

```env
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

### Staging Environment (For Testing)

**Where is the staging database?** It doesn't exist yet - you need to create it!

Set up a separate staging database for testing before production:

```bash
# 1. Create Supabase project at https://supabase.com (name: cubiqo-staging)
# 2. Copy credentials to .env.staging
# 3. Run setup:
npm run staging:init      # Initialize staging
npm run staging:migrate   # Run migrations
npm run staging:verify    # Check health
```

See [WHERE_IS_STAGING_DB.md](./WHERE_IS_STAGING_DB.md) for the answer to "where is staging?"  
See [STAGING_DATABASE_SETUP.md](./STAGING_DATABASE_SETUP.md) for complete instructions.

## 🏗️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Magic Links)
- **3D Graphics:** Three.js / React Three Fiber
- **AI:** OpenRouter-compatible APIs (supports open models)
- **Voice:** ElevenLabs TTS
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## 🎨 Visual Regression Testing with Chromatic

CubiQo uses [Chromatic](https://www.chromatic.com) for automated visual regression testing. This ensures that UI changes are intentional and don't introduce visual bugs.

### Running Storybook Locally

```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook

# Run Chromatic tests
npm run chromatic
```

Storybook will be available at [http://localhost:6006](http://localhost:6006).

### How Chromatic Works

1. **On every PR**, Chromatic automatically:
   - Captures screenshots of all UI components
   - Compares them with the baseline (main branch)
   - Posts visual diff results to the PR

2. **Review visual changes** directly in the PR:
   - Click on the Chromatic check in the PR
   - Review any visual differences
   - Accept or reject changes

3. **On merge to main**, accepted changes become the new baseline

### Setting Up Chromatic (for maintainers)

If you're setting up a new Chromatic project:

1. Go to [chromatic.com](https://www.chromatic.com) and sign in with GitHub
2. Create a new project and link it to this repository
3. Copy your project token
4. Add it to GitHub repository secrets:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CHROMATIC_PROJECT_TOKEN`
   - Value: (paste your token)

The GitHub Actions workflow will automatically run on all PRs.

### Component Stories

Stories are located in `src/components/stories/`. Each key UI component has a story that showcases its different states and variations.

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

Open source under MIT License. See `LICENSE` file for details.

## 🛡️ Privacy

- **No data collection** in BYO mode
- **Voice data** never stored (policy)
- **Journal entries** encrypted and owned by user
- **Open source** - audit the code yourself

## 🚀 Founders Pass — Admin Portal & Feature Flags

Founders Pass is a built-in admin portal for managing feature flags, sites, OAuth integrations, and action templates across CubiQo-powered storefronts.

### Architecture

- **Admin Portal** — `/founders-pass` — Dashboard, flag management, site generator, integrations panel, action templates builder, audit log
- **Feature Flags** — Per-organization, per-site, and per-user toggles stored in Supabase with 5-second cache TTL
- **OAuth Integrations** — Gmail, Shopify, Printify, Printful, Stripe, Uber with AES-256-GCM token encryption
- **Actions Cards** — AI-generated action cards requiring explicit user confirmation before any side-effect
- **Preview Mode** — Query param (`?fp_preview=flag:1`) or cookie-based preview with shareable URLs
- **Site Generator** — "Launch Site" button that creates a new site record and preview URL
- **User Feature Panel** — Side panel on storefront sites showing enabled integrations and OAuth connect buttons

### Quick Start

```bash
git clone https://github.com/thecubiqo/thecubiqo.git
cd thecubiqo
npm install        # or: pnpm install
npm run dev        # Start dev server at http://localhost:3000
npm test           # Run unit tests (Jest)
npm run build && npm start  # Production build
```

### Founders Pass Routes

| Route | Description |
|-------|-------------|
| `/founders-pass` | Admin dashboard |
| `/founders-pass/flags` | Feature flags CRUD |
| `/founders-pass/sites` | Sites management + Launch Site generator |
| `/founders-pass/integrations` | OAuth provider configuration |
| `/founders-pass/actions` | Action templates builder |
| `/founders-pass/audit` | Audit log viewer |
| `/sites/[slug]` | User-facing site with feature panel |
| `/sites/vollebak-replica` | Demo site |

### API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/founders-pass/flags` | GET, POST, PUT, DELETE | Feature flags CRUD |
| `/api/founders-pass/flags/overrides` | GET, POST | Per-site/per-user flag overrides |
| `/api/founders-pass/sites` | GET, POST, PUT, DELETE | Sites CRUD |
| `/api/founders-pass/actions` | GET, POST, PUT | Action templates CRUD |
| `/api/founders-pass/integrations` | GET, POST | Integration configs per site |
| `/api/founders-pass/audit` | GET | Audit log |
| `/api/founders-pass/events` | GET, POST | Analytics events |
| `/api/founders-pass/preview` | GET, POST, DELETE | Preview mode management |
| `/api/founders-pass/oauth/callback` | GET | OAuth callback handler |
| `/api/founders-pass/generator` | POST | Site generator |
| `/api/founders-pass/health` | GET | Health check endpoint |

### Database Migration

Run the Founders Pass migration after the initial schema:

```bash
supabase db push
# Or manually run: supabase/migrations/20260215000001_founders_pass_schema.sql
```

Tables created: `sites`, `feature_flags`, `flag_overrides`, `oauth_tokens`, `action_templates`, `audit_log`, `feature_events`, `integration_configs`

### Configuring OAuth Clients

Set these environment variables in `.env.local` (dev) or Vercel (production):

```env
OAUTH_ENCRYPTION_KEY=<32-byte-hex-key>
GMAIL_CLIENT_ID=<google-oauth-client-id>
GMAIL_CLIENT_SECRET=<google-oauth-client-secret>
# ... same pattern for SHOPIFY, PRINTIFY, PRINTFUL, STRIPE, UBER
```

Generate an encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Acceptance Test

1. Navigate to `/founders-pass`, create a flag `gmail_read` and enable it
2. Go to `/founders-pass/sites`, click "Launch Site" to create `vollebak-replica`
3. Visit `/sites/vollebak-replica` — see Gmail integration in the side panel
4. Click "Connect Gmail" to initiate the OAuth flow
5. View audit log at `/founders-pass/audit` to verify all actions are logged

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard: Supabase credentials, OAuth client IDs/secrets, and `OAUTH_ENCRYPTION_KEY`.

## 🎯 RGY Intelligent Matching

CubiQo includes an AI-powered opportunity discovery system that matches users with relevant rooms, events, connections, and activities based on their interests.

### Key Features

- **RGY Context Zones**: Express interests across three life contexts
  - 🎯 **Green (Progressive)**: Growth, wellness, career goals
  - ✨ **Yellow (Sit back)**: Social connections, casual hangouts
  - 💫 **Red (Indulge)**: Deep conversations, creative exploration

- **AI-Powered Matching**: Vector similarity search using OpenAI embeddings
- **Pro Match Subscription**: Automated discovery with configurable frequency
- **Smart Notifications**: Get notified when new opportunities match your interests

### Quick Start

1. **Set Your Interests**: Add keywords for each RGY context
2. **Discover Opportunities**: AI finds matching rooms, events, and connections
3. **Express Interest**: Join opportunities that resonate with you
4. **Enable Pro Match**: Opt-in for automated weekly/daily discovery

See [docs/RGY_MATCHING.md](./docs/RGY_MATCHING.md) for detailed documentation.

## 🌟 Roadmap

- [x] RGY Intelligent Matching - AI-powered opportunity discovery
- [ ] Rozana confession room experience
- [ ] Signal - Enhanced intent-based matching features
- [ ] Full open model integration (Llama 3, Mixtral)
- [ ] Self-hosted deployment guides
- [ ] Mobile apps (iOS/Android)

## 📚 Documentation

- **[RGY_MATCHING.md](./docs/RGY_MATCHING.md)** - RGY Intelligent Matching system guide
- **[BRANCHES.md](./BRANCHES.md)** - Complete guide to branch structure and deployment
- **[BRANCHES_QUICK_REF.md](./BRANCHES_QUICK_REF.md)** - Quick reference for branches
- **[AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md)** - Authentication troubleshooting
- **[VALIDATION_REPORT.md](./VALIDATION_REPORT.md)** - Environment validation report
- **[AUTH_FIX_SUMMARY.md](./AUTH_FIX_SUMMARY.md)** - Auth bug fix documentation
- **[SELF_HEAL.md](./docs/SELF_HEAL.md)** - Self-heal job documentation
- **[STAGING_DATABASE_SETUP.md](./STAGING_DATABASE_SETUP.md)** - Staging database setup guide
- **[STAGING_QUICK_REF.md](./STAGING_QUICK_REF.md)** - Quick reference for staging
- **[STAGING_TESTING_HANDOFF.md](./STAGING_TESTING_HANDOFF.md)** - Testing and handoff guide

## 📧 Contact

- Website: [cubiqo.ai](https://cubiqo.ai)
- Issues: [GitHub Issues](https://github.com/thecubiqo/thecubiqo/issues)

---

**"One is enough." - CubiQo + Signal**
