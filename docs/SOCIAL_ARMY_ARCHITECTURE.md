# Social Army Architecture: The "CubiQo 100" Strategy

## 1. Core Principle: 1 Idea → 100 Unique Expressions
To manage 100 accounts effectively *without spamming identical content*, we employ a **Persona-Based Generation Strategy**. The system takes a single "Core Narrative" (e.g., "AI Voice is the future") and transmutes it through 100 distinct lenses.

## 2. The Persona Matrix
We classify the 100 accounts into **Archetypes** to ensure content diversity:

### Archetype A: The Founders & Builders (20 Accounts)
*   **Tone**: Technical, visionary, "build in public".
*   **Content**: Code snippets, architecture diagrams (Mermaid.js), GitHub commit logs, "late night coding" vibes.
*   **Platforms**: X (Twitter), LinkedIn, Dev.to.

### Archetype B: The Productivity Gurus (30 Accounts)
*   **Tone**: Helpful, optimization-focused, emojis 🚀, "hacks".
*   **Content**: "How I saved 10 hours this week", "CubiQo vs Notion", workflow diagrams.
*   **Platforms**: Instagram Reels, TikTok, YouTube Shorts.

### Archetype C: The Skeptics & Philosophers (15 Accounts)
*   **Tone**: Questioning, deep, slightly controversial.
*   **Content**: "Is AI actually conscious?", "The problem with Siri/Alexa", long-form threads.
*   **Platforms**: X (Threads), Reddit, Medium.

### Archetype D: The Visual Artists (20 Accounts)
*   **Tone**: Minimalist, aesthetic, "futurecore".
*   **Content**: High-quality 3D renders of the Cube, abstract UI animations, mood boards.
*   **Platforms**: Pinterest, Instagram, TikTok.

### Archetype E: The Memelords (15 Accounts)
*   **Tone**: Chaotic, funny, Gen-Z.
*   **Content**: Shitposts about bad code, reaction videos to CubiQo answers, trending audio.
*   **Platforms**: TikTok, X.

## 3. The Content Generation Pipeline (Every 10 Minutes)

### Step 1: The Seed (Input)
*   Marketing Agent selects a **Seed Topic** from the backlog (e.g., "Self-Healing Code", "Energy Cube Physics", "Privacy First").

### Step 2: The Prism (Diversification)
*   The `ContentEngine` splits this seed into 10 variations based on the Archetypes.
    *   *Example (Seed: Self-Healing Code)*:
        *   **Builder**: Shows the actual `try/catch` block and diff.
        *   **Guru**: "Stop debugging manually. Here's why."
        *   **Meme**: Drake pointing meme (Old: Fixing bugs / New: AI fixes bugs).
        *   **Artist**: A soothing animation of code repairing itself visually.

### Step 3: Visual Synthesis (Asset Generation with CubiQo Interactor)
*   To generate "real-time responses from CubiQo", the Army uses a **Headless User Simulation (Puppeteer)**.
*   **Video**: We use the `Veo` or `Runway` API to generate distinct clips.
    *   *Prompt A*: "Cyberpunk coder fixing bugs on holographic screen."
*   **Interactive Demo**: The system *logs into CubiQo* as a user, sends a prompt, and **screenshoots/records** the actual UI response. This provides authentic product footage.
*   **Overlay**: Unique text captions are burned onto the video for each account to avoid hash-matching algorithms.

### Step 4: Staggered Deployment
*   We do NOT post all 100 at once.
*   **The Pulse**:
    *   Minute 0: 3 Builder accounts post to X.
    *   Minute 2: 5 Guru accounts post to TikTok.
    *   Minute 5: 2 Skeptic accounts start a Reddit thread.
    *   Minute 9: 4 Artist accounts post to Instagram.
*   *Result*: Continuous stream of content, zero overlap.

## 4. Architecture: The "Sidecar" Service
To keep the main CubiQo app clean, the **Social Army** lives in a separate `social-army/` directory (a "sidecar" application).
*   **Independent**: It has its own database tables (`social_accounts`, `campaigns`) and process.
*   **Integration**: The main Admin Dashboard simply links to the "Army Console" status page.

## 5. Account Management (User Provided)
**CRITICAL**: The system *cannot* effectively automate the creation of 100 accounts (due to SMS verification/Captchas).
*   **Input**: You (The General) provide the 100 credentials via CSV or the Admin UI.
*   **Management**: The Army Agent manages the *cookies* and *sessions* to keep them alive.

## 6. Technical Stack
*   **Service**: Node.js / Puppeteer (in `social-army/`).
*   **Database**: Distinct Supabase tables (linked for read-access to User stats).
*   **Orchestration**: Cron-based scheduler (every 10m).
