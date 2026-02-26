/**
 * Luxury Brand Commerce Stack — API Clients
 *
 * Real REST API wrappers for luxury brand integrations.
 * Each client follows the same pattern as ShopifyClient and PrintifyClient:
 *   constructor(config) → private request<T>() → public typed methods
 *
 * NO dependency on emergent, supabase, or any CubiQo internal system.
 */

import type {
  PayPalConfig, PayPalOrder, PayPalPurchaseUnit,
  AffirmConfig, AffirmCheckout,
  KlarnaConfig, KlarnaSession,
  ShipBobConfig, ShipBobOrder, ShipBobInventory,
  ShipHeroConfig, ShipHeroOrder,
  TripleWhaleConfig, TripleWhaleAttribution,
  KlaviyoConfig, KlaviyoProfile, KlaviyoEvent, KlaviyoFlow,
  GorgiasConfig, GorgiasTicket,
  LoopReturnsConfig, LoopReturn,
  NotionConfig, NotionPage,
  FigmaConfig, FigmaFile,
  SlackConfig,
  AlgoliaConfig, AlgoliaSearchResult,
  AkeneoConfig, AkeneoProduct,
  SegmentConfig,
  HubSpotConfig, HubSpotContact, HubSpotDeal,
  SalesforceConfig, SalesforceRecord,
  CloudflareConfig, CloudflareZone, CloudflareWaitingRoom,
  SnykConfig, SnykVulnerability,
} from './types';

// =============================================================================
// LAYER 2 — PAYMENTS
// =============================================================================

/**
 * PayPal REST API v2 Client
 * Docs: https://developer.paypal.com/api/rest/
 */
export class PayPalClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;

  constructor(config: PayPalConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = config.sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`PayPal auth error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken!;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.authenticate();
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`PayPal API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async createOrder(purchaseUnits: PayPalPurchaseUnit[], intent: 'CAPTURE' | 'AUTHORIZE' = 'CAPTURE'): Promise<PayPalOrder> {
    return this.request<PayPalOrder>('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({ intent, purchase_units: purchaseUnits }),
    });
  }

  async captureOrder(orderId: string): Promise<PayPalOrder> {
    return this.request<PayPalOrder>(`/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
    });
  }

  async getOrder(orderId: string): Promise<PayPalOrder> {
    return this.request<PayPalOrder>(`/v2/checkout/orders/${orderId}`);
  }
}

/**
 * Affirm Checkout API Client
 * Docs: https://docs.affirm.com/
 */
export class AffirmClient {
  private baseUrl: string;
  private publicKey: string;
  private privateKey: string;

  constructor(config: AffirmConfig) {
    this.publicKey = config.publicKey;
    this.privateKey = config.privateKey;
    this.baseUrl = config.sandbox
      ? 'https://sandbox.affirm.com/api/v1'
      : 'https://api.affirm.com/api/v1';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${btoa(`${this.publicKey}:${this.privateKey}`)}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Affirm API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async authorizeCheckout(checkoutToken: string): Promise<AffirmCheckout> {
    return this.request<AffirmCheckout>('/charges', {
      method: 'POST',
      body: JSON.stringify({ checkout_token: checkoutToken }),
    });
  }

  async captureCharge(chargeId: string): Promise<AffirmCheckout> {
    return this.request<AffirmCheckout>(`/charges/${chargeId}/capture`, {
      method: 'POST',
    });
  }

  async voidCharge(chargeId: string): Promise<AffirmCheckout> {
    return this.request<AffirmCheckout>(`/charges/${chargeId}/void`, {
      method: 'POST',
    });
  }
}

/**
 * Klarna Payments API Client
 * Docs: https://docs.klarna.com/api/
 */
export class KlarnaClient {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(config: KlarnaConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    const regionMap = { eu: 'https://api.klarna.com', na: 'https://api-na.klarna.com', oc: 'https://api-oc.klarna.com' };
    this.baseUrl = regionMap[config.region];
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Klarna API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async createSession(orderData: {
    purchase_country: string;
    purchase_currency: string;
    locale: string;
    order_amount: number;
    order_lines: Array<{ name: string; quantity: number; unit_price: number; total_amount: number }>;
  }): Promise<KlarnaSession> {
    return this.request<KlarnaSession>('/payments/v1/sessions', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async createOrder(authorizationToken: string, orderData: Record<string, unknown>): Promise<{ order_id: string; redirect_url: string }> {
    return this.request(`/payments/v1/authorizations/${authorizationToken}/order`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }
}

// =============================================================================
// LAYER 4 — FULFILLMENT
// =============================================================================

/**
 * ShipBob REST API Client
 * Docs: https://developer.shipbob.com/
 */
export class ShipBobClient {
  private baseUrl = 'https://api.shipbob.com/1.0';
  private apiKey: string;
  private channelId: string;

  constructor(config: ShipBobConfig) {
    this.apiKey = config.apiKey;
    this.channelId = config.channelId || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (this.channelId) headers['shipbob_channel_id'] = this.channelId;

    const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });

    if (!response.ok) {
      throw new Error(`ShipBob API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async createOrder(order: {
    reference_id: string;
    shipping_method: string;
    recipient: { name: string; address: { address1: string; city: string; state: string; country: string; zip_code: string }; email: string };
    products: Array<{ reference_id: string; quantity: number }>;
  }): Promise<ShipBobOrder> {
    return this.request<ShipBobOrder>('/order', { method: 'POST', body: JSON.stringify(order) });
  }

  async getOrder(orderId: number): Promise<ShipBobOrder> {
    return this.request<ShipBobOrder>(`/order/${orderId}`);
  }

  async getInventory(params?: { page?: number; limit?: number }): Promise<ShipBobInventory[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<ShipBobInventory[]>(`/inventory${query ? `?${query}` : ''}`);
  }

  async getProducts(): Promise<Array<{ id: number; name: string; sku: string }>> {
    return this.request('/product');
  }
}

/**
 * ShipHero GraphQL API Client
 * Docs: https://developer.shiphero.com/
 */
export class ShipHeroClient {
  private baseUrl = 'https://public-api.shiphero.com/graphql';
  private apiKey: string;

  constructor(config: ShipHeroConfig) {
    this.apiKey = config.apiKey;
  }

  private async query<T>(gql: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: gql, variables }),
    });

    if (!response.ok) {
      throw new Error(`ShipHero API error (${response.status}): ${await response.text()}`);
    }

    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(`ShipHero GraphQL error: ${json.errors[0].message}`);
    }

    return json.data as T;
  }

  async getOrders(params?: { order_number?: string }): Promise<{ orders: { data: ShipHeroOrder[] } }> {
    return this.query(`query($orderNumber: String) {
      orders(order_number: $orderNumber) { data { id order_number status fulfillment_status } }
    }`, { orderNumber: params?.order_number });
  }

  async getInventory(sku: string): Promise<{ inventory: { data: Array<{ sku: string; on_hand: number; available: number; warehouse: string }> } }> {
    return this.query(`query($sku: String!) {
      inventory(sku: $sku) { data { sku on_hand available warehouse } }
    }`, { sku });
  }
}

