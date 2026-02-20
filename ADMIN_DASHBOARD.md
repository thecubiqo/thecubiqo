# Admin Dashboard

The admin dashboard provides real-time monitoring of the CubiQo agent system.

## Access

**URL:** `/admin`

## Features

### 1. Stats Overview
Four key metrics displayed as cards:
- **Total Agents**: Shows total number of agents and how many are active
- **Active Sessions**: Number of currently running sessions
- **Total Messages**: Total message count across all sessions (memory count)
- **System Status**: Shows system health status and uptime

### 2. System Health
Displays Node.js process metrics:
- **Heap Used**: Current heap memory usage in MB
- **Heap Total**: Total heap memory allocated in MB
- **RSS Memory**: Resident Set Size memory in MB

### 3. Agents Table
Shows all registered agents with:
- Name and ID
- Current status (idle/running/error)
- Model being used
- Active tasks / Total tasks
- Last updated timestamp

### 4. Recent Activity
Shows the 10 most recently updated sessions with:
- Agent ID
- Channel (internal/telegram/discord/etc.)
- Session status
- Message count
- Last update time

### 5. AI & Database Usage Monitoring
Displays real-time usage metrics and admin lock controls:
- **AI Usage**: Shows current spending vs. cap for each provider (Anthropic, ElevenLabs) with progress bars color-coded by utilization (green < 70%, yellow 70-90%, red > 90%)
- **Database Usage**: Displays database lock status
- **Lock Controls**: Toggle buttons to lock/unlock AI or database usage instantly. When locked, all corresponding API calls are blocked to keep costs low

## API Endpoints

### Stats Endpoint
**Endpoint:** `GET /api/admin/stats`

**Response:**
```json
{
  "stats": {
    "totalAgents": 7,
    "activeAgents": 0,
    "activeSessions": 0,
    "totalMessages": 0
  },
  "agents": [
    {
      "id": "agent-id",
      "name": "Agent Name",
      "status": "idle",
      "model": "claude-sonnet-4-5",
      "activeTasks": 0,
      "totalTasks": 0,
      "createdAt": "2026-02-08T12:43:59.467Z",
      "updatedAt": "2026-02-08T12:43:59.467Z"
    }
  ],
  "recentActivity": [
    {
      "sessionId": "session-uuid",
      "agentId": "agent-id",
      "channel": "telegram",
      "status": "active",
      "messageCount": 42,
      "updatedAt": "2026-02-08T12:44:19.348Z"
    }
  ],
  "systemHealth": {
    "status": "healthy",
    "uptime": 27,
    "memory": {
      "heapUsed": 106,
      "heapTotal": 110,
      "rss": 621
    },
    "cpu": {
      "user": 6897742,
      "system": 575393
    }
  },
  "timestamp": "2026-02-08T12:44:19.348Z"
}
```

### Usage Endpoint
**Endpoint:** `GET /api/admin/usage`

Returns current AI and database usage metrics plus lock states.

**Response:**
```json
{
  "ai": {
    "anthropic": { "spent": 12.50, "cap": 200, "remaining": 187.50, "percentUsed": 6 },
    "elevenlabs": { "spent": 0.00, "cap": 200, "remaining": 200.00, "percentUsed": 0 },
    "locked": false
  },
  "database": {
    "locked": false
  },
  "timestamp": "2026-02-19T12:00:00.000Z"
}
```

### Usage Lock Endpoint
**Endpoint:** `POST /api/admin/usage`

Lock or unlock AI/database usage to control costs.

**Request Body:**
```json
{
  "type": "ai",
  "locked": true
}
```

**Response:**
```json
{
  "success": true,
  "type": "ai",
  "locked": true
}
```

## Real-Time Updates

The dashboard automatically refreshes every **3 seconds** to provide real-time data.

## Implementation Details

### Files Created

1. **`/src/app/api/admin/stats/route.ts`**
   - Next.js API route handler
   - Aggregates data from all agents
   - Calculates system health metrics
   - Returns comprehensive stats

2. **`/src/app/admin/page.tsx`**
   - Client-side React component
   - Polls API every 3 seconds
   - Responsive grid layout
   - Color-coded status indicators

3. **`/src/app/api/admin/usage/route.ts`**
   - GET: Returns AI spending status and database lock state
   - POST: Toggles lock on AI or database usage
   - Integrates with spending-caps module

### Status Colors

- **Green**: healthy, running, active
- **Blue**: idle
- **Red**: error
- **Gray**: unknown/other

### Features

- ✅ Real-time updates (3s polling interval)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Dark theme matching CubiQo design system
- ✅ Error handling with fallback UI
- ✅ Formatted dates and timestamps
- ✅ Human-readable uptime display
- ✅ Memory usage in MB
- ✅ Active/total task counts
- ✅ Session truncation for readability
- ✅ AI usage monitoring with per-provider spending bars
- ✅ Database usage monitoring
- ✅ Admin lock controls for AI and database usage

## Usage

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/admin`

3. The dashboard will automatically load and begin polling for updates

## Future Enhancements

Potential improvements:
- WebSocket support for true real-time updates (no polling)
- Historical charts and graphs
- Agent control actions (start/stop/restart)
- Session inspection and debugging
- Log streaming
- Alert notifications
- Export metrics to CSV/JSON
- Authentication/authorization
- Custom refresh intervals
- Dark/light theme toggle
