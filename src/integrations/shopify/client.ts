// Shopify API client wrapper

import type { ShopifyConfig, ShopifyProduct, ShopifyOrder } from './types';

/**
 * ShopifyClient: A simple wrapper around Shopify REST Admin API
 * for product and order management.
 */
export class ShopifyClient {
  private shopDomain: string;
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.shopDomain = config.shopDomain;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '2024-01';
    this.baseUrl = `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Shopify API error (${response.status}): ${errorText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get all products from the store
   */
  async getProducts(params?: {
    limit?: number;
    since_id?: string;
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
    published_at_min?: string;
    published_at_max?: string;
    published_status?: 'published' | 'unpublished' | 'any';
  }): Promise<ShopifyProduct[]> {
    const queryParams = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    const endpoint = `/products.json${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.request<{ products: ShopifyProduct[] }>(
      endpoint,
    );
    return response.products;
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<ShopifyProduct> {
    const response = await this.request<{ product: ShopifyProduct }>(
      `/products/${productId}.json`,
    );
    return response.product;
  }

  /**
   * Create a new product
   */
  async createProduct(
    product: Partial<ShopifyProduct>,
  ): Promise<ShopifyProduct> {
    const response = await this.request<{ product: ShopifyProduct }>(
      '/products.json',
      {
        method: 'POST',
        body: JSON.stringify({ product }),
      },
    );
    return response.product;
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: string,
    product: Partial<ShopifyProduct>,
  ): Promise<ShopifyProduct> {
    const response = await this.request<{ product: ShopifyProduct }>(
      `/products/${productId}.json`,
      {
        method: 'PUT',
        body: JSON.stringify({ product }),
      },
    );
    return response.product;
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.request(`/products/${productId}.json`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all orders from the store
   */
  async getOrders(params?: {
    limit?: number;
    since_id?: string;
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
    processed_at_min?: string;
    processed_at_max?: string;
    status?: 'open' | 'closed' | 'cancelled' | 'any';
    financial_status?:
      | 'pending'
      | 'authorized'
      | 'partially_paid'
      | 'paid'
      | 'partially_refunded'
      | 'refunded'
      | 'voided'
      | 'any';
    fulfillment_status?:
      | 'shipped'
      | 'partial'
      | 'unshipped'
      | 'unfulfilled'
      | 'any';
  }): Promise<ShopifyOrder[]> {
    const queryParams = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    const endpoint = `/orders.json${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.request<{ orders: ShopifyOrder[] }>(endpoint);
    return response.orders;
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: string): Promise<ShopifyOrder> {
    const response = await this.request<{ order: ShopifyOrder }>(
      `/orders/${orderId}.json`,
    );
    return response.order;
  }

  /**
   * Get shop information
   */
  async getShopInfo(): Promise<{
    id: string;
    name: string;
    email: string;
    domain: string;
    currency: string;
    timezone: string;
  }> {
    const response = await this.request<{
      shop: {
        id: string;
        name: string;
        email: string;
        domain: string;
        currency: string;
        timezone: string;
      };
    }>('/shop.json');
    return response.shop;
  }

  /**
   * Create a webhook subscription
   */
  async createWebhook(
    topic: string,
    address: string,
    format: 'json' | 'xml' = 'json',
  ): Promise<{ id: string; topic: string; address: string }> {
    const response = await this.request<{
      webhook: { id: string; topic: string; address: string };
    }>('/webhooks.json', {
      method: 'POST',
      body: JSON.stringify({
        webhook: { topic, address, format },
      }),
    });
    return response.webhook;
  }

  /**
   * List all webhook subscriptions
   */
  async listWebhooks(): Promise<
    Array<{ id: string; topic: string; address: string }>
  > {
    const response = await this.request<{
      webhooks: Array<{ id: string; topic: string; address: string }>;
    }>('/webhooks.json');
    return response.webhooks;
  }

  /**
   * Delete a webhook subscription
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request(`/webhooks/${webhookId}.json`, {
      method: 'DELETE',
    });
  }
}