// =============================================================================
// LAYER 7 — ANALYTICS
// =============================================================================

/**
 * Triple Whale API Client
 * Docs: https://developers.triplewhale.com/
 */
export class TripleWhaleClient {
  private baseUrl = 'https://api.triplewhale.com/api/v2';
  private apiKey: string;

  constructor(config: TripleWhaleConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Triple Whale API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async getAttribution(dateRange: { start: string; end: string }): Promise<TripleWhaleAttribution> {
    return this.request<TripleWhaleAttribution>('/attribution/get', {
      method: 'POST',
      body: JSON.stringify({ start_date: dateRange.start, end_date: dateRange.end }),
    });
  }

  async getSummary(): Promise<Record<string, unknown>> {
    return this.request('/summary/get-summary');
  }
}

// =============================================================================
// LAYER 8 — MARKETING
// =============================================================================

/**
 * Klaviyo API v2 Client
 * Docs: https://developers.klaviyo.com/
 */
export class KlaviyoClient {
  private baseUrl = 'https://a.klaviyo.com/api';
  private apiKey: string;

  constructor(config: KlaviyoConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Klaviyo-API-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
        revision: '2024-02-15',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Klaviyo API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async getProfiles(params?: { filter?: string }): Promise<{ data: KlaviyoProfile[] }> {
    const query = params?.filter ? `?filter=${encodeURIComponent(params.filter)}` : '';
    return this.request(`/profiles${query}`);
  }

  async createProfile(profile: Partial<KlaviyoProfile>): Promise<{ data: KlaviyoProfile }> {
    return this.request('/profiles', {
      method: 'POST',
      body: JSON.stringify({ data: { type: 'profile', attributes: profile } }),
    });
  }

  async trackEvent(event: KlaviyoEvent): Promise<void> {
    await this.request('/events', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            metric: { data: { type: 'metric', attributes: { name: event.event } } },
            profile: { data: { type: 'profile', attributes: event.customer_properties } },
            properties: event.properties,
            time: event.time || new Date().toISOString(),
          },
        },
      }),
    });
  }

  async getFlows(): Promise<{ data: KlaviyoFlow[] }> {
    return this.request('/flows');
  }

  async getLists(): Promise<{ data: Array<{ id: string; attributes: { name: string; created: string } }> }> {
    return this.request('/lists');
  }

  async addToList(listId: string, emails: string[]): Promise<void> {
    await this.request(`/lists/${listId}/relationships/profiles`, {
      method: 'POST',
      body: JSON.stringify({
        data: emails.map(email => ({ type: 'profile', attributes: { email } })),
      }),
    });
  }
}

