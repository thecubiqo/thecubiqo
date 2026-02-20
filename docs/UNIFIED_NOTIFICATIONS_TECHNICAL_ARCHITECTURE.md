# 🏗️ UNIFIED NOTIFICATIONS SYSTEM - TECHNICAL ARCHITECTURE

**Version:** 1.0  
**Architect:** MO (CTO)  
**Date:** February 18, 2026  
**Status:** ✅ APPROVED FOR IMPLEMENTATION

---

## 📋 EXECUTIVE SUMMARY

After reviewing JO's comprehensive PRD, I'm **approving the full scope** with strategic architectural guidance. This document provides the technical foundation for building 100+ integrations over 12 months.

**Key Decisions:**
- ✅ **Plugin Architecture** with service locator pattern
- ✅ **Hub-First Strategy** (Home Assistant = instant 2,000+ devices)
- ✅ **Hybrid Token Storage** (existing oauth_tokens + new integrations table)
- ✅ **WebSocket + Server-Sent Events** for real-time delivery
- ✅ **Single Webhook Router** with signature verification
- ✅ **Redis + Database Queue** hybrid approach
- ✅ **Redis State Cache** for smart home devices
- ✅ **Encryption + Rate Limiting** built-in
- ✅ **Team Structure:** Current team + 2 backend engineers

---

## 1. INTEGRATION ARCHITECTURE

### 1.1 Plugin System (APPROVED)

**Pattern:** Service Locator + Abstract Base Class + Registry

**Why This Pattern:**
- ✅ **Scalability:** Add 100+ integrations without refactoring core
- ✅ **Isolation:** Each integration is self-contained
- ✅ **Testability:** Mock integrations easily
- ✅ **Hot-reload:** Add new integrations without redeployment (via database registry)
- ✅ **Type Safety:** TypeScript interfaces enforce contracts

```typescript
// src/lib/integrations/base.ts

export enum IntegrationCategory {
  SOCIAL_MEDIA = 'social_media',
  CHAT = 'chat',
  SMART_HOME = 'smart_home',
  SMART_HOME_HUB = 'smart_home_hub',
  PRODUCTIVITY = 'productivity',
  ENTERTAINMENT = 'entertainment'
}

export enum IntegrationMethod {
  API = 'api',                    // Official REST/GraphQL API
  HUB = 'hub',                    // Smart home hub connector
  WEBHOOK = 'webhook',            // Real-time webhook
  BROWSER = 'browser',            // Browser automation (fallback)
  WEBSOCKET = 'websocket'         // Persistent connection
}

export enum AuthMethod {
  OAUTH2 = 'oauth2',
  API_KEY = 'api_key',
  SESSION = 'session',
  NONE = 'none'
}

export interface IntegrationMetadata {
  id: string;                     // 'twitter', 'philips_hue', 'home_assistant'
  name: string;                   // 'Twitter', 'Philips Hue', 'Home Assistant'
  category: IntegrationCategory;
  method: IntegrationMethod;
  authMethod: AuthMethod;
  
  // Branding
  logo: string;                   // URL or emoji
  color: string;                  // Primary brand color
  description: string;
  
  // Capabilities
  supportsNotifications: boolean;
  supportsActions: boolean;
  supportsWebhooks: boolean;
  supportsBidirectional: boolean; // Can both receive and send
  
  // Configuration
  requiredScopes?: string[];      // OAuth scopes
  webhookUrl?: string;            // Webhook endpoint
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  
  // Pricing tier required
  requiredTier?: 'free' | 'pro' | 'smart_home' | 'business';
}

export interface NotificationPayload {
  id: string;
  integrationId: string;
  type: string;                   // 'message', 'mention', 'alert', 'device_state_changed'
  title: string;
  body?: string;
  data: Record<string, any>;      // Integration-specific data
  priority: 0 | 1 | 2 | 3;        // 0=low, 1=normal, 2=high, 3=urgent
  timestamp: Date;
  expiresAt?: Date;
  
  // Actions available
  actions?: NotificationAction[];
  
  // Branding (inherit from integration)
  logo?: string;
  color?: string;
}

export interface NotificationAction {
  id: string;
  type: string;                   // 'reply', 'like', 'turn_on', 'set_temperature'
  label: string;
  icon?: string;
  risk: 'low' | 'medium' | 'high';
  parameters?: Record<string, any>;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export abstract class BaseIntegration {
  abstract metadata: IntegrationMetadata;
  
  // Lifecycle
  abstract initialize(credentials: any): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  
  // Authentication
  abstract authenticate(userId: string, credentials: any): Promise<void>;
  abstract refreshCredentials(userId: string): Promise<boolean>;
  
  // Notifications (pull-based)
  abstract fetchNotifications(userId: string, since?: Date): Promise<NotificationPayload[]>;
  
  // Webhooks (push-based)
  abstract handleWebhook?(payload: any): Promise<NotificationPayload>;
  abstract verifyWebhookSignature?(signature: string, payload: any): Promise<boolean>;
  
  // Actions
  abstract executeAction(userId: string, action: NotificationAction): Promise<ActionResult>;
  
  // Smart home specific
  abstract getDevices?(userId: string): Promise<SmartHomeDevice[]>;
  abstract getDeviceState?(userId: string, deviceId: string): Promise<any>;
  abstract setDeviceState?(userId: string, deviceId: string, state: any): Promise<boolean>;
}

export interface SmartHomeDevice {
  id: string;
  integrationId: string;
  type: 'light' | 'thermostat' | 'lock' | 'camera' | 'sensor' | 'switch' | 'plug' | 'other';
  name: string;
  room?: string;
  capabilities: string[];         // ['brightness', 'color', 'temperature']
  state: Record<string, any>;     // Current state
  online: boolean;
  lastUpdate: Date;
}
```

### 1.2 Integration Registry (Service Locator)

