// Printify integration types

export interface PrintifyConfig {
  apiToken: string;
  apiVersion?: string;
}

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: PrintifyProductOption[];
  variants: PrintifyVariant[];
  images: PrintifyImage[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: PrintifyPrintArea[];
  sales_channel_properties: unknown[];
}

export interface PrintifyProductOption {
  name: string;
  type: string;
  values: PrintifyOptionValue[];
}

export interface PrintifyOptionValue {
  id: number;
  title: string;
  colors?: string[];
}

export interface PrintifyVariant {
  id: number;
  sku: string;
  cost: number;
  price: number;
  title: string;
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  options: number[];
}

export interface PrintifyImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
}

export interface PrintifyPrintArea {
  variant_ids: number[];
  placeholders: PrintifyPlaceholder[];
}

export interface PrintifyPlaceholder {
  position: string;
  images: PrintifyPlaceholderImage[];
}

export interface PrintifyPlaceholderImage {
  id: string;
  name: string;
  type: string;
  height: number;
  width: number;
  x: number;
  y: number;
  scale: number;
  angle: number;
}

export interface PrintifyOrder {
  id: string;
  external_id: string;
  status: string;
  created_at: string;
  sent_to_production_at: string | null;
  fulfilled_at: string | null;
  line_items: PrintifyLineItem[];
  shipments: PrintifyShipment[];
  address_to: PrintifyAddress;
}

export interface PrintifyLineItem {
  product_id: string;
  quantity: number;
  variant_id: number;
  print_provider_id: number;
  cost: number;
  shipping_cost: number;
  status: string;
  metadata: {
    title: string;
    price: number;
    variant_label: string;
    sku: string;
    country: string;
  };
  sent_to_production_at: string | null;
  fulfilled_at: string | null;
}

export interface PrintifyShipment {
  carrier: string;
  number: string;
  url: string;
  delivered_at: string | null;
}

export interface PrintifyAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  address1: string;
  address2: string;
  city: string;
  zip: string;
}

export interface PrintifyBlueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

export interface PrintifyPrintProvider {
  id: number;
  title: string;
  location: {
    address1: string;
    address2: string;
    city: string;
    country: string;
    region: string;
    zip: string;
  };
}

export interface PrintifyWebhookPayload {
  id: string;
  type: string;
  created_at: string;
  resource: {
    id: string;
    type: string;
    data: unknown;
  };
}
