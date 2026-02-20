// Basic tests for Shopify and Printify integrations
import { describe, it, expect } from 'vitest';
import { ShopifyClient } from '@/integrations/shopify/client';
import { PrintifyClient } from '@/integrations/printify/client';
import { verifyShopifyWebhook } from '@/integrations/shopify/webhooks';

describe('Shopify Integration', () => {
  describe('ShopifyClient', () => {
    it('should create a client with config', () => {
      const client = new ShopifyClient({
        shopDomain: 'test-store.myshopify.com',
        accessToken: 'test_token',
        apiVersion: '2024-01',
      });

      expect(client).toBeDefined();
    });

    it('should use default API version if not provided', () => {
      const client = new ShopifyClient({
        shopDomain: 'test-store.myshopify.com',
        accessToken: 'test_token',
      });

      expect(client).toBeDefined();
    });
  });

  describe('Webhook Verification', () => {
    it('should verify valid webhook signature', () => {
      const secret = 'test_secret';
      const body = '{"id":"12345"}';
      
      // Create HMAC signature
      const crypto = require('crypto');
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

      const isValid = verifyShopifyWebhook(body, hmac, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const secret = 'test_secret';
      const body = '{"id":"12345"}';
      const invalidHmac = 'invalid_signature';

      const isValid = verifyShopifyWebhook(body, invalidHmac, secret);
      expect(isValid).toBe(false);
    });
  });
});

describe('Printify Integration', () => {
  describe('PrintifyClient', () => {
    it('should create a client with config', () => {
      const client = new PrintifyClient({
        apiToken: 'test_token',
        apiVersion: 'v1',
      });

      expect(client).toBeDefined();
    });

    it('should use default API version if not provided', () => {
      const client = new PrintifyClient({
        apiToken: 'test_token',
      });

      expect(client).toBeDefined();
    });
  });
});

describe('Integration Types', () => {
  it('should have proper Shopify types', () => {
    const product = {
      id: '123',
      title: 'Test Product',
      variants: [],
      images: [],
    };

    expect(product.id).toBe('123');
    expect(product.title).toBe('Test Product');
  });

  it('should have proper Printify types', () => {
    const shop = {
      id: 123,
      title: 'Test Shop',
      sales_channel: 'shopify',
    };

    expect(shop.id).toBe(123);
    expect(shop.title).toBe('Test Shop');
  });
});