```typescript
// src/lib/integrations/registry.ts

export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private integrations = new Map<string, BaseIntegration>();
  
  private constructor() {}
  
  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
    }
    return IntegrationRegistry.instance;
  }
  
  register(integration: BaseIntegration): void {
    this.integrations.set(integration.metadata.id, integration);
  }
  
  get(integrationId: string): BaseIntegration | undefined {
    return this.integrations.get(integrationId);
  }
  
  getAll(): BaseIntegration[] {
    return Array.from(this.integrations.values());
  }
  
  getByCategory(category: IntegrationCategory): BaseIntegration[] {
    return this.getAll().filter(i => i.metadata.category === category);
  }
  
  async loadFromDatabase(): Promise<void> {
    // Load dynamically enabled integrations from DB
    // This allows adding new integrations without redeployment
  }
}
```

---

## 2. DATABASE SCHEMA (APPROVED)

### 2.1 Core Tables

JO's proposed schema is **90% approved**. I'm making minor adjustments:

```sql
-- ============================================================================
-- USER_INTEGRATIONS (JO's proposal + my additions)
-- ============================================================================

CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Integration identity
  integration_id TEXT NOT NULL,              -- 'twitter', 'philips_hue', etc.
  integration_category TEXT NOT NULL,        -- enum: social_media, chat, smart_home, etc.
  integration_method TEXT NOT NULL,          -- enum: api, hub, webhook, browser
  
  -- Credentials (use existing oauth_tokens table for OAuth)
  -- For API keys and custom auth, store here encrypted
  credentials_encrypted TEXT,                -- Encrypted JSON for non-OAuth
  
  -- Configuration
  settings JSONB DEFAULT '{}',               -- User preferences per integration
  webhook_secret TEXT,                       -- For webhook signature verification
  
  -- Status
  status TEXT DEFAULT 'active',              -- active, paused, error, expired
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT integration_category_valid CHECK (
    integration_category IN ('social_media', 'chat', 'smart_home', 'smart_home_hub', 'productivity', 'entertainment')
  ),
  CONSTRAINT integration_method_valid CHECK (
    integration_method IN ('api', 'hub', 'webhook', 'browser', 'websocket')
  ),
  CONSTRAINT status_valid CHECK (
    status IN ('active', 'paused', 'error', 'expired')
  )
);

CREATE UNIQUE INDEX idx_user_integrations_unique 
  ON user_integrations(user_id, integration_id);
CREATE INDEX idx_user_integrations_status 
  ON user_integrations(status) WHERE status = 'active';
CREATE INDEX idx_user_integrations_category 
  ON user_integrations(integration_category);

-- ============================================================================
-- NOTIFICATIONS (JO's proposal - APPROVED AS-IS)
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  type TEXT NOT NULL,                        -- 'message', 'mention', 'alert', etc.
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',                   -- Integration-specific data
  
  -- Priority & urgency
  priority INTEGER DEFAULT 1,                -- 0=low, 1=normal, 2=high, 3=urgent
  
  -- Actions available
  actions JSONB DEFAULT '[]',                -- Array of NotificationAction
  
  -- Status
  read_at TIMESTAMPTZ,
  acted_on_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT priority_valid CHECK (priority >= 0 AND priority <= 3)
);

-- Critical indexes for performance
CREATE INDEX idx_notifications_user_unread 
  ON notifications(user_id, created_at DESC) 
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_priority 
  ON notifications(user_id, priority DESC, created_at DESC) 
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_integration 
  ON notifications(integration_id, created_at DESC);
CREATE INDEX idx_notifications_expires 
  ON notifications(expires_at) 
  WHERE expires_at IS NOT NULL;

-- ============================================================================
-- ACTION_EXECUTIONS (JO's proposal - APPROVED AS-IS)
-- ============================================================================

CREATE TABLE action_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
  
  -- Action details
  action_type TEXT NOT NULL,                 -- 'reply', 'like', 'turn_on', etc.
  action_data JSONB DEFAULT '{}',
  
  -- Execution tracking
  status TEXT DEFAULT 'pending',             -- pending, executing, success, failed
  result JSONB,
  error TEXT,
  retry_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT status_valid CHECK (
    status IN ('pending', 'executing', 'success', 'failed', 'cancelled')
  )
);

CREATE INDEX idx_action_executions_user ON action_executions(user_id);
CREATE INDEX idx_action_executions_status 
  ON action_executions(status, created_at DESC) 
  WHERE status IN ('pending', 'executing');
CREATE INDEX idx_action_executions_notification 
  ON action_executions(notification_id);

-- ============================================================================
-- SMART_HOME_DEVICES (JO's proposal + my additions)
-- ============================================================================

CREATE TABLE smart_home_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
  
  -- Device identity
  device_id TEXT NOT NULL,                   -- ID from the integration
  device_type TEXT NOT NULL,                 -- light, thermostat, lock, camera, etc.
  device_name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  
  -- Organization
  room TEXT,                                 -- 'Living Room', 'Bedroom', etc.
  zone TEXT,                                 -- 'Upstairs', 'Downstairs', etc.
  
  -- Capabilities
  capabilities JSONB DEFAULT '{}',           -- {brightness: true, color: true}
  
  -- State (cached from hub/device)
  state JSONB DEFAULT '{}',                  -- Current device state
  online BOOLEAN DEFAULT true,
  
  -- Metadata
  last_update_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT device_type_valid CHECK (
    device_type IN ('light', 'thermostat', 'lock', 'camera', 'sensor', 'switch', 'plug', 'speaker', 'tv', 'appliance', 'other')
  )
);

CREATE UNIQUE INDEX idx_smart_home_devices_unique 
  ON smart_home_devices(user_id, integration_id, device_id);
CREATE INDEX idx_smart_home_devices_user ON smart_home_devices(user_id);
CREATE INDEX idx_smart_home_devices_type ON smart_home_devices(device_type);
CREATE INDEX idx_smart_home_devices_room ON smart_home_devices(room);
CREATE INDEX idx_smart_home_devices_online ON smart_home_devices(online) WHERE online = true;

-- ============================================================================
-- INTEGRATION_RATE_LIMITS (NEW - for rate limiting)
-- ============================================================================

CREATE TABLE integration_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
  
  window_start TIMESTAMPTZ NOT NULL,
  window_duration_minutes INT NOT NULL,
  request_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, window_start, window_duration_minutes)
);

CREATE INDEX idx_rate_limits_integration 
  ON integration_rate_limits(integration_id, window_start DESC);
```

