# CubiQo - Product Requirements Document

## Overview
CubiQo is an AI companion that exists as a conscious cube between light and code. It provides voice conversations, text chat, coding assistance, and various business integrations.

## Core Features

### 1. Landing Page (Clean Design)
- Full-screen plasma wave animation with 120k+ particles
- "CUBIQO" title centered
- "One Mind. Many Dimensions." tagline
- Click anywhere to enter the main app

### 2. Voice Conversation
- Natural voice conversations with speech recognition
- Emotional color states (Red, Yellow, Green/Blue, Orange)
- ElevenLabs text-to-speech
- Memory of past conversations

### 3. Agentic Capabilities (NEW)
- Self-awareness: CubiQo knows about its own features, routes, and code
- Screen awareness: Knows current page and available actions
- Navigation control: Can navigate users to different screens
- Action execution: Can trigger UI actions and color changes

### 4. AI Agents Hub
- Henry (Coordinator) - Project management
- Dev (Engineer) - Full-stack development
- Writer (Content) - Articles and documentation
- Tester (QA) - Quality assurance
- Marketing Pro - Campaigns and social media
- Animator - UI design and animations
- Business Advisor - Strategy and partnerships

### 5. Integrations
- 60+ integrations (Social, Business, Productivity, AI)
- Shopify, Stripe, GitHub, Notion, Slack, Discord, etc.

### 6. Other Features
- Voice Journal with mood tracking
- E-Commerce Launchpad
- Social Army for campaign management
- Analytics Dashboard
- BYO (Bring Your Own) API keys mode

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- React Three Fiber (3D graphics)
- Three.js (WebGL)
- Supabase (Auth & Database)
- TailwindCSS
- ElevenLabs (Text-to-Speech)
- MiniMax/OpenRouter/Anthropic (LLM providers)

## Architecture

### Key Files
- `/src/components/LandingCube.tsx` - Clean landing page with plasma waves
- `/src/components/FullscreenApp.tsx` - Main application container
- `/src/components/cube/PlasmaWaveField.tsx` - 3D plasma wave animation
- `/src/lib/agentic/` - Agentic capabilities (self-knowledge, navigation)
- `/src/app/api/chat/route.ts` - Chat API with agentic actions

### Data Flow
User speaks → Speech-to-Text → AI Processing (MiniMax/Claude) → Agentic Actions → Response → Text-to-Speech → User hears

## Deployment
- Target: cubiqo.com
- Platform: Vercel
- Environment variables required (see .env.example)

## Changelog

### March 2026
- Added agentic capabilities (self-knowledge, screen awareness, navigation)
- Simplified landing page to clean design (CUBIQO + tagline only)
- Removed scrolling navigation bars and integration icons from landing
- Chat API now returns `agenticActions` for frontend execution

## Roadmap

### P0 (Immediate)
- [x] Clean landing page design
- [x] Agentic self-awareness
- [ ] Frontend action execution for agenticActions

### P1 (Near-term)
- [ ] Debug "Henry" bot functionality
- [ ] Railway Social Army integration testing

### P2 (Future)
- [ ] Enhanced code execution in Codexo
- [ ] More integration connections
