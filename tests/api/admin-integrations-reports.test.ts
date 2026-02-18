/**
 * Test Suite for Admin Integrations & Reports API Endpoints
 * 
 * Run with: npm test tests/api/admin-integrations-reports.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('Admin API - Integrations & Reports', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Admin credentials for testing (should be set in test environment)
  const ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN;
  
  // Helper function to make authenticated requests
  const makeRequest = async (endpoint: string, method = 'GET', body?: any) => {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(ADMIN_TOKEN && { 'Authorization': `Bearer ${ADMIN_TOKEN}` }),
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    return {
      status: response.status,
      data: await response.json(),
    };
  };

  describe('Integration Health API', () => {
    describe('GET /api/admin/integrations/health', () => {
      it('should return 401 if not authenticated', async () => {
        const response = await fetch(`${BASE_URL}/api/admin/integrations/health`);
        expect(response.status).toBe(401);
      });

      it('should return integration health list for admin', async () => {
        const { status, data } = await makeRequest('/api/admin/integrations/health');
        
        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.integrations).toBeInstanceOf(Array);
        expect(data.data.summary).toBeDefined();
        expect(data.pagination).toBeDefined();
      });

      it('should filter by status', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/integrations/health?status=healthy'
        );
        
        expect(status).toBe(200);
        expect(data.success).toBe(true);
        data.data.integrations.forEach((integration: any) => {
          expect(integration.status).toBe('healthy');
        });
      });

      it('should paginate results', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/integrations/health?limit=10&offset=0'
        );
        
        expect(status).toBe(200);
        expect(data.pagination.limit).toBe(10);
        expect(data.pagination.offset).toBe(0);
      });
    });

    describe('POST /api/admin/integrations/health', () => {
      it('should update integration health', async () => {
        const healthData = {
          integration_name: 'test_integration',
          integration_type: 'api',
          status: 'healthy',
          response_time_ms: 150,
          error_count: 0,
          success_rate: 0.99,
          health_data: { last_check: new Date().toISOString() },
        };

        const { status, data } = await makeRequest(
          '/api/admin/integrations/health',
          'POST',
          healthData
        );
        
        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.integration_name).toBe(healthData.integration_name);
        expect(data.data.status).toBe(healthData.status);
        expect(data.data.uptime_percentage).toBeDefined();
      });

      it('should validate required fields', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/integrations/health',
          'POST',
          { integration_name: 'test' } // Missing required fields
        );
        
        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('required');
      });

      it('should validate status values', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/integrations/health',
          'POST',
          {
            integration_name: 'test',
            integration_type: 'api',
            status: 'invalid_status',
          }
        );
        
        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('status must be one of');
      });
    });
  });

  describe('Integration List API', () => {
    describe('GET /api/admin/integrations/list', () => {
      it('should return all configured integrations', async () => {
        const { status, data } = await makeRequest('/api/admin/integrations/list');
        
        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.integrations).toBeInstanceOf(Array);
        expect(data.data.summary).toBeDefined();
        expect(data.data.summary.total).toBeGreaterThan(0);
      });

      it('should include health data by default', async () => {
        const { status, data } = await makeRequest('/api/admin/integrations/list');
        
        expect(status).toBe(200);
        expect(data.data.integrations.length).toBeGreaterThan(0);
        
        // Check if integrations have health property
        const firstIntegration = data.data.integrations[0];
        expect(firstIntegration).toHaveProperty('health');
      });

      it('should filter by type', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/integrations/list?type=oauth'
        );
        
        expect(status).toBe(200);
        data.data.integrations.forEach((integration: any) => {
          expect(integration.type).toBe('oauth');
        });
      });

      it('should search integrations', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/integrations/list?search=supabase'
        );
        
        expect(status).toBe(200);
        data.data.integrations.forEach((integration: any) => {
          const searchTerm = 'supabase';
          const matches = 
            integration.name.toLowerCase().includes(searchTerm) ||
            integration.provider?.toLowerCase().includes(searchTerm) ||
            integration.description?.toLowerCase().includes(searchTerm);
          expect(matches).toBe(true);
        });
      });
    });
  });

  describe('Report Generation API', () => {
    describe('POST /api/admin/reports/generate', () => {
      const testDateRange = {
        date_range_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        date_range_end: new Date().toISOString(),
      };

      it('should generate user activity report', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/generate',
          'POST',
          {
            report_type: 'user_activity',
            ...testDateRange,
          }
        );
        
        expect(status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.report_id).toBeDefined();
        expect(data.data.report_type).toBe('user_activity');
        expect(data.data.report_data).toBeDefined();
        expect(data.data.report_data.summary).toBeDefined();
      });

      it('should generate GDPR compliance report', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/generate',
          'POST',
          {
            report_type: 'compliance_gdpr',
            ...testDateRange,
          }
        );
        
        expect(status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.report_type).toBe('compliance_gdpr');
      });

      it('should generate CCPA compliance report', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/generate',
          'POST',
          {
            report_type: 'compliance_ccpa',
            ...testDateRange,
          }
        );
        
        expect(status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.report_type).toBe('compliance_ccpa');
      });

      it('should generate AI performance report', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/generate',
          'POST',
          {
            report_type: 'ai_performance',
            ...testDateRange,
          }
        );
        
        expect(status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.report_type).toBe('ai_performance');
      });

      it('should generate security audit report', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/generate',
          'POST',
          {
            report_type: 'security_audit',
            ...testDateRange,
          }
        );
        
        expect(status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.report_type).toBe('security_audit');
      });

      it('should validate report type', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/generate',
          'POST',
          {
            report_type: 'invalid_type',
            ...testDateRange,
          }
        );
        
        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('report_type must be one of');
      });

      it('should validate date range', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/generate',
          'POST',
          {
            report_type: 'user_activity',
            date_range_start: new Date().toISOString(),
            date_range_end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        );
        
        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('date_range_start must be before date_range_end');
      });

      it('should require date range fields', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/generate',
          'POST',
          { report_type: 'user_activity' }
        );
        
        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('date_range_start and date_range_end are required');
      });
    });
  });

  describe('Reports List API', () => {
    describe('GET /api/admin/reports/list', () => {
      it('should return list of generated reports', async () => {
        const { status, data } = await makeRequest('/api/admin/reports/list');
        
        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.reports).toBeInstanceOf(Array);
        expect(data.data.summary).toBeDefined();
        expect(data.pagination).toBeDefined();
      });

      it('should filter by report type', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/list?report_type=user_activity'
        );
        
        expect(status).toBe(200);
        data.data.reports.forEach((report: any) => {
          expect(report.report_type).toBe('user_activity');
        });
      });

      it('should support pagination', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/list?limit=5&offset=0'
        );
        
        expect(status).toBe(200);
        expect(data.pagination.limit).toBe(5);
        expect(data.pagination.offset).toBe(0);
        expect(data.data.reports.length).toBeLessThanOrEqual(5);
      });

      it('should exclude report_data by default', async () => {
        const { status, data } = await makeRequest('/api/admin/reports/list');
        
        expect(status).toBe(200);
        if (data.data.reports.length > 0) {
          const firstReport = data.data.reports[0];
          expect(firstReport.report_data).toBeUndefined();
          expect(firstReport.data_summary).toBeDefined();
        }
      });

      it('should include report_data when requested', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/list?include_data=true&limit=1'
        );
        
        expect(status).toBe(200);
        if (data.data.reports.length > 0) {
          const firstReport = data.data.reports[0];
          expect(firstReport.report_data).toBeDefined();
        }
      });

      it('should sort reports', async () => {
        const { status, data } = await makeRequest(
          '/api/admin/reports/list?sort=created_at&order=desc'
        );
        
        expect(status).toBe(200);
        
        // Verify descending order
        const reports = data.data.reports;
        for (let i = 1; i < reports.length; i++) {
          const prevDate = new Date(reports[i - 1].created_at);
          const currDate = new Date(reports[i].created_at);
          expect(prevDate >= currDate).toBe(true);
        }
      });
    });
  });
});
