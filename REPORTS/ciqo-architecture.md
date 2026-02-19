# Ciqo & Codexo: The AI Engine & Interface

**Ciqo** is the isolated execution engine running on Hostinger.
**Codexo** is the futuristic, live-code interface running on Vercel (Client).

## System Architecture

```mermaid
graph TD
    %% Styling
    classDef verified fill:#2FA84F,stroke:#1D6F33,color:white;
    classDef hostinger fill:#673AB7,stroke:#512DA8,color:white;
    classDef codexo fill:#00E5FF,stroke:#00B8D4,color:black,stroke-width:2px,shadow:0 0 10px #00E5FF;
    classDef data fill:#FFA000,stroke:#F57F17,color:white;

    subgraph "Codexo Interface (Client / Vercel)"
        UI[Codexo Live Panel]:::codexo -->|1. Visualizes| Stream[Live Code Stream]
        UI -->|2. Control| API[Next.js API Routes]
        UI -.->|Websocket/Polling| DB
    end

    subgraph "The Brain (Supabase)"
        DB[(PostgreSQL Database)]:::data
        DB -->|Realtime Updates| UI
    end

    subgraph "Ciqo Engine (Hostinger VPS)"
        Worker[Ciqo Runner Service]:::hostinger -->|3. Poll for Jobs| DB
        Worker -->|4. Launch| Docker[Docker Manager]
        
        subgraph "Isolated Workspaces"
            W1[Agent Workspace A]
            W2[Agent Workspace B]
        end
        
        Docker -->|5. Spawn & Limit| W1
        Docker -->|5. Spawn & Limit| W2
        
        W1 -.->|6. Metrix & Logs| DB
    end

    %% Legend
    linkStyle 0,1 stroke:#00E5FF,stroke-width:2px;
    linkStyle 4,5 stroke:#673AB7,stroke-width:2px;
    linkStyle 6,7 stroke:#FFA000,stroke-width:2px,stroke-dasharray: 5 5;
```

## Codexo Features (The Interface)
*   **Visual Style**: Glassmorphism, Neon Glows (Cyan/Pink/Purple), 3D Code Cubes.
*   **Live Data**: Real-time CPU usage, Memory pressure, Console logs.
*   **Interactivity**: "Jack in" to a running container to see the terminal.
