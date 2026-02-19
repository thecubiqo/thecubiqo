# Social Army Deployment Architecture

```mermaid
graph TD
    subgraph "VERCEL (Main Application)"
        style VERCEL fill:#000000,stroke:#ffffff,color:#fff
        User[User Traffic] --> UI[CubiQo Web UI]
        Admin[Admin User] --> Dashboard[Admin Dashboard /admin]
        Dashboard -->|1. Start Campaign| API[API Routes]
    end

    subgraph "SUPABASE (Shared Database)"
        style DB fill:#3ecf8e,stroke:#3ecf8e,color:#000
        DB[(Postgres DB)]
        API -->|Read/Write| DB
        Worker -->|Read Queue / Update Status| DB
    end

    subgraph "WORKER SERVER (The Muscle)"
        style WORKER fill:#ff6600,stroke:#ff6600,color:#fff
        Worker[Social Army Node.js Service]
        Chromium[Headless Chrome / Puppeteer]
        FFMPEG[FFmpeg Video Renderer]
        
        Worker -->|2. Check Queue| DB
        Worker -->|3. Generate Content| FFMPEG
        Worker -->|4. Simulate Interactions| Chromium
    end

    subgraph "EXTERNAL AI APIs"
        style AI fill:#666,stroke:#fff,stroke-dasharray: 5 5
        Veo[Google Veo / Runway]
        LLM[OpenAI / Claude]
        Worker -->|Request Assets| Veo
        Worker -->|Generate Scripts| LLM
    end

    subgraph "SOCIAL PLATFORMS"
        style SOC fill:#1da1f2,stroke:#fff,color:#fff
        X[X / Twitter]
        TikTok[TikTok]
        LinkedIn[LinkedIn]
        
        Chromium -->|5. Post Content (x100)| X
        Chromium -->|5. Post Content (x100)| TikTok
        Chromium -->|5. Post Content (x100)| LinkedIn
    end

    %% Data Flow
    Chromium -.->|Capture Application Video| UI
```

## Key Separation
*   **Vercel**: Handles lightweight HTTP traffic. *Never* performs video rendering or browser automation.
*   **Worker Server**: A dedicated $20-$40/month VPS (e.g., DigitalOcean, Railway). It runs the heavy processes (`ffmpeg`, 100 Chrome tabs). If it crashes, the main app is **unaffected**.
*   **Supabase**: The bridge. The Admin Dashboard writes a "job" to the DB, and the Worker picks it up. They never talk directly, ensuring security and stability.