// =============================================================================
// LAYER 9 — CUSTOMER EXPERIENCE
// =============================================================================

/**
 * Gorgias REST API Client
 * Docs: https://developers.gorgias.com/
 */
export class GorgiasClient {
  private baseUrl: string;
  private apiKey: string;
  private email: string;

  constructor(config: GorgiasConfig) {
    this.baseUrl = `https://${config.domain}.gorgias.com/api`;
    this.apiKey = config.apiKey;
    this.email = config.email;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${btoa(`${this.email}:${this.apiKey}`)}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Gorgias API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async getTickets(params?: { status?: string; limit?: number }): Promise<{ data: GorgiasTicket[] }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/tickets${query ? `?${query}` : ''}`);
  }

  async getTicket(ticketId: number): Promise<GorgiasTicket> {
    return this.request<GorgiasTicket>(`/tickets/${ticketId}`);
  }

  async createTicket(ticket: { subject: string; messages: Array<{ body_text: string; via: string; from: { email: string } }> }): Promise<GorgiasTicket> {
    return this.request<GorgiasTicket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  async replyToTicket(ticketId: number, message: { body_text: string }): Promise<void> {
    await this.request(`/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ ...message, via: 'api' }),
    });
  }
}

/**
 * Loop Returns API Client
 * Docs: https://docs.loopreturns.com/
 */
export class LoopReturnsClient {
  private baseUrl = 'https://api.loopreturns.com/api/v1';
  private apiKey: string;

  constructor(config: LoopReturnsConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Authorization': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Loop Returns API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async getReturns(params?: { status?: string; page?: number }): Promise<{ data: LoopReturn[] }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/returns${query ? `?${query}` : ''}`);
  }

  async getReturn(returnId: string): Promise<LoopReturn> {
    return this.request<LoopReturn>(`/returns/${returnId}`);
  }

  async getAnalytics(): Promise<{
    total_returns: number;
    return_rate: number;
    exchange_rate: number;
    top_reasons: string[];
    retained_revenue_percent: number;
  }> {
    return this.request('/analytics/summary');
  }
}

// =============================================================================
// LAYER 10 — ENTERPRISE CONTROL
// =============================================================================

/**
 * Notion API Client
 * Docs: https://developers.notion.com/
 */
export class NotionClient {
  private baseUrl = 'https://api.notion.com/v1';
  private apiKey: string;

  constructor(config: NotionConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Notion API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async getPage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>(`/pages/${pageId}`);
  }

  async createPage(parentId: string, properties: Record<string, unknown>): Promise<NotionPage> {
    return this.request<NotionPage>('/pages', {
      method: 'POST',
      body: JSON.stringify({ parent: { database_id: parentId }, properties }),
    });
  }

  async queryDatabase(databaseId: string, filter?: Record<string, unknown>): Promise<{ results: NotionPage[] }> {
    return this.request(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({ filter }),
    });
  }
}

/**
 * Slack Web API Client
 * Docs: https://api.slack.com/methods
 */
export class SlackClient {
  private baseUrl = 'https://slack.com/api';
  private botToken: string;

  constructor(config: SlackConfig) {
    this.botToken = config.botToken;
  }

  private async request<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/${method}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.botToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Slack API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data as T;
  }

  async postMessage(channel: string, text: string, blocks?: unknown[]): Promise<{ ts: string; channel: string }> {
    return this.request('chat.postMessage', { channel, text, blocks });
  }

  async getChannels(): Promise<{ channels: Array<{ id: string; name: string }> }> {
    return this.request('conversations.list', { types: 'public_channel,private_channel' });
  }
}

/**
 * Figma REST API Client
 * Docs: https://www.figma.com/developers/api
 */
