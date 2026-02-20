/**
 * Admin API: Integration Management
 * 
 * Endpoints for managing and viewing all configured integrations
 * Supports OAuth providers, API integrations, and external services
 * 
 * @route GET /api/admin/integrations/list - List all configured integrations
 * @access Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit';

/**
 * Integration configuration interface
 * Represents a configured integration in the system
 */
interface IntegrationConfig {
  name: string;
  type: 'oauth' | 'api' | 'webhook' | 'database' | 'storage' | 'analytics' | 'email' | 'payment' | 'other';
  enabled: boolean;
  provider?: string;
  description?: string;
  config_details?: Record<string, any>;
  last_sync?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * GET /api/admin/integrations/list
 * 
 * Retrieves all configured integrations with their current status
 * Combines data from integration_health table and hardcoded system integrations
 * 
 * Query Parameters:
 * - type: Filter by integration type (oauth/api/webhook/etc)
 * - enabled: Filter by enabled status (true/false)
 * - search: Search by name or provider
 * - include_health: Include health metrics (default: true)
 * - limit: Results per page (default: 50)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     integrations: [...],
 *     summary: { total, enabled, disabled, by_type }
 *   },
 *   pagination: { limit, offset, total, hasMore }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Step 1: Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Step 2: Verify admin access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Step 3: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const typeFilter = searchParams.get('type');
    const enabledFilter = searchParams.get('enabled');
    const searchQuery = searchParams.get('search')?.toLowerCase();
    const includeHealth = searchParams.get('include_health') !== 'false';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Step 4: Get system integrations (hardcoded + environment-based)
    const systemIntegrations = getSystemIntegrations();

    // Step 5: Fetch health data for all integrations (if requested)
    let healthData: Record<string, any> = {};
    if (includeHealth) {
      const { data: healthRecords, error: healthError } = await supabase
        .from('integration_health')
        .select('*');

      if (!healthError && healthRecords) {
        healthData = healthRecords.reduce((acc, record) => {
          acc[record.integration_name] = record;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Step 6: Merge system integrations with health data
    let integrations = systemIntegrations.map(integration => {
      const health = healthData[integration.name];
      return {
        ...integration,
        health: health ? {
          status: health.status,
          last_checked_at: health.last_checked_at,
          response_time_ms: health.response_time_ms,
          error_count: health.error_count,
          success_rate: health.success_rate,
          uptime_percentage: health.success_rate ? (health.success_rate * 100).toFixed(2) : null,
        } : null,
      };
    });

    // Step 7: Apply filters
    if (typeFilter) {
      integrations = integrations.filter(i => i.type === typeFilter);
    }

    if (enabledFilter !== null) {
      const isEnabled = enabledFilter === 'true';
      integrations = integrations.filter(i => i.enabled === isEnabled);
    }

    if (searchQuery) {
      integrations = integrations.filter(i => 
        i.name.toLowerCase().includes(searchQuery) ||
        i.provider?.toLowerCase().includes(searchQuery) ||
        i.description?.toLowerCase().includes(searchQuery)
      );
    }

    // Step 8: Apply pagination
    const total = integrations.length;
    const paginatedIntegrations = integrations.slice(offset, offset + limit);

    // Step 9: Generate summary statistics
    const summary = {
      total: total,
      enabled: integrations.filter(i => i.enabled).length,
      disabled: integrations.filter(i => !i.enabled).length,
      by_type: integrations.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      health_summary: includeHealth ? {
        healthy: integrations.filter(i => i.health?.status === 'healthy').length,
        degraded: integrations.filter(i => i.health?.status === 'degraded').length,
        down: integrations.filter(i => i.health?.status === 'down').length,
        unknown: integrations.filter(i => !i.health).length,
      } : undefined,
    };

    // Step 10: Log admin action
    await logAdminAction({
      userId: user.id,
      userEmail: profile.email,
      actionType: 'view_integrations',
      actionDetails: {
        filters: { type: typeFilter, enabled: enabledFilter, search: searchQuery },
        results_count: paginatedIntegrations.length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: {
        integrations: paginatedIntegrations,
        summary,
      },
      pagination: {
        limit,
        offset,
        total,
        hasMore: (offset + limit) < total,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/integrations/list:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get system integrations based on environment configuration
 * Returns list of all integrations configured in the system
 * 
 * This function checks environment variables to determine which integrations
 * are configured and returns their current status
 */
function getSystemIntegrations(): IntegrationConfig[] {
  const integrations: IntegrationConfig[] = [];

  // OAuth Providers
  integrations.push({
    name: 'supabase_auth',
    type: 'oauth',
    enabled: true,
    provider: 'Supabase',
    description: 'Primary authentication provider',
    config_details: {
      supports_email: true,
      supports_oauth: true,
      providers: ['google', 'github', 'azure'],
    },
    last_sync: new Date().toISOString(),
  });

  // Check for Google OAuth
  if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    integrations.push({
      name: 'google_oauth',
      type: 'oauth',
      enabled: true,
      provider: 'Google',
      description: 'Google OAuth authentication',
      config_details: {
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      },
    });
  }

  // Check for GitHub OAuth
  if (process.env.GITHUB_CLIENT_ID) {
    integrations.push({
      name: 'github_oauth',
      type: 'oauth',
      enabled: true,
      provider: 'GitHub',
      description: 'GitHub OAuth authentication',
    });
  }

  // Database
  integrations.push({
    name: 'supabase_database',
    type: 'database',
    enabled: true,
    provider: 'Supabase (PostgreSQL)',
    description: 'Primary database with Row-Level Security',
    config_details: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_rls: true,
      has_realtime: true,
    },
  });

  // Storage
  integrations.push({
    name: 'supabase_storage',
    type: 'storage',
    enabled: true,
    provider: 'Supabase Storage',
    description: 'File storage for user uploads and assets',
    config_details: {
      buckets: ['avatars', 'documents', 'exports'],
    },
  });

  // Email Service
  if (process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY) {
    integrations.push({
      name: 'email_service',
      type: 'email',
      enabled: true,
      provider: process.env.RESEND_API_KEY ? 'Resend' : 'SendGrid',
      description: 'Transactional email service',
      config_details: {
        from_email: process.env.EMAIL_FROM || 'noreply@thecubiqo.com',
      },
    });
  }

  // Analytics
  if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    integrations.push({
      name: 'google_analytics',
      type: 'analytics',
      enabled: true,
      provider: 'Google Analytics',
      description: 'Web analytics and user tracking',
      config_details: {
        measurement_id: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      },
    });
  }

  // OpenAI API
  if (process.env.OPENAI_API_KEY) {
    integrations.push({
      name: 'openai_api',
      type: 'api',
      enabled: true,
      provider: 'OpenAI',
      description: 'AI-powered features and content generation',
      config_details: {
        models: ['gpt-4', 'gpt-3.5-turbo'],
      },
    });
  }

  // Stripe Payment
  if (process.env.STRIPE_SECRET_KEY) {
    integrations.push({
      name: 'stripe_payment',
      type: 'payment',
      enabled: true,
      provider: 'Stripe',
      description: 'Payment processing and subscriptions',
      config_details: {
        publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhook_enabled: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
    });
  }

  // Webhook endpoints
  integrations.push({
    name: 'internal_webhooks',
    type: 'webhook',
    enabled: true,
    provider: 'Internal',
    description: 'Internal webhook system for event notifications',
    config_details: {
      endpoints: ['/api/webhooks/auth', '/api/webhooks/payment'],
    },
  });

  // Vercel Analytics (if deployed on Vercel)
  if (process.env.VERCEL) {
    integrations.push({
      name: 'vercel_analytics',
      type: 'analytics',
      enabled: true,
      provider: 'Vercel',
      description: 'Vercel Analytics and Speed Insights',
    });
  }

  return integrations;
}
