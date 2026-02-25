/**
 * Luxury Brand Commerce Stack — Public API
 *
 * Independent integration module for launching luxury brand websites.
 * NO dependency on emergent, supabase, or any CubiQo internal system.
 *
 * Usage:
 *   import { LUXURY_BRAND_STACK, PayPalClient, KlaviyoClient } from '@/integrations/luxury-brand';
 */

// Stack definition (11 layers, 30 integrations)
export { LUXURY_BRAND_STACK, getAllIntegrations, getLayerIntegrations, getTotalIntegrationCount, getAllRequiredEnvKeys } from './stack';

// Types
export type {
  LuxuryBrandIntegration,
  LuxuryBrandLayer,
  PayPalConfig,
  PayPalOrder,
  PayPalPurchaseUnit,
  AffirmConfig,
  AffirmCheckout,
  KlarnaConfig,
  KlarnaSession,
  ShipBobConfig,
  ShipBobOrder,
  ShipBobRecipient,
  ShipBobProduct,
  ShipBobShipment,
  ShipBobInventory,
  ShipHeroConfig,
  ShipHeroOrder,
  TripleWhaleConfig,
  TripleWhaleAttribution,
  HotjarConfig,
  KlaviyoConfig,
  KlaviyoProfile,
  KlaviyoEvent,
  KlaviyoFlow,
  GorgiasConfig,
  GorgiasTicket,
  GorgiasMessage,
  LoopReturnsConfig,
  LoopReturn,
  NotionConfig,
  NotionPage,
  FigmaConfig,
  FigmaFile,
  SlackConfig,
} from './types';

// API Clients (Layer 2 — Payments)
export { PayPalClient, AffirmClient, KlarnaClient } from './clients';

// API Clients (Layer 4 — Fulfillment)
export { ShipBobClient, ShipHeroClient } from './clients';

// API Clients (Layer 7 — Analytics)
export { TripleWhaleClient } from './clients';

// API Clients (Layer 8 — Marketing)
export { KlaviyoClient } from './clients';

// API Clients (Layer 9 — Customer Experience)
export { GorgiasClient, LoopReturnsClient } from './clients';

// API Clients (Layer 10 — Enterprise Control)
export { NotionClient, SlackClient, FigmaClient } from './clients';
