# CubiQo Social Army Console

This is the control center for the **100-Account Social Army**. It operates independently of the main CubiQo web application to ensure stability and separation of concerns.

## Setup Instructions

1.  **Configure Environment**: Copy `.env.example` to `.env` and fill in your Supabase and API credentials.
2.  **Add Accounts**: Create a `accounts.csv` file with columns: `platform, username, password, persona_type`.
3.  **Run the Army**: Execute `npm start` to begin the scheduled posting loop.

## Architecture

*   **Commander**: The main orchestration script (`commander.js`).
*   **Factories**: Specific content generation modules for text, image, and video.
    *   `video-factory/`: Generates clips using Veo/Runway + CubiQo interactions.
    *   `image-factory/`: Creates static assets via Midjourney/DALL-E.
*   **Soldiers**: Browser automation scripts (`puppeteer`) for posting to each platform.

## Integration

The main CubiQo Admin Dashboard links to this console's status page (if running) or simply references its configuration.
