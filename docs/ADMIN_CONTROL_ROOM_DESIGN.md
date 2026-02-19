# Admin Control Room Design: The "CubiQo Cockpit" v2.0
> A centralized, industry-standard admin dashboard for monitoring and managing the CubiQo platform.

## 1. Vision & Goals
*   **Unified Experience**: Consolidate disparate admin pages (Stats, Feature Flags, Emails) into a single, cohesive interface.
*   **Real-time Visibility**: "At-a-glance" health metrics for Agents, System load, and User engagement.
*   **Actionable Control**: Direct ability to toggle features, manage users, and intervene in agent operations.
*   **Premium Aesthetics**: Dark mode, glassmorphism, responsive charts, and smooth animations to match the main app's premium feel.

## 2. Architecture & Layout
We will adopt a **Sidebar + Main Content Area** layout for the `/admin` route.

### Sidebar Navigation
1.  **Overview (Dashboard)**: High-level KPIs (DAU/MAU, Revenue, System Health).
2.  **Network Operations (NOC)**: Deep dive into Agent status, specific node health, and error logs.
3.  **User Management**: User lists, search, ban/unban, premium status management.
4.  **Feature Flags**: Direct integration of the existing Feature Flag management UI.
5.  **Analytics**: Detailed event logs, conversion funnels, and retention charts.
6.  **Settings**: Global configuration and deployment triggers.

## 3. Key Components (Widgets)

### A. Overview Dashboard
*   **KPI Cards**:
    *   **Total Users**: Count from Supabase `auth.users`.
    *   **Active Sessions**: Real-time count of connected WebSockets/Chats.
    *   **System Health**: Global status (Green/Yellow/Red) based on API latency and Agent heartbeats.
    *   **Revenue (Simulated)**: MRR based on Premium user count.
*   **Activity Volume Chart**: Line chart showing request volume over the last 24h (using Recharts).
*   **Recent Alerts**: List of critical system errors or security flags.

### B. Network Operations (Agent Management)
*   **Agent Grid**: Cards for each active agent (e.g., "Marketing Agent", "Coding Agent").
    *   **Status Indicators**: Pulse animation for "Thinking", "Idle", "Offline".
    *   **Resource Usage**: CPU/Memory utilization bars.
    *   **Actions**: "Restart", "Pause", "View Logs" buttons.
*   **Live Console**: Streaming logs from the backend agent process.

### C. Feature Management (Integrated)
*   Re-use the existing `src/app/admin/feature-flags` logic but style it to match the new dashboard theme.
*   Add **"Kill Switch"** functionality for rapid disablement of critical features during incidents.

### D. User Management (New)
*   **Data Grid**: Sortable table of users with columns: ID, Email, Plan (Free/Premium), Join Date, Last Active.
*   **User Detail View**: Slide-over panel showing user history, conversation logs, and support tickets.
*   **Actions**: "Grant Premium", "Ban User", "Reset Password".

## 4. Technical Implementation

### Stack
*   **Framework**: Next.js (App Router)
*   **Styling**: Tailwind CSS (Dark Mode, Glassmorphism)
*   **Charts**: `recharts` (Standard, responsive React charting library)
*   **Icons**: `lucide-react`
*   **Data Source**:
    *   Supabase (Users, Flags, Logs)
    *   Existing `/api/admin/stats` endpoint (Agent/System stats)

### implementation Steps
1.  **Scaffold Layout**: Create `AdminLayout` component with sidebar.
2.  **Dashboard Page**: Build the Overview page with KPI cards and Activity Chart.
3.  **Migrate Existing Pages**: Move Feature Flags and Email Preview into the new layout structure.
4.  **Build User Manager**: Create the new User Management interface connected to Supabase.
5.  **Enhance Agent Controls**: Add the "Actions" capability to the existing Agent stats view.

## 5. Security
*   **Role-Based Access Control (RBAC)**: Ensure only users with `admin` role in `public.user_roles` (or specific email whitelist) can access.
*   **Audit Logging**: Every action taken in the Control Room (e.g., toggling a flag, banning a user) must be logged to `admin_audit_logs`.
