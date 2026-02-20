# CubiQo Social Army Console v2

This is the control center for the **100-Account Social Army (10x10 Fleet)**. It operates independently of the main CubiQo web application to ensure stability and separation of concerns.

## Setup Instructions

1.  **Configure Environment**: Copy `.env.example` to `.env` and fill in your Supabase, GFXToolz, and API credentials.
2.  **Generate Fleet**: Run `node scripts/fleet-config-helper.js --generate` to create the initial `config/platforms.json`.
3.  **Fill Accounts**: Edit `config/platforms.json` with real passwords and proxy endpoints.
4.  **Run the Army**: Execute `npm start` to begin the autonomous mission loop.

## 10x10 Fleet Architecture

*   **Commander**: Orchestrates the mission loop (`commander.js`). Rotates through 100 accounts every 10 mins.
*   **Content Engine**: Generates unique assets via GFXToolz or Gemini/OpenAI fallbacks.
*   **Poster (Soldiers)**: Automated Puppeteer scripts for:
    *   **Twitter/X**: Full automation + media upload.
    *   **LinkedIn**: Professional post automation.
    *   **Instagram/TikTok**: Mobile-emulated automation (Expansion in progress).
    *   **Others**: (YouTube, Reddit, Pinterest, Threads, Facebook, Discord) - Selection ready.

## Integration

The main CubiQo Admin Dashboard manages the `content_queue` and `social_campaigns` tables, which this worker polls.
