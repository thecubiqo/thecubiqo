/**
 * Admin API Routes Test
 * Tests the 6 newly created admin API routes
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

describe('Admin API Routes', () => {
  describe('GET /api/admin/usage', () => {
    it('should return token usage stats', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/usage`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('usage');
      expect(data.usage).toHaveProperty('totalTokens');
      expect(data.usage.totalTokens).toHaveProperty('input');
      expect(data.usage.totalTokens).toHaveProperty('output');
      expect(data.usage.totalTokens).toHaveProperty('total');
      expect(data.usage).toHaveProperty('totalCost');
      expect(data.usage).toHaveProperty('byAgent');
      expect(data.usage).toHaveProperty('totalSessions');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/admin/costs', () => {
    it('should return cost breakdown', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/costs`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('costs');
      expect(data.costs).toHaveProperty('total');
      expect(data.costs).toHaveProperty('byAgent');
      expect(data.costs).toHaveProperty('byModel');
      expect(data.costs).toHaveProperty('totalSessions');
      expect(Array.isArray(data.costs.byAgent)).toBe(true);
      expect(Array.isArray(data.costs.byModel)).toBe(true);
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return user list', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('total');
      expect(Array.isArray(data.users)).toBe(true);
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/admin/config', () => {
    it('should return system config', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/config`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('config');
      expect(data.config).toHaveProperty('featureFlags');
      expect(data.config).toHaveProperty('environment');
      expect(data.config).toHaveProperty('system');
      expect(Array.isArray(data.config.featureFlags)).toBe(true);
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/admin/config', () => {
    it('should update system config', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureFlags: [
            { name: 'test_flag', enabled: true, description: 'Test flag' }
          ]
        }),
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('config');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/admin/logs', () => {
    it('should return system logs', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/logs`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('logs');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('offset');
      expect(Array.isArray(data.logs)).toBe(true);
      expect(data).toHaveProperty('timestamp');
    });

    it('should support pagination', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/logs?limit=10&offset=0`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(0);
    });

    it('should support level filtering', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/logs?level=error`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('logs');
    });
  });

  describe('GET /api/admin/health', () => {
    it('should return health check status', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
      expect(data).toHaveProperty('services');
      expect(data.services).toHaveProperty('supabase');
      expect(data.services).toHaveProperty('agents');
      expect(data.services).toHaveProperty('memory');
      expect(data.services).toHaveProperty('uptime');
      expect(data).toHaveProperty('timestamp');
    });

    it('should check all services', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/health`);
      const data = await response.json();
      
      // Each service should have a status
      expect(data.services.supabase).toHaveProperty('status');
      expect(data.services.agents).toHaveProperty('status');
      expect(data.services.memory).toHaveProperty('status');
      expect(data.services.uptime).toHaveProperty('status');
      
      // Memory should have metrics if healthy
      if (data.services.memory.status === 'healthy') {
        expect(data.services.memory).toHaveProperty('heapUsedMB');
        expect(data.services.memory).toHaveProperty('heapTotalMB');
        expect(data.services.memory).toHaveProperty('rssMB');
      }
      
      // Uptime should have metrics if healthy
      if (data.services.uptime.status === 'healthy') {
        expect(data.services.uptime).toHaveProperty('uptimeSeconds');
        expect(data.services.uptime).toHaveProperty('uptimeHuman');
      }
    });
  });
});