export class FigmaClient {
  private baseUrl = 'https://api.figma.com/v1';
  private accessToken: string;

  constructor(config: FigmaConfig) {
    this.accessToken = config.accessToken;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: { 'X-Figma-Token': this.accessToken },
    });

    if (!response.ok) {
      throw new Error(`Figma API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async getFile(fileKey: string): Promise<FigmaFile & { document: unknown }> {
    return this.request(`/files/${fileKey}`);
  }

  async getFileComponents(fileKey: string): Promise<{ meta: { components: Array<{ key: string; name: string; description: string }> } }> {
    return this.request(`/files/${fileKey}/components`);
  }

  async getTeamProjects(teamId: string): Promise<{ projects: Array<{ id: string; name: string }> }> {
    return this.request(`/teams/${teamId}/projects`);
  }
}

// =============================================================================
// LAYER 12 — EXPERIENCE & PERSONALIZATION
// =============================================================================

/**
 * Algolia Search API Client
 * Docs: https://www.algolia.com/doc/api-reference/
 */
export class AlgoliaClient {
  private appId: string;
  private apiKey: string;
  private defaultIndex: string;

  constructor(config: AlgoliaConfig) {
    this.appId = config.appId;
    this.apiKey = config.apiKey;
    this.defaultIndex = config.indexName || 'products';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `https://${this.appId}-dsn.algolia.net${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Algolia-Application-Id': this.appId,
        'X-Algolia-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Algolia API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async search(query: string, params?: { hitsPerPage?: number; page?: number; filters?: string }): Promise<AlgoliaSearchResult> {
    return this.request<AlgoliaSearchResult>(`/1/indexes/${this.defaultIndex}/query`, {
      method: 'POST',
      body: JSON.stringify({ query, ...params }),
    });
  }

  async indexObjects(objects: Array<{ objectID: string; [key: string]: unknown }>): Promise<{ taskID: number; objectIDs: string[] }> {
    return this.request(`/1/indexes/${this.defaultIndex}/batch`, {
      method: 'POST',
      body: JSON.stringify({ requests: objects.map(obj => ({ action: 'addObject', body: obj })) }),
    });
  }

  async deleteObject(objectID: string): Promise<{ taskID: number }> {
    return this.request(`/1/indexes/${this.defaultIndex}/${objectID}`, { method: 'DELETE' });
  }

  async getSettings(): Promise<Record<string, unknown>> {
    return this.request(`/1/indexes/${this.defaultIndex}/settings`);
  }
}

// =============================================================================
// LAYER 13 — PRODUCT & DATA PLATFORM
// =============================================================================

/**
 * Akeneo PIM API Client
 * Docs: https://api.akeneo.com/
 */
