// Founders Pass: Feature flag types

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  flag_type: 'boolean' | 'percentage' | 'variant';
  default_value: boolean;
  rollout_rules: RolloutRules;
  required_scopes: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RolloutRules {
  percentage?: number;
  allowlist?: string[];
  blocklist?: string[];
  environments?: string[];
}

export interface FlagOverride {
  id: string;
  flag_id: string;
  site_id: string | null;
  user_id: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  description: string | null;
  config: SiteConfig;
  status: 'active' | 'inactive' | 'preview';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteConfig {
  hero?: { title: string; subtitle: string; image?: string };
  seo?: { title: string; description: string; keywords?: string[] };
  theme?: { primary: string; secondary: string };
  products?: ProductConfig[];
}

export interface ProductConfig {
  name: string;
  price: number;
  currency: string;
  image?: string;
  description?: string;
}

export interface ActionTemplate {
  id: string;
  name: string;
  key: string;
  description: string | null;
  provider: string;
  required_scopes: string[];
  ui_schema: ActionUISchema;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionUISchema {
  title?: string;
  fields?: ActionField[];
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface ActionField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'hidden';
  placeholder?: string;
  options?: string[];
}

export interface OAuthToken {
  id: string;
  user_id: string;
  provider: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_type: string;
  scopes: string[];
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface FeatureEvent {
  id: string;
  site_id: string | null;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface IntegrationConfig {
  id: string;
  site_id: string;
  provider: string;
  client_id: string | null;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type OAuthProvider = 'gmail' | 'shopify' | 'printify' | 'printful' | 'stripe' | 'uber';

export interface OAuthProviderConfig {
  provider: OAuthProvider;
  name: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  icon: string;
}

export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  gmail: {
    provider: 'gmail',
    name: 'Gmail',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    icon: 'Mail',
  },
  shopify: {
    provider: 'shopify',
    name: 'Shopify',
    scopes: ['read_products', 'write_products', 'read_orders'],
    authUrl: '', // per-store
    tokenUrl: '',
    icon: 'ShoppingBag',
  },
  printify: {
    provider: 'printify',
    name: 'Printify',
    scopes: ['shops.read', 'products.read', 'orders.read'],
    authUrl: 'https://api.printify.com/v1/authorize',
    tokenUrl: 'https://api.printify.com/v1/token',
    icon: 'Printer',
  },
  printful: {
    provider: 'printful',
    name: 'Printful',
    scopes: ['read', 'write'],
    authUrl: 'https://www.printful.com/oauth/authorize',
    tokenUrl: 'https://www.printful.com/oauth/token',
    icon: 'Package',
  },
  stripe: {
    provider: 'stripe',
    name: 'Stripe',
    scopes: ['read_write'],
    authUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    icon: 'CreditCard',
  },
  uber: {
    provider: 'uber',
    name: 'Uber',
    scopes: ['profile', 'ride_request'],
    authUrl: 'https://login.uber.com/oauth/v2/authorize',
    tokenUrl: 'https://login.uber.com/oauth/v2/token',
    icon: 'Car',
  },
};

export type EventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'action_requested'
  | 'action_confirmed'
  | 'flag_toggled'
  | 'oauth_connected'
  | 'oauth_revoked';
