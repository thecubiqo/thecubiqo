# CubiQo - Open Source AI Companion

CubiQo is an open-source conversational AI platform with voice capabilities, journaling, and intent-based matching.

## ✨ Features

- 🎙️ **Voice Conversations** - Natural voice interaction with emotional modulation
- 📔 **Rozana Journal** - Daily reflections with AI-guided conversations
- 🎨 **RGY Context** - Color-coded life categorization (Red/Yellow/Green)
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

## 🏗️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Magic Links)
- **3D Graphics:** Three.js / React Three Fiber
- **AI:** OpenRouter-compatible APIs (supports open models)
- **Voice:** ElevenLabs TTS
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

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

## 🌟 Roadmap

- [ ] Rozana confession room experience
- [ ] Signal - Intent-based matching
- [ ] Full open model integration (Llama 3, Mixtral)
- [ ] Self-hosted deployment guides
- [ ] Mobile apps (iOS/Android)

## 📚 Documentation

- **[BRANCHES.md](./BRANCHES.md)** - Complete guide to branch structure and deployment
- **[BRANCHES_QUICK_REF.md](./BRANCHES_QUICK_REF.md)** - Quick reference for branches
- **[AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md)** - Authentication troubleshooting
- **[VALIDATION_REPORT.md](./VALIDATION_REPORT.md)** - Environment validation report
- **[AUTH_FIX_SUMMARY.md](./AUTH_FIX_SUMMARY.md)** - Auth bug fix documentation

## 📧 Contact

- Website: [cubiqo.ai](https://cubiqo.ai)
- Issues: [GitHub Issues](https://github.com/thecubiqo/thecubiqo/issues)

---

**"One is enough." - CubiQo + Signal**