export class AkeneoClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private username: string;
  private password: string;
  private accessToken: string | null = null;

  constructor(config: AkeneoConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.username = config.username;
    this.password = config.password;
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const response = await fetch(`${this.baseUrl}/api/oauth/v1/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'password', username: this.username, password: this.password }),
    });

    if (!response.ok) {
      throw new Error(`Akeneo auth error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken!;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.authenticate();
    const url = `${this.baseUrl}/api/rest/v1${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Akeneo API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async getProducts(params?: { limit?: number; page?: number }): Promise<{ _embedded: { items: AkeneoProduct[] } }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(identifier: string): Promise<AkeneoProduct> {
    return this.request<AkeneoProduct>(`/products/${identifier}`);
  }

  async createProduct(product: Partial<AkeneoProduct>): Promise<void> {
    await this.request('/products', { method: 'POST', body: JSON.stringify(product) });
  }

  async getFamilies(): Promise<{ _embedded: { items: Array<{ code: string; labels: Record<string, string> }> } }> {
    return this.request('/families');
  }
}

/**
 * Segment Analytics API Client (Track API)
 * Docs: https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/
 */
export class SegmentClient {
  private writeKey: string;
  private baseUrl = 'https://api.segment.io/v1';

  constructor(config: SegmentConfig) {
    this.writeKey = config.writeKey;
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${this.writeKey}:`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Segment API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async identify(userId: string, traits: Record<string, unknown>): Promise<{ success: boolean }> {
    return this.request('/identify', { userId, traits });
  }

  async track(userId: string, event: string, properties: Record<string, unknown>): Promise<{ success: boolean }> {
    return this.request('/track', { userId, event, properties });
  }

  async page(userId: string, name: string, properties?: Record<string, unknown>): Promise<{ success: boolean }> {
    return this.request('/page', { userId, name, properties });
  }
}

// =============================================================================
// LAYER 14 — ENTERPRISE CRM & SALES
// =============================================================================

/**
 * HubSpot CRM API v3 Client
 * Docs: https://developers.hubspot.com/docs/api
 */
export class HubSpotClient {
  private baseUrl = 'https://api.hubapi.com';
  private accessToken: string;

  constructor(config: HubSpotConfig) {
    this.accessToken = config.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HubSpot API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async getContacts(params?: { limit?: number; after?: string }): Promise<{ results: HubSpotContact[]; paging?: { next: { after: string } } }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/crm/v3/objects/contacts${query ? `?${query}` : ''}`);
  }

  async createContact(properties: Record<string, string>): Promise<HubSpotContact> {
    return this.request<HubSpotContact>('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }

  async getDeals(params?: { limit?: number }): Promise<{ results: HubSpotDeal[] }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/crm/v3/objects/deals${query ? `?${query}` : ''}`);
  }

  async createDeal(properties: Record<string, string>): Promise<HubSpotDeal> {
    return this.request<HubSpotDeal>('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }
}

/**
 * Salesforce REST API Client
 * Docs: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta
 */
export class SalesforceClient {
  private instanceUrl: string;
  private accessToken: string;

  constructor(config: SalesforceConfig) {
    this.instanceUrl = config.instanceUrl.replace(/\/$/, '');
    this.accessToken = config.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.instanceUrl}/services/data/v59.0${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async query(soql: string): Promise<{ totalSize: number; done: boolean; records: SalesforceRecord[] }> {
    return this.request(`/query?q=${encodeURIComponent(soql)}`);
  }

  async getRecord(sobjectType: string, id: string): Promise<SalesforceRecord> {
    return this.request<SalesforceRecord>(`/sobjects/${sobjectType}/${id}`);
  }

  async createRecord(sobjectType: string, data: Record<string, unknown>): Promise<{ id: string; success: boolean }> {
    return this.request(`/sobjects/${sobjectType}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// =============================================================================
// LAYER 15 — TRUST & SECURITY
// =============================================================================

/**
 * Cloudflare API v4 Client
 * Docs: https://developers.cloudflare.com/api/
 */
export class CloudflareClient {
  private baseUrl = 'https://api.cloudflare.com/client/v4';
  private apiToken: string;
  private zoneId: string;

  constructor(config: CloudflareConfig) {
    this.apiToken = config.apiToken;
    this.zoneId = config.zoneId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Cloudflare API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    return data.result as T;
  }

  async getZone(): Promise<CloudflareZone> {
    return this.request<CloudflareZone>(`/zones/${this.zoneId}`);
  }

  async getWaitingRooms(): Promise<CloudflareWaitingRoom[]> {
    return this.request<CloudflareWaitingRoom[]>(`/zones/${this.zoneId}/waiting_rooms`);
  }

  async createWaitingRoom(config: {
    name: string;
    host: string;
    path: string;
    new_users_per_minute: number;
    total_active_users: number;
    session_duration: number;
  }): Promise<CloudflareWaitingRoom> {
    return this.request<CloudflareWaitingRoom>(`/zones/${this.zoneId}/waiting_rooms`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async purgeCache(files?: string[]): Promise<{ id: string }> {
    const body = files ? { files } : { purge_everything: true };
    return this.request(`/zones/${this.zoneId}/purge_cache`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

/**
 * Snyk REST API Client
 * Docs: https://snyk.docs.apiary.io/
 */
export class SnykClient {
  private baseUrl = 'https://api.snyk.io/v1';
  private apiToken: string;
  private orgId: string;

  constructor(config: SnykConfig) {
    this.apiToken = config.apiToken;
    this.orgId = config.orgId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `token ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Snyk API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async getProjects(): Promise<{ projects: Array<{ id: string; name: string; type: string; issueCountsBySeverity: Record<string, number> }> }> {
    return this.request(`/org/${this.orgId}/projects`);
  }

  async getVulnerabilities(projectId: string): Promise<{ issues: { vulnerabilities: SnykVulnerability[] } }> {
    return this.request(`/org/${this.orgId}/project/${projectId}/aggregated-issues`, {
      method: 'POST',
      body: JSON.stringify({ filters: {} }),
    });
  }

  async testPackage(packageName: string, version: string): Promise<{ ok: boolean; issues: { vulnerabilities: SnykVulnerability[] } }> {
    return this.request(`/test/npm/${packageName}/${version}`);
  }
}
