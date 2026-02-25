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
  AlgoliaConfig,
  AlgoliaSearchResult,
  AlgoliaIndex,
  DynamicYieldConfig,
  LivePersonConfig,
  AkeneoConfig,
  AkeneoProduct,
  SegmentConfig,
  SegmentEvent,
  HubSpotConfig,
  HubSpotContact,
  HubSpotDeal,
  SalesforceConfig,
  SalesforceRecord,
  CloudflareConfig,
  CloudflareZone,
  CloudflareWaitingRoom,
  SnykConfig,
  SnykVulnerability,
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

// API Clients (Layer 12 — Experience & Personalization)
export { AlgoliaClient } from './clients';

// API Clients (Layer 13 — Product & Data Platform)
export { AkeneoClient, SegmentClient } from './clients';

// API Clients (Layer 14 — Enterprise CRM & Sales)
export { HubSpotClient, SalesforceClient } from './clients';

// API Clients (Layer 15 — Trust & Security)
export { CloudflareClient, SnykClient } from './clients';