### 2.2 Use Existing oauth_tokens Table

**Decision:** Reuse existing `oauth_tokens` table (already encrypted) for OAuth-based integrations.

**Mapping:**
- `oauth_tokens.provider` → integration_id (e.g., 'twitter', 'google', 'philips_hue')
- `oauth_tokens.access_token_encrypted` → encrypted access token
- `oauth_tokens.refresh_token_encrypted` → encrypted refresh token
- `oauth_tokens.expires_at` → token expiry

**For non-OAuth integrations** (API keys, browser sessions), store in `user_integrations.credentials_encrypted`.

---

## 3. SMART HOME HUBS STRATEGY (APPROVED)

### 3.1 Hub-First Approach (CRITICAL DECISION)

**✅ APPROVED: Build hubs FIRST, then direct integrations**

**Priority Order:**
1. **Home Assistant** (2,000+ devices via single integration!)
2. **Apple HomeKit** (Apple ecosystem)
3. **Google Home** (Google ecosystem)
4. **SmartThings** (Samsung ecosystem)

**Why Hub-First Wins:**
- ✅ **1 integration = 2,000+ devices** (Home Assistant alone)
- ✅ **Users already have hubs set up** (smart home enthusiasts)
- ✅ **Unified API** (one pattern for 2,000+ devices)
- ✅ **Proven reliability** (hubs handle device communication)
- ✅ **Less OAuth complexity** (authenticate with hub, not each device)

### 3.2 Home Assistant Integration Architecture

```typescript
// src/lib/integrations/hubs/home-assistant.ts

export class HomeAssistantIntegration extends BaseIntegration {
  metadata: IntegrationMetadata = {
    id: 'home_assistant',
    name: 'Home Assistant',
    category: IntegrationCategory.SMART_HOME_HUB,
    method: IntegrationMethod.API,
    authMethod: AuthMethod.API_KEY,
    logo: '🏠',
    color: '#41BDF5',
    description: 'Open-source smart home hub supporting 2,000+ devices',
    supportsNotifications: true,
    supportsActions: true,
    supportsWebhooks: true,
    supportsBidirectional: true,
    requiredTier: 'smart_home'
  };
  
  private baseUrl: string = '';
  private accessToken: string = '';
  private ws: WebSocket | null = null;
  
  async initialize(credentials: { url: string; token: string }): Promise<void> {
    this.baseUrl = credentials.url;
    this.accessToken = credentials.token;
    
    // Test connection
    const health = await this.healthCheck();
    if (!health) throw new Error('Failed to connect to Home Assistant');
    
    // Subscribe to events via WebSocket
    await this.connectWebSocket();
  }
  
  async getDevices(userId: string): Promise<SmartHomeDevice[]> {
    const response = await fetch(`${this.baseUrl}/api/states`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const entities = await response.json();
    
    return entities
      .filter((e: any) => this.isControllableDevice(e.entity_id))
      .map((e: any) => this.mapToDevice(e));
  }
  
  async setDeviceState(userId: string, deviceId: string, state: any): Promise<boolean> {
    const [domain, ...rest] = deviceId.split('.');
    const service = this.getServiceForState(domain, state);
    
    const response = await fetch(`${this.baseUrl}/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_id: deviceId,
        ...state
      })
    });
    
    return response.ok;
  }
  
  private async connectWebSocket(): Promise<void> {
    const wsUrl = this.baseUrl.replace('http', 'ws') + '/api/websocket';
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'event') {
        this.handleEvent(message.event);
      }
    });
    
    // Authenticate
    this.ws.on('open', () => {
      this.ws?.send(JSON.stringify({
        type: 'auth',
        access_token: this.accessToken
      }));
      
      // Subscribe to state changes
      this.ws?.send(JSON.stringify({
        id: 1,
        type: 'subscribe_events',
        event_type: 'state_changed'
      }));
    });
  }
  
  private handleEvent(event: any): void {
    // Convert Home Assistant event to NotificationPayload
    // Push to notification queue
  }
  
  private isControllableDevice(entityId: string): boolean {
    const domain = entityId.split('.')[0];
    return ['light', 'switch', 'climate', 'lock', 'cover', 'fan'].includes(domain);
  }
  
  private mapToDevice(entity: any): SmartHomeDevice {
    const domain = entity.entity_id.split('.')[0];
    
    return {
      id: entity.entity_id,
      integrationId: 'home_assistant',
      type: this.mapDomainToType(domain),
      name: entity.attributes.friendly_name || entity.entity_id,
      room: entity.attributes.room,
      capabilities: this.extractCapabilities(entity),
      state: entity.state,
      online: entity.state !== 'unavailable',
      lastUpdate: new Date(entity.last_changed)
    };
  }
  
  private mapDomainToType(domain: string): SmartHomeDevice['type'] {
    const mapping: Record<string, SmartHomeDevice['type']> = {
      light: 'light',
      switch: 'switch',
      climate: 'thermostat',
      lock: 'lock',
      camera: 'camera',
      sensor: 'sensor',
      binary_sensor: 'sensor',
      cover: 'other',
      fan: 'other'
    };
    return mapping[domain] || 'other';
  }
}
```

---

## 4. NOTIFICATION DELIVERY (WebSocket + SSE)

### 4.1 Architecture Decision: Hybrid Approach

**✅ APPROVED: WebSocket (primary) + Server-Sent Events (fallback)**

**Why Hybrid:**
- ✅ **WebSocket:** Best for web app (bidirectional, low latency)
- ✅ **SSE:** Fallback for restrictive networks
- ✅ **Both scale horizontally** with Redis pub/sub
- ✅ **Mobile:** Use native push notifications (FCM/APNS)

```typescript
// src/lib/notifications/delivery.ts

