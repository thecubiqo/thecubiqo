/**
 * Luxury Brand Commerce Stack — Type Definitions
 * Independent integration types for the 11-layer luxury brand stack.
 * NO dependency on emergent or any other CubiQo internal system.
 */

// =============================================================================
// STACK STRUCTURE TYPES
// =============================================================================

export interface LuxuryBrandIntegration {
  name: string;
  icon: string;
  status: 'ready' | 'pending' | 'premium';
  description: string;
  docsUrl?: string;
  envKeys?: string[];
}

export interface LuxuryBrandLayer {
  id: string;
  layer: number;
  name: string;
  icon: string;
  description: string;
  integrations: LuxuryBrandIntegration[];
}

// =============================================================================
// LAYER 2 — PAYMENT TYPES
// =============================================================================

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  sandbox?: boolean;
}

export interface PayPalOrder {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: PayPalPurchaseUnit[];
  create_time: string;
  update_time: string;
}

export interface PayPalPurchaseUnit {
  reference_id: string;
  amount: { currency_code: string; value: string };
  description?: string;
  shipping?: {
    name: { full_name: string };
    address: { address_line_1: string; admin_area_2: string; postal_code: string; country_code: string };
  };
}

export interface AffirmConfig {
  publicKey: string;
  privateKey: string;
  sandbox?: boolean;
}

export interface AffirmCheckout {
  checkout_token: string;
  status: 'created' | 'confirmed' | 'captured' | 'voided';
  amount: number;
  currency: string;
  financing: {
    apr: number;
    term_months: number;
    monthly_payment: number;
  };
}

export interface KlarnaConfig {
  apiKey: string;
  apiSecret: string;
  region: 'eu' | 'na' | 'oc';
}

export interface KlarnaSession {
  session_id: string;
  client_token: string;
  payment_method_categories: Array<{
    identifier: string;
    name: string;
    asset_urls: { descriptive: string; standard: string };
  }>;
}

// =============================================================================
// LAYER 4 — FULFILLMENT TYPES
// =============================================================================

export interface ShipBobConfig {
  apiKey: string;
  channelId?: string;
}

export interface ShipBobOrder {
  id: number;
  reference_id: string;
  status: 'Processing' | 'Completed' | 'Cancelled' | 'Exception';
  shipping_method: string;
  recipient: ShipBobRecipient;
  products: ShipBobProduct[];
  created_date: string;
  shipments: ShipBobShipment[];
}

export interface ShipBobRecipient {
  name: string;
  address: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
  };
  email: string;
  phone_number?: string;
}

export interface ShipBobProduct {
  id: number;
  reference_id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
}

export interface ShipBobShipment {
  id: number;
  tracking: { tracking_number: string; carrier: string; tracking_url: string };
  status: string;
  created_date: string;
  estimated_delivery: string;
}

export interface ShipBobInventory {
  id: number;
  name: string;
  sku: string;
  total_fulfillable_quantity: number;
  total_onhand_quantity: number;
  total_committed_quantity: number;
  fulfillable_quantity_by_fulfillment_center: Array<{
    id: number;
    name: string;
    quantity: number;
  }>;
}

export interface ShipHeroConfig {
  apiKey: string;
}

export interface ShipHeroOrder {
  id: string;
  order_number: string;
  status: string;
  fulfillment_status: string;
  line_items: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: string;
  }>;
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  tracking_number?: string;
  carrier?: string;
}

// =============================================================================
// LAYER 7 — ANALYTICS TYPES
// =============================================================================

export interface TripleWhaleConfig {
  apiKey: string;
  shopDomain: string;
}

export interface TripleWhaleAttribution {
  total_revenue: number;
  total_ad_spend: number;
  roas: number;
  net_profit: number;
  channels: Record<string, {
    revenue: number;
    spend: number;
    roas: number;
    orders: number;
  }>;
  date_range: { start: string; end: string };
}

export interface HotjarConfig {
  siteId: string;
  personalAccessToken?: string;
}

// =============================================================================
// LAYER 8 — MARKETING TYPES
// =============================================================================

export interface KlaviyoConfig {
  apiKey: string;
}

export interface KlaviyoProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  properties?: Record<string, unknown>;
}

export interface KlaviyoEvent {
  event: string;
  customer_properties: { email: string; [key: string]: unknown };
  properties: Record<string, unknown>;
  time?: string;
}

export interface KlaviyoFlow {
  id: string;
  name: string;
  status: 'live' | 'draft' | 'manual';
  trigger_type: string;
  created: string;
  updated: string;
}

// =============================================================================
// LAYER 9 — CUSTOMER EXPERIENCE TYPES
// =============================================================================

export interface GorgiasConfig {
  domain: string;
  apiKey: string;
  email: string;
}

export interface GorgiasTicket {
  id: number;
  subject: string;
  status: 'open' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channel: string;
  via: string;
  customer: { id: number; email: string; name: string };
  messages: GorgiasMessage[];
  created_datetime: string;
  updated_datetime: string;
  tags: Array<{ id: number; name: string }>;
}

export interface GorgiasMessage {
  id: number;
  body_text: string;
  body_html: string;
  sender: { email: string; name: string };
  source: { type: string };
  created_datetime: string;
}

export interface LoopReturnsConfig {
  apiKey: string;
  shopDomain: string;
}

export interface LoopReturn {
  id: string;
  order_id: string;
  status: 'pending' | 'approved' | 'shipped' | 'received' | 'completed' | 'rejected';
  return_type: 'refund' | 'exchange' | 'store_credit';
  line_items: Array<{
    id: string;
    sku: string;
    title: string;
    quantity: number;
    reason: string;
  }>;
  shipping_label_url?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// LAYER 10 — ENTERPRISE CONTROL TYPES
// =============================================================================

export interface NotionConfig {
  apiKey: string;
}

export interface NotionPage {
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
}

export interface FigmaConfig {
  accessToken: string;
}

export interface FigmaFile {
  key: string;
  name: string;
  last_modified: string;
  thumbnail_url: string;
  version: string;
}

export interface SlackConfig {
  botToken: string;
  channelId?: string;
}
