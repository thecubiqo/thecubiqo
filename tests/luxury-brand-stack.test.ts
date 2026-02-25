import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Stack Definition ─────────────────────────────────────────────────────
import {
  LUXURY_BRAND_STACK,
  getAllIntegrations,
  getLayerIntegrations,
  getTotalIntegrationCount,
  getAllRequiredEnvKeys,
} from '@/integrations/luxury-brand/stack';

// ── API Clients ──────────────────────────────────────────────────────────
import {
  PayPalClient,
  KlaviyoClient,
  ShipBobClient,
  GorgiasClient,
  NotionClient,
  SlackClient,
  AffirmClient,
  KlarnaClient,
  ShipHeroClient,
  TripleWhaleClient,
  LoopReturnsClient,
  FigmaClient,
} from '@/integrations/luxury-brand/clients';

// ── Types (compile-time validation — import succeeds = types are valid) ──
import type {
  LuxuryBrandIntegration,
  LuxuryBrandLayer,
  PayPalConfig,
  KlaviyoConfig,
  ShipBobConfig,
  GorgiasConfig,
  NotionConfig,
  SlackConfig,
} from '@/integrations/luxury-brand/types';

// ── Barrel re-exports ────────────────────────────────────────────────────
import {
  LUXURY_BRAND_STACK as BARREL_STACK,
  PayPalClient as BarrelPayPal,
  KlaviyoClient as BarrelKlaviyo,
  getAllIntegrations as barrelGetAllIntegrations,
  getLayerIntegrations as barrelGetLayerIntegrations,
  getTotalIntegrationCount as barrelGetTotalIntegrationCount,
  getAllRequiredEnvKeys as barrelGetAllRequiredEnvKeys,
  ShipBobClient as BarrelShipBob,
  GorgiasClient as BarrelGorgias,
  NotionClient as BarrelNotion,
  SlackClient as BarrelSlack,
} from '@/integrations/luxury-brand';

// ════════════════════════════════════════════════════════════════════════════
//  1. STACK DEFINITION
// ════════════════════════════════════════════════════════════════════════════