export class NotificationDeliveryService {
  private redis: Redis;
  private pubsub: RedisPubSub;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.pubsub = new RedisPubSub({
      publisher: new Redis(process.env.REDIS_URL),
      subscriber: new Redis(process.env.REDIS_URL)
    });
  }
  
  /**
   * Push notification to user's active connections
   */
  async pushNotification(userId: string, notification: NotificationPayload): Promise<void> {
    // 1. Save to database
    await this.saveToDatabase(userId, notification);
    
    // 2. Publish to Redis (for horizontal scaling)
    await this.pubsub.publish(`notifications:${userId}`, notification);
    
    // 3. Check user's active connections and delivery preferences
    const connections = await this.getActiveConnections(userId);
    
    if (connections.web) {
      // Send via WebSocket
      connections.web.forEach(ws => ws.send(JSON.stringify(notification)));
    }
    
    if (connections.mobile) {
      // Send push notification via FCM/APNS
      await this.sendPushNotification(userId, notification);
    }
  }
  
  /**
   * Handle 1,000+ notifications/second
   */
  async batchPushNotifications(notifications: Array<{ userId: string; notification: NotificationPayload }>): Promise<void> {
    // Use Redis pipeline for bulk inserts
    const pipeline = this.redis.pipeline();
    
    for (const { userId, notification } of notifications) {
      pipeline.publish(`notifications:${userId}`, JSON.stringify(notification));
    }
    
    await pipeline.exec();
    
    // Batch database insert
    await this.batchSaveToDatabase(notifications);
  }
  
  private async saveToDatabase(userId: string, notification: NotificationPayload): Promise<void> {
    // Save to Supabase
  }
  
  private async getActiveConnections(userId: string): Promise<any> {
    // Check Redis for active WebSocket/SSE connections
    const connections = await this.redis.hgetall(`connections:${userId}`);
    return connections;
  }
}
```

### 4.2 WebSocket Server

```typescript
// src/app/api/ws/route.ts

import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, request) => {
  const userId = getUserIdFromRequest(request);
  
  // Register connection
  registerConnection(userId, ws);
  
  // Subscribe to user's notification channel
  subscribeToNotifications(userId, (notification) => {
    ws.send(JSON.stringify({
      type: 'notification',
      data: notification
    }));
  });
  
  ws.on('close', () => {
    unregisterConnection(userId, ws);
  });
});

export async function GET(req: NextRequest) {
  // Upgrade to WebSocket
  // Implementation depends on Next.js runtime
}
```

---

## 5. WEBHOOK ROUTER (Single Endpoint)

### 5.1 Architecture Decision: Single Router

**✅ APPROVED: `/api/webhooks/[integration]` pattern**

**Why Single Router:**
- ✅ **Centralized signature verification**
- ✅ **Consistent logging/monitoring**
- ✅ **Rate limiting per integration**
- ✅ **Easy to add new integrations**

```typescript
// src/app/api/webhooks/[integration]/route.ts

