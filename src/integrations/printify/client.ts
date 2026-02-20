// Printify API client wrapper

import type {
  PrintifyConfig,
  PrintifyShop,
  PrintifyProduct,
  PrintifyOrder,
  PrintifyBlueprint,
  PrintifyPrintProvider,
} from './types';

/**
 * PrintifyClient: A wrapper around Printify REST API
 * for print-on-demand product and order management.
 */
export class PrintifyClient {
  private apiToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: PrintifyConfig) {
    this.apiToken = config.apiToken;
    this.apiVersion = config.apiVersion || 'v1';
    this.baseUrl = `https://api.printify.com/${this.apiVersion}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiToken}`,
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
        `Printify API error (${response.status}): ${errorText}`,
      );
    }

    // Handle empty responses (e.g., DELETE operations)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get all shops
   */
  async getShops(): Promise<PrintifyShop[]> {
    return this.request<PrintifyShop[]>('/shops.json');
  }

  /**
   * Get all products from a shop
   */
  async getProducts(shopId: number, page: number = 1, limit: number = 10): Promise<{
    current_page: number;
    data: PrintifyProduct[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  }> {
    return this.request(`/shops/${shopId}/products.json?page=${page}&limit=${limit}`);
  }

  /**
   * Get a single product by ID
   */
  async getProduct(shopId: number, productId: string): Promise<PrintifyProduct> {
    return this.request<PrintifyProduct>(
      `/shops/${shopId}/products/${productId}.json`,
    );
  }

  /**
   * Create a new product
   */
  async createProduct(
    shopId: number,
    product: Partial<PrintifyProduct>,
  ): Promise<PrintifyProduct> {
    return this.request<PrintifyProduct>(`/shops/${shopId}/products.json`, {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    shopId: number,
    productId: string,
    product: Partial<PrintifyProduct>,
  ): Promise<PrintifyProduct> {
    return this.request<PrintifyProduct>(
      `/shops/${shopId}/products/${productId}.json`,
      {
        method: 'PUT',
        body: JSON.stringify(product),
      },
    );
  }

  /**
   * Delete a product
   */
  async deleteProduct(shopId: number, productId: string): Promise<void> {
    await this.request(`/shops/${shopId}/products/${productId}.json`, {
      method: 'DELETE',
    });
  }

  /**
   * Publish a product to a sales channel
   */
  async publishProduct(
    shopId: number,
    productId: string,
    publish: boolean = true,
  ): Promise<void> {
    await this.request(
      `/shops/${shopId}/products/${productId}/publishing_succeeded.json`,
      {
        method: 'POST',
        body: JSON.stringify({ external: { id: productId, handle: productId } }),
      },
    );
  }

  /**
   * Get all orders from a shop
   */
  async getOrders(shopId: number, page: number = 1, limit: number = 10): Promise<{
    current_page: number;
    data: PrintifyOrder[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  }> {
    return this.request(`/shops/${shopId}/orders.json?page=${page}&limit=${limit}`);
  }

  /**
   * Get a single order by ID
   */
  async getOrder(shopId: number, orderId: string): Promise<PrintifyOrder> {
    return this.request<PrintifyOrder>(
      `/shops/${shopId}/orders/${orderId}.json`,
    );
  }

  /**
   * Create a new order
   */
  async createOrder(
    shopId: number,
    order: {
      external_id: string;
      line_items: Array<{
        product_id: string;
        variant_id: number;
        quantity: number;
      }>;
      shipping_method: number;
      send_shipping_notification: boolean;
      address_to: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        country: string;
        region: string;
        address1: string;
        address2?: string;
        city: string;
        zip: string;
      };
    },
  ): Promise<PrintifyOrder> {
    return this.request<PrintifyOrder>(`/shops/${shopId}/orders.json`, {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  /**
   * Submit an order for production
   */
  async submitOrder(shopId: number, orderId: string): Promise<void> {
    await this.request(`/shops/${shopId}/orders/${orderId}/send_to_production.json`, {
      method: 'POST',
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(shopId: number, orderId: string): Promise<void> {
    await this.request(`/shops/${shopId}/orders/${orderId}.json`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all available blueprints (product templates)
   */
  async getBlueprints(): Promise<PrintifyBlueprint[]> {
    return this.request<PrintifyBlueprint[]>('/catalog/blueprints.json');
  }

  /**
   * Get a single blueprint by ID
   */
  async getBlueprint(blueprintId: number): Promise<PrintifyBlueprint> {
    return this.request<PrintifyBlueprint>(
      `/catalog/blueprints/${blueprintId}.json`,
    );
  }

  /**
   * Get all print providers for a blueprint
   */
  async getPrintProviders(blueprintId: number): Promise<PrintifyPrintProvider[]> {
    return this.request<PrintifyPrintProvider[]>(
      `/catalog/blueprints/${blueprintId}/print_providers.json`,
    );
  }

  /**
   * Upload an image to Printify
   */
  async uploadImage(file: {
    file_name: string;
    contents: string; // Base64 encoded
  }): Promise<{ id: string; file_name: string; height: number; width: number; size: number; mime_type: string; preview_url: string; upload_time: string }> {
    return this.request<{
      id: string;
      file_name: string;
      height: number;
      width: number;
      size: number;
      mime_type: string;
      preview_url: string;
      upload_time: string;
    }>('/uploads/images.json', {
      method: 'POST',
      body: JSON.stringify(file),
    });
  }
}
