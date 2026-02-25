/**
 * Luxury Brand Commerce Stack — 11-Layer Definition
 *
 * Pure data definition of the enterprise commerce infrastructure.
 * NO dependency on emergent, supabase, or any CubiQo internal system.
 *
 * Each layer maps to real API clients in ./clients.ts and
 * typed interfaces in ./types.ts
 */

import type { LuxuryBrandLayer } from './types';

// =============================================================================
// THE 11-LAYER LUXURY BRAND STACK
// =============================================================================

export const LUXURY_BRAND_STACK: LuxuryBrandLayer[] = [
  {
    id: 'commerce-core',
    layer: 1,
    name: 'Commerce Core',
    icon: '🛒',
    description: 'Enterprise backbone — storefront, checkout, international scaling',
    integrations: [
      {
        name: 'Shopify Plus',
        icon: '🛍️',
        status: 'ready',
        description: 'Script editor, higher API limits, launch control, international scaling',
        docsUrl: 'https://shopify.dev/docs/api',
        envKeys: ['SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_ACCESS_TOKEN'],
      },
      {
        name: 'Shopify Advanced',
        icon: '🛍️',
        status: 'ready',
        description: 'Budget-friendly enterprise alternative',
        docsUrl: 'https://shopify.dev/docs/api',
        envKeys: ['SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_ACCESS_TOKEN'],
      },
    ],
  },
  {
    id: 'payments',
    layer: 2,
    name: 'Payments',
    icon: '💳',
    description: 'Global + luxury-ready payment processing',
    integrations: [
      {
        name: 'Shopify Payments',
        icon: '💳',
        status: 'ready',
        description: 'Primary integrated gateway — zero setup with Shopify',
      },
      {
        name: 'Stripe',
        icon: '💳',
        status: 'ready',
        description: 'Subscriptions, custom flows, flexibility',
        docsUrl: 'https://stripe.com/docs/api',
        envKeys: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
      },
      {
        name: 'PayPal',
        icon: '🅿️',
        status: 'ready',
        description: 'Trust factor for luxury buyers',
        docsUrl: 'https://developer.paypal.com/api/rest/',
        envKeys: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
      },
      {
        name: 'Affirm',
        icon: '💰',
        status: 'ready',
        description: 'Luxury price justification — buy now, pay later',
        docsUrl: 'https://docs.affirm.com/',
        envKeys: ['AFFIRM_PUBLIC_KEY', 'AFFIRM_PRIVATE_KEY'],
      },
      {
        name: 'Klarna',
        icon: '💎',
        status: 'ready',
        description: 'EU-heavy market BNPL — pay later, pay in 3, financing',
        docsUrl: 'https://docs.klarna.com/',
        envKeys: ['KLARNA_API_KEY', 'KLARNA_API_SECRET'],
      },
    ],
  },
  {
    id: 'apparel-production',
    layer: 3,
    name: 'Apparel Production',
    icon: '👕',
    description: 'Hybrid model — POD scalable + premium blanks',
    integrations: [
      {
        name: 'Printful',
        icon: '🖨️',
        status: 'ready',
        description: 'Embroidery, DTG, fulfillment — low risk, scalable',
        docsUrl: 'https://developers.printful.com/',
        envKeys: ['PRINTFUL_API_KEY'],
      },
      {
        name: 'Apliiq',
        icon: '🏷️',
        status: 'ready',
        description: 'Private woven labels, custom branding, real luxury feel',
        docsUrl: 'https://www.apliiq.com/',
        envKeys: ['APLIIQ_API_KEY'],
      },
      {
        name: 'Los Angeles Apparel',
        icon: '👔',
        status: 'ready',
        description: 'Heavyweight luxury cotton blanks — premium base garments',
      },
    ],
  },
  {
    id: 'fulfillment',
    layer: 4,
    name: 'Fulfillment',
    icon: '📦',
    description: 'Scaling beyond POD — warehouse and inventory control',
    integrations: [
      {
        name: 'ShipBob',
        icon: '📦',
        status: 'ready',
        description: 'US warehouses, fast scaling, 2-day shipping',
        docsUrl: 'https://developer.shipbob.com/',
        envKeys: ['SHIPBOB_API_KEY'],
      },
      {
        name: 'ShipHero',
        icon: '🏭',
        status: 'ready',
        description: 'Inventory control, WMS, multi-warehouse',
        docsUrl: 'https://developer.shiphero.com/',
        envKeys: ['SHIPHERO_API_KEY'],
      },
    ],
  },
  {
    id: 'accessories',
    layer: 5,
    name: 'Accessories',
    icon: '👜',
    description: 'Leather goods, wallets, belts — factory relationships',
    integrations: [
      {
        name: 'Makers Row',
        icon: '🇺🇸',
        status: 'ready',
        description: 'US-based factories for leather goods and accessories',
        docsUrl: 'https://makersrow.com/',
      },
      {
        name: 'Alibaba Group',
        icon: '🌏',
        status: 'ready',
        description: 'Careful sourcing for wallets, belts — custom molds and packaging',
      },
    ],
  },
  {
    id: 'fragrance-grooming',
    layer: 6,
    name: 'Fragrance & Grooming',
    icon: '🧴',
    description: 'Fragrance is margin multiplier — private label production',
    integrations: [
      {
        name: 'Onoxa',
        icon: '🧴',
        status: 'ready',
        description: 'Private label cologne — low MOQ, high margins (70-80%)',
        docsUrl: 'https://onoxa.com/',
      },
      {
        name: 'Private Label Dynamics',
        icon: '🧪',
        status: 'ready',
        description: 'Higher MOQ, more customization — full formulation control',
      },
    ],
  },
  {
    id: 'analytics',
    layer: 7,
    name: 'Analytics + Data',
    icon: '📊',
    description: 'Enterprise analytics — traffic, attribution, behavior',
    integrations: [
      {
        name: 'Google Analytics',
        icon: '📈',
        status: 'ready',
        description: 'Traffic + behavior tracking (GA4)',
        docsUrl: 'https://developers.google.com/analytics',
        envKeys: ['GA_MEASUREMENT_ID'],
      },
      {
        name: 'Triple Whale',
        icon: '🐳',
        status: 'ready',
        description: 'DTC attribution clarity — true ROAS across all channels',
        docsUrl: 'https://developers.triplewhale.com/',
        envKeys: ['TRIPLE_WHALE_API_KEY'],
      },
      {
        name: 'Hotjar',
        icon: '🔥',
        status: 'ready',
        description: 'Heatmaps, session recordings, conversion funnels',
        docsUrl: 'https://www.hotjar.com/',
        envKeys: ['HOTJAR_SITE_ID'],
      },
    ],
  },
  {
    id: 'marketing-automation',
    layer: 8,
    name: 'Marketing Automation',
    icon: '📣',
    description: 'Revenue engine — luxury brands depend on email + social',
    integrations: [
      {
        name: 'Klaviyo',
        icon: '📧',
        status: 'ready',
        description: 'Luxury email revenue — flows, segments, SMS',
        docsUrl: 'https://developers.klaviyo.com/',
        envKeys: ['KLAVIYO_API_KEY'],
      },
      {
        name: 'Meta Ads',
        icon: '📱',
        status: 'ready',
        description: 'Instagram-heavy luxury audience — visual storytelling',
        docsUrl: 'https://developers.facebook.com/docs/marketing-apis',
        envKeys: ['META_ACCESS_TOKEN'],
      },
      {
        name: 'TikTok Ads',
        icon: '🎵',
        status: 'ready',
        description: 'Younger luxury buyers — viral potential',
        docsUrl: 'https://business-api.tiktok.com/portal/docs',
        envKeys: ['TIKTOK_ACCESS_TOKEN'],
      },
      {
        name: 'Google Ads',
        icon: '🔍',
        status: 'ready',
        description: 'Search + Shopping Ads — high intent luxury buyers',
        docsUrl: 'https://developers.google.com/google-ads/api',
        envKeys: ['GOOGLE_ADS_API_KEY'],
      },
    ],
  },
  {
    id: 'customer-experience',
    layer: 9,
    name: 'Customer Experience',
    icon: '🎁',
    description: 'Luxury support automation and returns — white-glove CX',
    integrations: [
      {
        name: 'Gorgias',
        icon: '💬',
        status: 'ready',
        description: 'AI support automation — "where is my order" handled automatically',
        docsUrl: 'https://developers.gorgias.com/',
        envKeys: ['GORGIAS_DOMAIN', 'GORGIAS_API_KEY', 'GORGIAS_EMAIL'],
      },
      {
        name: 'Loop Returns',
        icon: '🔄',
        status: 'ready',
        description: 'Luxury-friendly returns — exchanges over refunds, retain revenue',
        docsUrl: 'https://docs.loopreturns.com/',
        envKeys: ['LOOP_API_KEY'],
      },
    ],
  },
  {
    id: 'enterprise-control',
    layer: 10,
    name: 'Enterprise Control',
    icon: '🏢',
    description: 'Internal brand management, ops communication, design control',
    integrations: [
      {
        name: 'Notion',
        icon: '📓',
        status: 'ready',
        description: 'Internal brand management — SOPs, product database',
        docsUrl: 'https://developers.notion.com/',
        envKeys: ['NOTION_API_KEY'],
      },
      {
        name: 'Slack',
        icon: '💬',
        status: 'ready',
        description: 'Ops communication — order alerts, team coordination',
        docsUrl: 'https://api.slack.com/',
        envKeys: ['SLACK_BOT_TOKEN'],
      },
      {
        name: 'Figma',
        icon: '🎨',
        status: 'ready',
        description: 'Design control — brand assets, product mockups',
        docsUrl: 'https://www.figma.com/developers/api',
        envKeys: ['FIGMA_ACCESS_TOKEN'],
      },
    ],
  },
  {
    id: 'global-protection',
    layer: 11,
    name: 'Global Protection',
    icon: '🌍',
    description: 'Trademark filing and IP protection worldwide',
    integrations: [
      {
        name: 'USPTO',
        icon: '🏛️',
        status: 'ready',
        description: 'US trademark filing — protects brand name, logo, slogan',
      },
      {
        name: 'Madrid Protocol',
        icon: '🌐',
        status: 'ready',
        description: 'International trademark expansion — file in 130+ countries',
      },
    ],
  },
];

// =============================================================================
// HELPER FUNCTIONS (pure, no side effects)
// =============================================================================

/** Flat list of all integrations across all layers */
export function getAllIntegrations() {
  return LUXURY_BRAND_STACK.flatMap(layer => layer.integrations);
}

/** Get integrations for a specific layer by ID */
export function getLayerIntegrations(layerId: string) {
  return LUXURY_BRAND_STACK.find(l => l.id === layerId)?.integrations ?? [];
}

/** Count total integrations */
export function getTotalIntegrationCount() {
  return LUXURY_BRAND_STACK.reduce((sum, layer) => sum + layer.integrations.length, 0);
}

/** Get all required env keys for full stack setup */
export function getAllRequiredEnvKeys(): string[] {
  return [...new Set(getAllIntegrations().flatMap(i => i.envKeys ?? []))];
}
