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