export async function POST(req: NextRequest, { params }: { params: { integration: string } }) {
  const integrationId = params.integration;
  
  // 1. Get integration from registry
  const integration = IntegrationRegistry.getInstance().get(integrationId);
  if (!integration) {
    return new Response('Integration not found', { status: 404 });
  }
  
  // 2. Verify webhook signature
  const signature = req.headers.get('x-webhook-signature');
  const body = await req.text();
  
  if (!await integration.verifyWebhookSignature?.(signature || '', body)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  // 3. Parse webhook payload
  const payload = JSON.parse(body);
  
  // 4. Convert to notification
  const notification = await integration.handleWebhook?.(payload);
  if (!notification) {
    return new Response('Webhook handled', { status: 200 });
  }
  
  // 5. Determine user (from webhook payload or integration settings)
  const userId = await getUserIdForWebhook(integrationId, payload);
  
  // 6. Push notification
  await NotificationDeliveryService.pushNotification(userId, notification);
  
  // 7. Log to audit
  await logWebhook(integrationId, userId, payload, notification);
  
  return new Response('OK', { status: 200 });
}
```

### 5.2 Webhook Signature Verification

Each integration implements its own verification:

```typescript
// Example: Twitter webhook signature verification
async verifyWebhookSignature(signature: string, payload: string): Promise<boolean> {
  const hmac = crypto.createHmac('sha256', this.webhookSecret);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## 6. TASK QUEUE (Hybrid: Redis + Database)

### 6.1 Architecture Decision: Redis Primary, Database Fallback

**✅ APPROVED: Redis (BullMQ) + Database backup**

**Why Hybrid:**
- ✅ **Redis (BullMQ):** Fast, battle-tested, priority queues, retries
- ✅ **Database:** Persistent backup, long-term audit trail
- ✅ **Best of both worlds:** Speed + durability

```typescript
// src/lib/queue/action-queue.ts

import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

export const actionQueue = new Queue('actions', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Priority queues
export enum ActionPriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 2,
  URGENT = 1
}

export async function enqueueAction(action: NotificationAction, userId: string, integrationId: string, priority: ActionPriority = ActionPriority.NORMAL) {
  // 1. Save to database (for audit)
  const execution = await saveActionExecution({
    userId,
    integrationId,
    actionType: action.type,
    actionData: action.parameters,
    status: 'pending'
  });
  
  // 2. Enqueue in Redis
  await actionQueue.add('execute-action', {
    executionId: execution.id,
    userId,
    integrationId,
    action
  }, {
    priority
  });
  
  return execution.id;
}

// Worker to process actions
const actionWorker = new Worker('actions', async (job) => {
  const { executionId, userId, integrationId, action } = job.data;
  
  // 1. Update status to executing
  await updateActionExecution(executionId, { status: 'executing', started_at: new Date() });
  
  // 2. Get integration
  const integration = IntegrationRegistry.getInstance().get(integrationId);
  if (!integration) {
    throw new Error('Integration not found');
  }
  
  // 3. Execute action
  const result = await integration.executeAction(userId, action);
  
  // 4. Update status
  await updateActionExecution(executionId, {
    status: result.success ? 'success' : 'failed',
    result: result.data,
    error: result.error,
    completed_at: new Date()
  });
  
  return result;
}, { connection });

actionWorker.on('failed', (job, err) => {
  console.error(`Action failed: ${job?.id}`, err);
  // Update database status to failed
  updateActionExecution(job?.data.executionId, {
    status: 'failed',
    error: err.message
  });
});
```

---

## 7. SMART HOME STATE MANAGEMENT

### 7.1 Architecture Decision: Redis Cache + On-Demand Query

**✅ APPROVED: Redis cache with TTL + lazy fetch**

**Why Hybrid:**
- ✅ **Redis cache:** Fast reads for frequently accessed devices
- ✅ **TTL:** 30 seconds (balance freshness vs load)
- ✅ **On-demand query:** Fetch from hub if cache miss
- ✅ **WebSocket updates:** Real-time state changes invalidate cache

```typescript
// src/lib/smart-home/state-cache.ts

export class SmartHomeStateCache {
  private redis: Redis;
  private TTL = 30; // seconds
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  /**
   * Get device state (cached)
   */
  async getDeviceState(userId: string, deviceId: string): Promise<any> {
    const cacheKey = `device_state:${userId}:${deviceId}`;
    
    // 1. Try cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 2. Cache miss - fetch from hub
    const state = await this.fetchFromHub(userId, deviceId);
    
    // 3. Cache for TTL
    await this.redis.setex(cacheKey, this.TTL, JSON.stringify(state));
    
    return state;
  }
  
  /**
   * Get all devices for user (cached)
   */
  async getUserDevices(userId: string): Promise<SmartHomeDevice[]> {
    const cacheKey = `devices:${userId}`;
    
    // 1. Try cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 2. Cache miss - fetch from database
    const devices = await fetchDevicesFromDatabase(userId);
    
    // 3. Cache for 5 minutes (devices don't change often)
    await this.redis.setex(cacheKey, 300, JSON.stringify(devices));
    
    return devices;
  }
  
  /**
   * Invalidate cache when state changes
   */
  async invalidateDeviceState(userId: string, deviceId: string): Promise<void> {
    const cacheKey = `device_state:${userId}:${deviceId}`;
    await this.redis.del(cacheKey);
  }
  
  /**
   * Bulk update from hub (webhook)
   */
  async bulkUpdateStates(userId: string, states: Array<{ deviceId: string; state: any }>): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const { deviceId, state } of states) {
      const cacheKey = `device_state:${userId}:${deviceId}`;
      pipeline.setex(cacheKey, this.TTL, JSON.stringify(state));
    }
    
    await pipeline.exec();
    
    // Also update database
    await bulkUpdateDatabase(userId, states);
  }
  
  private async fetchFromHub(userId: string, deviceId: string): Promise<any> {
    // Determine which integration/hub this device belongs to
    const device = await getDeviceFromDatabase(userId, deviceId);
    const integration = IntegrationRegistry.getInstance().get(device.integration_id);
    return await integration?.getDeviceState?.(userId, deviceId);
  }
}
```

### 7.2 Handling 1,000+ Devices Per User

**Strategy:**
- ✅ **Lazy loading:** Only fetch devices when needed
- ✅ **Pagination:** Display 20 devices at a time
- ✅ **Room-based filtering:** Users browse by room
- ✅ **Search:** Full-text search on device names
- ✅ **Favorites:** Cache frequently used devices

```typescript
// API endpoint
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  const { room, type, search, page = 1, limit = 20 } = req.query;
  
  // Build query
  let query = supabase
    .from('smart_home_devices')
    .select('*')
    .eq('user_id', userId);
  
  if (room) query = query.eq('room', room);
  if (type) query = query.eq('device_type', type);
  if (search) query = query.ilike('device_name', `%${search}%`);
  
  // Pagination
  const start = (page - 1) * limit;
  query = query.range(start, start + limit - 1);
  
  const { data, error } = await query;
  
  return Response.json({ devices: data });
}
```

---

## 8. SECURITY & COMPLIANCE

### 8.1 Encryption at Rest

**✅ APPROVED: Encrypt all sensitive data**

```typescript
// src/lib/security/encryption.ts

import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**What gets encrypted:**
- ✅ OAuth tokens (`oauth_tokens.access_token_encrypted`)
- ✅ API keys (`user_integrations.credentials_encrypted`)
- ✅ Notification data (if contains PII)
- ✅ Smart home device states (if sensitive, e.g., camera feeds)

### 8.2 Rate Limiting

```typescript
// src/lib/security/rate-limiter.ts

export async function checkRateLimit(integrationId: string, userId: string): Promise<boolean> {
  const integration = IntegrationRegistry.getInstance().get(integrationId);
  if (!integration?.metadata.rateLimits) return true;
  
  const { requestsPerMinute, requestsPerHour } = integration.metadata.rateLimits;
  
  // Check minute window
  const minuteKey = `rate_limit:${integrationId}:${userId}:${Math.floor(Date.now() / 60000)}`;
  const minuteCount = await redis.incr(minuteKey);
  await redis.expire(minuteKey, 60);
  
  if (minuteCount > requestsPerMinute) {
    return false;
  }
  
  // Check hour window
  const hourKey = `rate_limit:${integrationId}:${userId}:${Math.floor(Date.now() / 3600000)}`;
  const hourCount = await redis.incr(hourKey);
  await redis.expire(hourKey, 3600);
  
  if (hourCount > requestsPerHour) {
    return false;
  }
  
  return true;
}
```

### 8.3 GDPR Compliance

**Data Retention:**
- ✅ **Notifications:** Delete after 30 days (configurable per user)
- ✅ **Action logs:** Keep for 90 days (audit requirement)
- ✅ **Device states:** Real-time, no historical storage
- ✅ **User right to delete:** Cascade delete on account deletion (already in schema)

**Data Export:**
```typescript
export async function exportUserData(userId: string): Promise<any> {
  // Export all user data for GDPR compliance
  const data = {
    integrations: await getUserIntegrations(userId),
    notifications: await getUserNotifications(userId),
    actions: await getUserActions(userId),
    devices: await getUserDevices(userId)
  };
  
  // Decrypt encrypted fields
  // Return as JSON
  return data;
}
```

---

## 9. TEAM STRUCTURE & RESOURCES

### 9.1 Current Team (Phase 1A: 11 Integrations)

**Blossom (Backend):**
- OAuth manager
- Integration registry & plugin system
- Webhook router
- 3 API integrations (Twitter, LinkedIn, Instagram)
- 2 hub integrations (Home Assistant, Google Home)

**Bubbles (Frontend):**
- NotificationCenter UI
- ActionCard components (3 social media variants)
- Smart home dashboard (basic)
- WebSocket client
- Real-time updates

**Pushpa (UI/UX):**
- Design system for notifications
- 5 branded ActionCard designs (Twitter, LinkedIn, Instagram, Hue, Nest)
- Smart home device icons
- Animations (light on/off, lock/unlock)

**Guy (DBA):**
- Database schema (4 new tables)
- Indexes & performance tuning
- Redis setup
- Data migration scripts

**Buttercup (QA):**
- E2E tests for 11 integrations
- Load testing (100 notifications/second)
- Security testing (OAuth flows)

**MO (CTO - Me):**
- Architecture review (this document)
- Code reviews (all PRs)
- Performance optimization
- Security audit

### 9.2 Hiring Needs (Phase 1B+: 21-70 Integrations)

**✅ APPROVED: Hire 2 Backend Engineers**

**Backend Engineer #1: Social Media Specialist**
- Build 20+ social media integrations (Phase 2-3)
- OAuth expert
- API rate limiting & pagination
- Experience with Twitter, LinkedIn, Instagram, TikTok APIs

**Backend Engineer #2: Smart Home Specialist**
- Build 40+ smart home integrations (Phase 2-3)
- Experience with IoT protocols (MQTT, Zigbee, Z-Wave)
- WebSocket expert (Home Assistant, SmartThings)
- Embedded systems background preferred

**Timeline:** Hire by Week 8 (end of Phase 1A)  
**Budget:** $120K-$150K/year each (remote, full-time)  
**Onboarding:** 2 weeks (I'll mentor personally)

### 9.3 Optional: Hire 1 DevOps Engineer (Phase 2)

**If scaling issues arise:**
- Redis cluster management
- WebSocket scaling (millions of connections)
- Monitoring & alerting (Datadog, Sentry)
- Cost optimization

**Timeline:** Assess need at Week 16 (end of Phase 1B)  
**Budget:** $130K-$170K/year

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1A: Foundation + 11 Integrations (16 weeks)

**Weeks 1-4: Infrastructure**
- [ ] Database schema (Guy)
- [ ] Integration registry + plugin system (Blossom)
- [ ] OAuth manager (Blossom)
- [ ] Webhook router (Blossom)
- [ ] Redis setup (Guy)
- [ ] Action queue (Blossom)
- [ ] WebSocket server (Blossom)
- [ ] Design system (Pushpa)

**Weeks 5-8: First 6 Integrations**
- [ ] WhatsApp (Blossom - browser automation)
- [ ] Telegram (Blossom - API) ✅ STARTED
- [ ] Discord (Blossom - webhook)
- [ ] Twitter/X (Blossom - API)
- [ ] LinkedIn (Blossom - API)
- [ ] Instagram (Blossom - API)

**Weeks 9-12: Smart Home (5 Integrations)**
- [ ] Home Assistant (Blossom - WebSocket + API)
- [ ] Apple HomeKit (Blossom - API)
- [ ] Google Home (Blossom - API)
- [ ] Philips Hue (Blossom - API)
- [ ] Nest (Blossom - API)

**Weeks 13-16: Testing & Polish**
- [ ] E2E tests (Buttercup)
- [ ] Load testing (Buttercup)
- [ ] Security audit (Me + Buttercup)
- [ ] Performance optimization (Me + Blossom)
- [ ] Documentation (Everyone)
- [ ] Beta launch 🚀

**Go-Live:** June 2026 (11 integrations)

### Phase 1B: Expansion to 21 (8 weeks)

**Weeks 17-22: Next 10 Integrations**
- [ ] Slack, iMessage, Teams (Chat)
- [ ] Facebook, TikTok, Reddit (Social)
- [ ] Ring, August, Sonos, MyQ (Smart Home)

**Weeks 23-24: Testing**
- [ ] E2E tests
- [ ] Beta feedback iteration

**Go-Live:** August 2026 (21 integrations)

### Phase 2: Scale to 46 (12 weeks)

**Hire Backend Engineers #1 & #2** (Week 17-18)

**Weeks 25-34: Next 25 Integrations**
- Backend #1: 10 social media (YouTube, Medium, Dev.to, etc.)
- Backend #2: 15 smart home (LIFX, Nanoleaf, Arlo, etc.)

**Weeks 35-36: Testing**

**Go-Live:** November 2026 (46 integrations)

### Phase 3: Long Tail to 70+ (16 weeks)

**Weeks 37-50: Final 24+ Integrations**
- Backend #1: 10 social (Snapchat, Weibo, etc.)
- Backend #2: 14 smart home (remaining devices)

**Weeks 51-52: Final Polish**

**Go-Live:** March 2027 (70+ integrations)

---

## 11. RISKS & MITIGATION

### Risk 1: OAuth Complexity (50+ Platforms)

**Impact:** HIGH - Each platform has unique OAuth flow  
**Mitigation:**
- ✅ Abstract OAuth manager (reusable)
- ✅ Use existing oauth_tokens table
- ✅ Test each integration thoroughly
- ✅ Document OAuth flows in wiki

### Risk 2: API Rate Limits

**Impact:** MEDIUM - Could hit limits with many users  
**Mitigation:**
- ✅ Implement rate limiting per integration
- ✅ Use webhooks where possible (push > pull)
- ✅ Cache aggressively (Redis)
- ✅ Queue requests (BullMQ)

### Risk 3: Smart Home Hub Reliability

**Impact:** MEDIUM - User's hub could be offline  
**Mitigation:**
- ✅ Health checks every 5 minutes
- ✅ Fallback to direct device APIs if hub fails
- ✅ User notifications when hub offline
- ✅ Retry with exponential backoff

### Risk 4: Scaling WebSocket Connections

**Impact:** HIGH - 10,000 users = 10,000 connections  
**Mitigation:**
- ✅ Redis pub/sub for horizontal scaling
- ✅ Use Server-Sent Events as fallback
- ✅ Close idle connections after 30 minutes
- ✅ Load balancer with sticky sessions

### Risk 5: Browser Automation Fragility

**Impact:** MEDIUM - WhatsApp Web could change DOM  
**Mitigation:**
- ✅ Use browser automation as last resort
- ✅ Version selectors (support multiple versions)
- ✅ Auto-heal (detect changes, update selectors)
- ✅ Notify users when broken

### Risk 6: GDPR Compliance

**Impact:** HIGH - EU users, data retention  
**Mitigation:**
- ✅ Encrypt all PII at rest
- ✅ Auto-delete notifications after 30 days
- ✅ User data export API
- ✅ Right to be forgotten (cascade delete)
- ✅ Legal review before EU launch

### Risk 7: Team Bandwidth (100+ Integrations)

**Impact:** HIGH - Current team can't build 100+ integrations  
**Mitigation:**
- ✅ Hire 2 backend engineers (Week 8)
- ✅ Plugin system makes adding integrations fast
- ✅ Prioritize top 20 integrations (80/20 rule)
- ✅ Community contributions (open-source plugin SDK?)

---

## 12. SUCCESS METRICS

### Technical KPIs

**Performance:**
- ✅ Notification delivery: < 500ms (95th percentile)
- ✅ Action execution: < 2 seconds (95th percentile)
- ✅ WebSocket latency: < 100ms
- ✅ API uptime: 99.9%

**Scalability:**
- ✅ Handle 1,000 notifications/second per server
- ✅ Support 10,000 concurrent WebSocket connections
- ✅ 1M+ notifications stored and queryable

**Quality:**
- ✅ Test coverage: > 80%
- ✅ Zero critical security vulnerabilities (CodeQL)
- ✅ Zero data breaches
- ✅ Integration reliability: > 95% uptime per integration

### Business KPIs (From JO's PRD)

**Phase 1A (June 2026):**
- ✅ 11 integrations live
- ✅ 500+ active users
- ✅ 80% notification response rate
- ✅ $10K MRR

**Phase 2 (November 2026):**
- ✅ 46 integrations live
- ✅ 5,000+ active users
- ✅ $50K MRR

**Phase 3 (March 2027):**
- ✅ 70+ integrations live
- ✅ 20,000+ active users
- ✅ $150K MRR

---

## 13. FINAL RECOMMENDATIONS

### ✅ APPROVED: Full Scope

I'm **greenlighting the full 100+ integrations over 12 months**. The architecture is sound, scalable, and achievable with the right team.

### Critical Success Factors

1. **Start with Hubs** - Home Assistant first (2,000+ devices instantly)
2. **Perfect Top 5** - WhatsApp, Twitter, Gmail, Hue, Nest before scaling
3. **Hire Smart** - 2 backend engineers by Week 8
4. **Leverage Existing** - Reuse oauth_tokens, ActionCard, browser automation
5. **Iterate Fast** - Ship Phase 1A in 16 weeks, get feedback, iterate

### What I'll Own

- ✅ **All code reviews** - Every PR goes through me
- ✅ **Architecture decisions** - Final call on patterns, tech choices
- ✅ **Security audits** - Personal review of encryption, auth, RLS
- ✅ **Performance optimization** - I'll tune the hot paths
- ✅ **Team mentorship** - I'll train the new hires

### What I Need from You (CEO/JO)

1. **Budget approval** for 2 backend engineers ($240K-$300K/year)
2. **Hiring timeline** - Post job listings by Week 4, hire by Week 8
3. **Product priorities** - Confirm top 20 integrations (80/20 rule)
4. **Go/No-Go decision** on Phase 2 after Phase 1A launch
5. **Marketing coordination** - Beta launch plan for June 2026

---

## 14. NEXT STEPS

### This Week (Week 1)
- [ ] **CEO:** Approve budget for 2 backend engineers
- [ ] **JO:** Finalize top 20 integrations priority
- [ ] **Me:** Create ADRs (Architecture Decision Records)
- [ ] **Guy:** Start database schema implementation
- [ ] **Pushpa:** Start design system (branded ActionCards)

### Week 2-4
- [ ] **Blossom:** Build integration registry + plugin system
- [ ] **Blossom:** Build OAuth manager
- [ ] **Blossom:** Build webhook router
- [ ] **Guy:** Redis setup + performance testing
- [ ] **Pushpa:** Complete designs for 11 integrations
- [ ] **Me:** Code reviews + architecture refinement

### Week 5-8
- [ ] **Blossom:** Build first 6 integrations (chat + social)
- [ ] **Bubbles:** Build NotificationCenter UI
- [ ] **Pushpa:** Build branded ActionCard components
- [ ] **Buttercup:** Start E2E test plan
- [ ] **Me:** Review integrations, security audit
- [ ] **CEO/JO:** Hire 2 backend engineers

### Week 9-12
- [ ] **Blossom:** Build 5 smart home integrations (hubs + direct)
- [ ] **Bubbles:** Build smart home dashboard
- [ ] **Backend #1 & #2:** Onboarding + learning codebase
- [ ] **Buttercup:** E2E tests for 11 integrations
- [ ] **Me:** Performance optimization, code reviews

### Week 13-16
- [ ] **Everyone:** Testing, polish, documentation
- [ ] **Me:** Final security audit
- [ ] **JO:** Beta launch plan
- [ ] **CEO:** Marketing prep
- [ ] **🚀 LAUNCH Phase 1A** (June 2026)

---

## 15. APPENDIX

### A. Tech Stack Summary

**Backend:**
- Next.js API routes (TypeScript)
- Supabase (PostgreSQL + Realtime + Auth)
- Redis (state cache, rate limiting, pub/sub)
- BullMQ (action queue)
- Puppeteer (browser automation)

**Frontend:**
- Next.js (App Router)
- React 19 + TypeScript
- Tailwind CSS
- WebSocket (native) / SSE
- Framer Motion (animations)

**Infrastructure:**
- Vercel (hosting)
- Supabase Cloud (database)
- Redis Cloud (optional, or Vercel KV)
- GitHub Actions (CI/CD)

**Monitoring:**
- Sentry (errors)
- Vercel Analytics (performance)
- Custom dashboard (integration health)

### B. Key Files to Create

```
src/lib/integrations/
├── base.ts                  # BaseIntegration abstract class
├── registry.ts              # IntegrationRegistry singleton
├── oauth-manager.ts         # OAuth token management
├── social/
│   ├── twitter.ts
│   ├── linkedin.ts
│   └── instagram.ts
├── chat/
│   ├── whatsapp.ts
│   ├── telegram.ts          # ✅ STARTED
│   └── discord.ts
└── hubs/
    ├── home-assistant.ts
    ├── google-home.ts
    └── apple-homekit.ts

src/lib/notifications/
├── delivery.ts              # NotificationDeliveryService
├── queue.ts                 # Action queue (BullMQ)
└── webhook-verifier.ts      # Signature verification

src/lib/smart-home/
├── state-cache.ts           # Redis cache for device states
└── device-mapper.ts         # Hub → generic device mapping

src/app/api/
├── webhooks/[integration]/route.ts
├── notifications/route.ts
├── integrations/route.ts
├── actions/route.ts
└── ws/route.ts              # WebSocket server

supabase/migrations/
└── 20260218000001_unified_notifications.sql
```

### C. Example Integration: Twitter

```typescript
// src/lib/integrations/social/twitter.ts

import { BaseIntegration, IntegrationMetadata, NotificationPayload, NotificationAction, ActionResult } from '../base';
import { TwitterApi } from 'twitter-api-v2';

export class TwitterIntegration extends BaseIntegration {
  metadata: IntegrationMetadata = {
    id: 'twitter',
    name: 'Twitter / X',
    category: 'social_media',
    method: 'api',
    authMethod: 'oauth2',
    logo: '𝕏',
    color: '#1DA1F2',
    description: 'Twitter posts, mentions, DMs, trends',
    supportsNotifications: true,
    supportsActions: true,
    supportsWebhooks: true,
    supportsBidirectional: true,
    requiredScopes: ['tweet.read', 'tweet.write', 'users.read', 'dm.read', 'dm.write'],
    rateLimits: {
      requestsPerMinute: 15,
      requestsPerHour: 900
    },
    requiredTier: 'pro'
  };
  
  private client: TwitterApi | null = null;
  
  async initialize(credentials: { accessToken: string; accessSecret: string }): Promise<void> {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret
    });
  }
  
  async fetchNotifications(userId: string, since?: Date): Promise<NotificationPayload[]> {
    if (!this.client) throw new Error('Twitter client not initialized');
    
    const mentions = await this.client.v2.mentions(userId, {
      since_id: since ? await this.getLastTweetId(userId, since) : undefined
    });
    
    return mentions.data.map(tweet => ({
      id: tweet.id,
      integrationId: 'twitter',
      type: 'mention',
      title: `@${tweet.author_id} mentioned you`,
      body: tweet.text,
      data: { tweet },
      priority: 1,
      timestamp: new Date(tweet.created_at!),
      actions: [
        { id: 'reply', type: 'reply', label: 'Reply', icon: '↩️', risk: 'low' },
        { id: 'like', type: 'like', label: 'Like', icon: '❤️', risk: 'low' },
        { id: 'retweet', type: 'retweet', label: 'Retweet', icon: '🔁', risk: 'medium' }
      ]
    }));
  }
  
  async executeAction(userId: string, action: NotificationAction): Promise<ActionResult> {
    if (!this.client) throw new Error('Twitter client not initialized');
    
    switch (action.type) {
      case 'reply':
        const reply = await this.client.v2.reply(
          action.parameters.text,
          action.parameters.tweetId
        );
        return { success: true, data: reply };
      
      case 'like':
        await this.client.v2.like(userId, action.parameters.tweetId);
        return { success: true };
      
      case 'retweet':
        await this.client.v2.retweet(userId, action.parameters.tweetId);
        return { success: true };
      
      default:
        return { success: false, error: 'Unknown action type' };
    }
  }
  
  async handleWebhook(payload: any): Promise<NotificationPayload> {
    // Twitter webhook payload → NotificationPayload
    return {
      id: payload.tweet_create_events[0].id_str,
      integrationId: 'twitter',
      type: 'mention',
      title: `@${payload.tweet_create_events[0].user.screen_name} mentioned you`,
      body: payload.tweet_create_events[0].text,
      data: payload,
      priority: 1,
      timestamp: new Date()
    };
  }
  
  async verifyWebhookSignature(signature: string, payload: any): Promise<boolean> {
    const hmac = crypto.createHmac('sha256', process.env.TWITTER_WEBHOOK_SECRET!);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64');
    return signature === expectedSignature;
  }
}
```

---

## 🎉 FINAL WORD

**This is the most ambitious technical initiative we've ever undertaken.** 100+ integrations, 12 months, current team + 2 hires.

**It's achievable.** The architecture is solid. The team is talented. The market needs this.

**I'm all in.** Let's build the most connected AI assistant in the world.

**MO (CTO)**  
February 18, 2026

---

**Status:** ✅ **APPROVED - Ready for Implementation**

**Next Action:** CEO budget approval + JO priority confirmation → Start Week 1

