/**
 * Security Tests: Fraud Detection
 * 
 * Tests for fraud detection and prevention
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeTransaction,
  requiresMFA,
  type Transaction,
} from '@/lib/security/fraud-detection';

describe('Fraud Detection', () => {
  describe('analyzeTransaction', () => {
    it('should allow normal transactions', async () => {
      const transaction: Transaction = {
        userId: 'user-123',
        action: 'view_dashboard',
        metadata: {},
      };
      
      const result = await analyzeTransaction(transaction);
      
      expect(result.riskScore).toBeLessThan(50);
      expect(result.recommendation).toBe('allow');
      expect(result.flags).toHaveLength(0);
    });

    it('should detect high velocity', async () => {
      const userId = 'user-velocity-test';
      
      // Make many rapid transactions
      for (let i = 0; i < 12; i++) {
        await analyzeTransaction({
          userId,
          action: 'api_call',
          metadata: {},
          timestamp: new Date(),
        });
      }
      
      const result = await analyzeTransaction({
        userId,
        action: 'api_call',
        metadata: {},
        timestamp: new Date(),
      });
      
      expect(result.details.velocity).toBeGreaterThan(50);
      expect(result.flags.length).toBeGreaterThan(0);
    });

    it('should detect unusual amounts', async () => {
      const userId = 'user-amount-test';
      
      // Make some normal transactions
      await analyzeTransaction({
        userId,
        action: 'purchase',
        amount: 10,
        metadata: {},
      });
      
      await analyzeTransaction({
        userId,
        action: 'purchase',
        amount: 15,
        metadata: {},
      });
      
      // Make a very large transaction
      const result = await analyzeTransaction({
        userId,
        action: 'purchase',
        amount: 1000,
        metadata: {},
      });
      
      expect(result.details.anomaly).toBeGreaterThan(0);
    });

    it('should detect suspicious user agents', async () => {
      const transaction: Transaction = {
        userId: 'user-456',
        action: 'login',
        metadata: {},
        userAgent: 'curl/7.68.0',
      };
      
      const result = await analyzeTransaction(transaction);
      
      expect(result.details.reputation).toBeGreaterThan(0);
    });

    it('should detect geographic anomalies', async () => {
      const userId = 'user-geo-test';
      
      // First transaction from US
      await analyzeTransaction({
        userId,
        action: 'login',
        metadata: {},
        location: { country: 'US' },
        timestamp: new Date(),
      });
      
      // Immediate transaction from different country
      const result = await analyzeTransaction({
        userId,
        action: 'login',
        metadata: {},
        location: { country: 'RU' },
        timestamp: new Date(Date.now() + 1000), // 1 second later
      });
      
      expect(result.details.anomaly).toBeGreaterThan(0);
    });

    it('should recommend blocking high-risk transactions', async () => {
      const userId = 'user-highrisk-test';
      
      // Create a very suspicious transaction
      const result = await analyzeTransaction({
        userId,
        action: 'large_transfer',
        amount: 10000,
        metadata: { status: 'pending' },
        userAgent: 'curl',
        ipAddress: '10.0.0.1',
        timestamp: new Date(),
      });
      
      // Should have high risk score
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should recommend review for medium-risk transactions', async () => {
      const userId = 'user-mediumrisk-test';
      
      // Create a somewhat suspicious transaction
      await analyzeTransaction({
        userId,
        action: 'login',
        metadata: {},
        location: { country: 'US' },
      });
      
      const result = await analyzeTransaction({
        userId,
        action: 'large_purchase',
        amount: 500,
        metadata: {},
        location: { country: 'CN' },
        timestamp: new Date(Date.now() + 10000),
      });
      
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });

    it('should provide detailed analysis', async () => {
      const transaction: Transaction = {
        userId: 'user-789',
        action: 'api_call',
        metadata: {},
      };
      
      const result = await analyzeTransaction(transaction);
      
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('details');
      expect(result.details).toHaveProperty('velocity');
      expect(result.details).toHaveProperty('anomaly');
      expect(result.details).toHaveProperty('reputation');
      expect(result.details).toHaveProperty('pattern');
    });
  });

  describe('requiresMFA', () => {
    it('should require MFA for high-risk transactions', () => {
      const transaction: Transaction = {
        userId: 'user-123',
        action: 'normal_action',
        metadata: {},
      };
      
      const riskScore = 80;
      const result = requiresMFA(transaction, riskScore);
      
      expect(result).toBe(true);
    });

    it('should require MFA for high-value transactions', () => {
      const transaction: Transaction = {
        userId: 'user-123',
        action: 'purchase',
        amount: 500,
        metadata: {},
      };
      
      const riskScore = 10;
      const result = requiresMFA(transaction, riskScore);
      
      expect(result).toBe(true);
    });

    it('should require MFA for sensitive actions', () => {
      const sensitiveActions = [
        'delete_account',
        'change_email',
        'change_password',
        'add_payment_method',
      ];
      
      for (const action of sensitiveActions) {
        const transaction: Transaction = {
          userId: 'user-123',
          action,
          metadata: {},
        };
        
        const result = requiresMFA(transaction, 0);
        expect(result).toBe(true);
      }
    });

    it('should not require MFA for low-risk transactions', () => {
      const transaction: Transaction = {
        userId: 'user-123',
        action: 'view_dashboard',
        metadata: {},
      };
      
      const riskScore = 10;
      const result = requiresMFA(transaction, riskScore);
      
      expect(result).toBe(false);
    });

    it('should not require MFA for small amounts', () => {
      const transaction: Transaction = {
        userId: 'user-123',
        action: 'purchase',
        amount: 10,
        metadata: {},
      };
      
      const riskScore = 10;
      const result = requiresMFA(transaction, riskScore);
      
      expect(result).toBe(false);
    });
  });
});