describe('Luxury Brand Stack Definition', () => {
  // ── Structure ──────────────────────────────────────────────────────────

  it('has exactly 11 layers', () => {
    expect(LUXURY_BRAND_STACK).toHaveLength(11);
  });

  it('each layer has id, layer number, name, icon, description, and integrations array', () => {
    for (const layer of LUXURY_BRAND_STACK) {
      expect(typeof layer.id).toBe('string');
      expect(typeof layer.layer).toBe('number');
      expect(typeof layer.name).toBe('string');
      expect(typeof layer.icon).toBe('string');
      expect(typeof layer.description).toBe('string');
      expect(Array.isArray(layer.integrations)).toBe(true);
      expect(layer.integrations.length).toBeGreaterThan(0);
    }
  });

  it('layer numbers are 1–11, sequential', () => {
    const layerNumbers = LUXURY_BRAND_STACK.map(l => l.layer);
    expect(layerNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('layer IDs are unique', () => {
    const ids = LUXURY_BRAND_STACK.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all integration names are unique across the entire stack', () => {
    const names = getAllIntegrations().map(i => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  // ── Every integration has required fields ──────────────────────────────

  it('all integrations have name, icon, status, and description', () => {
    for (const integration of getAllIntegrations()) {
      expect(typeof integration.name).toBe('string');
      expect(integration.name.length).toBeGreaterThan(0);
      expect(typeof integration.icon).toBe('string');
      expect(integration.icon.length).toBeGreaterThan(0);
      expect(typeof integration.status).toBe('string');
      expect(typeof integration.description).toBe('string');
      expect(integration.description.length).toBeGreaterThan(0);
    }
  });

  it('all statuses are one of: ready, pending, premium', () => {
    const validStatuses = ['ready', 'pending', 'premium'];
    for (const integration of getAllIntegrations()) {
      expect(validStatuses).toContain(integration.status);
    }
  });

  // ── Helper functions ───────────────────────────────────────────────────

  it('getAllIntegrations() returns a flat list with correct count', () => {
    const all = getAllIntegrations();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(30);
  });

  it('getLayerIntegrations("payments") returns 5 payment integrations', () => {
    const payments = getLayerIntegrations('payments');
    expect(payments).toHaveLength(5);

    const names = payments.map(i => i.name);
    expect(names).toContain('Shopify Payments');
    expect(names).toContain('Stripe');
    expect(names).toContain('PayPal');
    expect(names).toContain('Affirm');
    expect(names).toContain('Klarna');
  });

  it('getLayerIntegrations("nonexistent") returns empty array', () => {
    expect(getLayerIntegrations('nonexistent')).toEqual([]);
  });

  it('getTotalIntegrationCount() returns 30', () => {
    expect(getTotalIntegrationCount()).toBe(30);
  });

  it('getAllRequiredEnvKeys() returns unique env keys (no duplicates)', () => {
    const keys = getAllRequiredEnvKeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
    // Should contain some known keys
    expect(keys).toContain('STRIPE_SECRET_KEY');
    expect(keys).toContain('PAYPAL_CLIENT_ID');
    expect(keys).toContain('KLAVIYO_API_KEY');
  });

  // ── Specific layer content assertions ──────────────────────────────────

  it('Commerce Core layer (L1) has Shopify Plus', () => {
    const l1 = getLayerIntegrations('commerce-core');
    const names = l1.map(i => i.name);
    expect(names).toContain('Shopify Plus');
  });

  it('Payments layer (L2) has Stripe, PayPal, Affirm, Klarna', () => {
    const l2 = getLayerIntegrations('payments');
    const names = l2.map(i => i.name);
    expect(names).toContain('Stripe');
    expect(names).toContain('PayPal');
    expect(names).toContain('Affirm');
    expect(names).toContain('Klarna');
  });

  it('Apparel Production layer (L3) has Printful, Apliiq, Los Angeles Apparel', () => {
    const l3 = getLayerIntegrations('apparel-production');
    const names = l3.map(i => i.name);
    expect(names).toContain('Printful');
    expect(names).toContain('Apliiq');
    expect(names).toContain('Los Angeles Apparel');
  });

  it('Marketing Automation layer (L8) has Klaviyo, Meta Ads, TikTok Ads, Google Ads', () => {
    const l8 = getLayerIntegrations('marketing-automation');
    const names = l8.map(i => i.name);
    expect(names).toContain('Klaviyo');
    expect(names).toContain('Meta Ads');
    expect(names).toContain('TikTok Ads');
    expect(names).toContain('Google Ads');
  });

  it('Customer Experience layer (L9) has Gorgias and Loop Returns', () => {
    const l9 = getLayerIntegrations('customer-experience');
    const names = l9.map(i => i.name);
    expect(names).toContain('Gorgias');
    expect(names).toContain('Loop Returns');
  });

  it('Enterprise Control layer (L10) has Notion, Slack, Figma', () => {
    const l10 = getLayerIntegrations('enterprise-control');
    const names = l10.map(i => i.name);
    expect(names).toContain('Notion');
    expect(names).toContain('Slack');
    expect(names).toContain('Figma');
  });

  it('Global Protection layer (L11) has USPTO and Madrid Protocol', () => {
    const l11 = getLayerIntegrations('global-protection');
    const names = l11.map(i => i.name);
    expect(names).toContain('USPTO');
    expect(names).toContain('Madrid Protocol');
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  2. API CLIENTS
// ════════════════════════════════════════════════════════════════════════════

describe('API Clients', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock global.fetch for every client test
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ── Helpers ────────────────────────────────────────────────────────────

  /** Return a mocked successful JSON response (with auth support for PayPal) */
  function mockFetchOk(json: unknown) {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => json,
      text: async () => JSON.stringify(json),
    });
  }

  /** Return a mocked failed response */
  function mockFetchFail(status = 500, body = 'Internal Server Error') {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status,
      text: async () => body,
    });
  }

  // ── PayPalClient ──────────────────────────────────────────────────────

  describe('PayPalClient', () => {
    const client = new PayPalClient({ clientId: 'id', clientSecret: 'secret', sandbox: true });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.createOrder).toBe('function');
      expect(typeof client.captureOrder).toBe('function');
      expect(typeof client.getOrder).toBe('function');
    });

    it('throws when authentication fails', async () => {
      mockFetchFail(401, 'Unauthorized');
      await expect(client.createOrder([{ reference_id: 'r1', amount: { currency_code: 'USD', value: '10.00' } }]))
        .rejects.toThrow('PayPal auth error');
    });

    it('throws when API call fails after auth', async () => {
      // First call (auth) succeeds, second call (createOrder) fails
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }), text: async () => '' })
        .mockResolvedValueOnce({ ok: false, status: 422, text: async () => 'Bad request' });

      await expect(client.createOrder([{ reference_id: 'r1', amount: { currency_code: 'USD', value: '10.00' } }]))
        .rejects.toThrow('PayPal API error');
    });
  });

  // ── KlaviyoClient ─────────────────────────────────────────────────────

  describe('KlaviyoClient', () => {
    const client = new KlaviyoClient({ apiKey: 'pk_test_abc123' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.getProfiles).toBe('function');
      expect(typeof client.createProfile).toBe('function');
      expect(typeof client.trackEvent).toBe('function');
      expect(typeof client.getFlows).toBe('function');
      expect(typeof client.getLists).toBe('function');
      expect(typeof client.addToList).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(403, 'Forbidden');
      await expect(client.getProfiles()).rejects.toThrow('Klaviyo API error');
    });

    it('returns profiles on success', async () => {
      mockFetchOk({ data: [{ id: 'p1', email: 'a@b.com' }] });
      const result = await client.getProfiles();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('a@b.com');
    });
  });

  // ── ShipBobClient ─────────────────────────────────────────────────────

  describe('ShipBobClient', () => {
    const client = new ShipBobClient({ apiKey: 'sb_test_key', channelId: 'ch_1' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.createOrder).toBe('function');
      expect(typeof client.getOrder).toBe('function');
      expect(typeof client.getInventory).toBe('function');
      expect(typeof client.getProducts).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(500, 'Server error');
      await expect(client.getOrder(123)).rejects.toThrow('ShipBob API error');
    });
  });

  // ── GorgiasClient ─────────────────────────────────────────────────────

  describe('GorgiasClient', () => {
    const client = new GorgiasClient({ domain: 'my-brand', apiKey: 'gorgias_key', email: 'agent@brand.com' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.getTickets).toBe('function');
      expect(typeof client.getTicket).toBe('function');
      expect(typeof client.createTicket).toBe('function');
      expect(typeof client.replyToTicket).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(401, 'Unauthorized');
      await expect(client.getTickets()).rejects.toThrow('Gorgias API error');
    });
  });

  // ── NotionClient ──────────────────────────────────────────────────────

  describe('NotionClient', () => {
    const client = new NotionClient({ apiKey: 'ntn_test_key' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.getPage).toBe('function');
      expect(typeof client.createPage).toBe('function');
      expect(typeof client.queryDatabase).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(404, 'Not found');
      await expect(client.getPage('page-id')).rejects.toThrow('Notion API error');
    });
  });

  // ── SlackClient ───────────────────────────────────────────────────────

  describe('SlackClient', () => {
    const client = new SlackClient({ botToken: 'xoxb-test-token' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.postMessage).toBe('function');
      expect(typeof client.getChannels).toBe('function');
    });

    it('throws when HTTP request fails', async () => {
      mockFetchFail(500, 'Slack down');
      await expect(client.postMessage('#general', 'hello')).rejects.toThrow('Slack API error');
    });

    it('throws when Slack API returns ok: false', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: false, error: 'channel_not_found' }),
        text: async () => '',
      });
      await expect(client.postMessage('#deleted-channel', 'hello'))
        .rejects.toThrow('Slack API error: channel_not_found');
    });
  });

  // ── AffirmClient ──────────────────────────────────────────────────────

  describe('AffirmClient', () => {
    const client = new AffirmClient({ publicKey: 'pub', privateKey: 'priv', sandbox: true });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.authorizeCheckout).toBe('function');
      expect(typeof client.captureCharge).toBe('function');
      expect(typeof client.voidCharge).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(400, 'Bad token');
      await expect(client.authorizeCheckout('tok_bad')).rejects.toThrow('Affirm API error');
    });
  });

  // ── KlarnaClient ──────────────────────────────────────────────────────

  describe('KlarnaClient', () => {
    const client = new KlarnaClient({ apiKey: 'klarna_key', apiSecret: 'klarna_secret', region: 'na' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.createSession).toBe('function');
      expect(typeof client.createOrder).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(403, 'Forbidden');
      await expect(client.createSession({
        purchase_country: 'US',
        purchase_currency: 'USD',
        locale: 'en-US',
        order_amount: 5000,
        order_lines: [{ name: 'Item', quantity: 1, unit_price: 5000, total_amount: 5000 }],
      })).rejects.toThrow('Klarna API error');
    });
  });

  // ── TripleWhaleClient ─────────────────────────────────────────────────

  describe('TripleWhaleClient', () => {
    const client = new TripleWhaleClient({ apiKey: 'tw_key', shopDomain: 'my-shop.myshopify.com' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.getAttribution).toBe('function');
      expect(typeof client.getSummary).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(500, 'Server Error');
      await expect(client.getSummary()).rejects.toThrow('Triple Whale API error');
    });
  });

  // ── LoopReturnsClient ─────────────────────────────────────────────────

  describe('LoopReturnsClient', () => {
    const client = new LoopReturnsClient({ apiKey: 'loop_key', shopDomain: 'shop.com' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.getReturns).toBe('function');
      expect(typeof client.getReturn).toBe('function');
      expect(typeof client.getAnalytics).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(401, 'Unauthorized');
      await expect(client.getReturns()).rejects.toThrow('Loop Returns API error');
    });
  });

  // ── FigmaClient ───────────────────────────────────────────────────────

  describe('FigmaClient', () => {
    const client = new FigmaClient({ accessToken: 'figma_token' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.getFile).toBe('function');
      expect(typeof client.getFileComponents).toBe('function');
      expect(typeof client.getTeamProjects).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(403, 'Token expired');
      await expect(client.getFile('file-key')).rejects.toThrow('Figma API error');
    });
  });

  // ── ShipHeroClient ────────────────────────────────────────────────────

  describe('ShipHeroClient', () => {
    const client = new ShipHeroClient({ apiKey: 'sh_key' });

    it('can be instantiated', () => {
      expect(client).toBeDefined();
    });

    it('has expected methods', () => {
      expect(typeof client.getOrders).toBe('function');
      expect(typeof client.getInventory).toBe('function');
    });

    it('throws when API call fails', async () => {
      mockFetchFail(500, 'GraphQL timeout');
      await expect(client.getOrders()).rejects.toThrow('ShipHero API error');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  3. TYPES VALIDATION (compile-time)
// ════════════════════════════════════════════════════════════════════════════

describe('Types validation', () => {
  it('LuxuryBrandIntegration type matches stack data shape', () => {
    const sample: LuxuryBrandIntegration = getAllIntegrations()[0];
    expect(sample).toHaveProperty('name');
    expect(sample).toHaveProperty('icon');
    expect(sample).toHaveProperty('status');
    expect(sample).toHaveProperty('description');
  });

  it('LuxuryBrandLayer type matches stack layer shape', () => {
    const layer: LuxuryBrandLayer = LUXURY_BRAND_STACK[0];
    expect(layer).toHaveProperty('id');
    expect(layer).toHaveProperty('layer');
    expect(layer).toHaveProperty('name');
    expect(layer).toHaveProperty('icon');
    expect(layer).toHaveProperty('description');
    expect(layer).toHaveProperty('integrations');
  });

  it('config types can be used to construct clients without errors', () => {
    const paypalCfg: PayPalConfig = { clientId: 'x', clientSecret: 'y', sandbox: true };
    const klaviyoCfg: KlaviyoConfig = { apiKey: 'k' };
    const shipbobCfg: ShipBobConfig = { apiKey: 's' };
    const gorgiasCfg: GorgiasConfig = { domain: 'd', apiKey: 'g', email: 'e@e.com' };
    const notionCfg: NotionConfig = { apiKey: 'n' };
    const slackCfg: SlackConfig = { botToken: 'xoxb' };

    // Constructors should not throw
    expect(() => new PayPalClient(paypalCfg)).not.toThrow();
    expect(() => new KlaviyoClient(klaviyoCfg)).not.toThrow();
    expect(() => new ShipBobClient(shipbobCfg)).not.toThrow();
    expect(() => new GorgiasClient(gorgiasCfg)).not.toThrow();
    expect(() => new NotionClient(notionCfg)).not.toThrow();
    expect(() => new SlackClient(slackCfg)).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  4. BARREL INDEX RE-EXPORTS
// ════════════════════════════════════════════════════════════════════════════

describe('Barrel index re-exports', () => {
  it('LUXURY_BRAND_STACK is accessible from barrel', () => {
    expect(BARREL_STACK).toBeDefined();
    expect(BARREL_STACK).toBe(LUXURY_BRAND_STACK);
  });

  it('helper functions are accessible from barrel', () => {
    expect(typeof barrelGetAllIntegrations).toBe('function');
    expect(typeof barrelGetLayerIntegrations).toBe('function');
    expect(typeof barrelGetTotalIntegrationCount).toBe('function');
    expect(typeof barrelGetAllRequiredEnvKeys).toBe('function');
  });

  it('PayPalClient is accessible from barrel', () => {
    expect(BarrelPayPal).toBe(PayPalClient);
  });

  it('KlaviyoClient is accessible from barrel', () => {
    expect(BarrelKlaviyo).toBe(KlaviyoClient);
  });

  it('ShipBobClient is accessible from barrel', () => {
    expect(BarrelShipBob).toBe(ShipBobClient);
  });

  it('GorgiasClient is accessible from barrel', () => {
    expect(BarrelGorgias).toBe(GorgiasClient);
  });

  it('NotionClient is accessible from barrel', () => {
    expect(BarrelNotion).toBe(NotionClient);
  });

  it('SlackClient is accessible from barrel', () => {
    expect(BarrelSlack).toBe(SlackClient);
  });

  it('barrel helpers return the same results as direct imports', () => {
    expect(barrelGetTotalIntegrationCount()).toBe(getTotalIntegrationCount());
    expect(barrelGetAllIntegrations()).toEqual(getAllIntegrations());
    expect(barrelGetAllRequiredEnvKeys()).toEqual(getAllRequiredEnvKeys());
  });
});
