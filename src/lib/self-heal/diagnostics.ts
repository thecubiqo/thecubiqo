/**
 * Self-Heal Diagnostics
 * 
 * Performs system health checks and diagnostics.
 * Independent checks run in parallel via Promise.allSettled for efficiency.
 */

import { DiagnosticResult } from './types';

/**
 * Run all diagnostics checks in parallel for efficiency
 */
export async function runDiagnostics(): Promise<DiagnosticResult[]> {
  const checks = [
    checkDatabaseConnectivity(),
    Promise.resolve(checkMemoryUsage()),
    Promise.resolve(checkDiskSpace()),
    checkAgentHealth(),
    checkExpiredSessions(),
    Promise.resolve(checkEnvironmentVariables()),
    checkApiEndpointHealth(),
  ];

  const settled = await Promise.allSettled(checks);

  return settled.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    // If a diagnostic itself threw, capture it as a critical result
    const checkNames = [
      'Database Connectivity', 'Memory Usage', 'Disk Space',
      'Agent Health', 'Session Cleanup', 'Environment Variables', 'API Endpoint Health',
    ];
    return {
      name: checkNames[index] ?? `Check ${index}`,
      status: 'critical' as const,
      message: `Diagnostic check failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`,
      details: { error: String(result.reason) },
      timestamp: new Date(),
      durationMs: 0,
    };
  });
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnectivity(): Promise<DiagnosticResult> {
  const start = Date.now();
  try {
    // In a real implementation, this would use the Supabase client
    // For now, we'll simulate a successful check
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const responseTime = Date.now() - start;
    
    if (responseTime > 1000) {
      return {
        name: 'Database Connectivity',
        status: 'warning',
        message: `Database response time is high: ${responseTime}ms`,
        details: { responseTime },
        timestamp: new Date(),
        durationMs: responseTime,
      };
    }
    
    return {
      name: 'Database Connectivity',
      status: 'healthy',
      message: 'Database is responsive',
      details: { responseTime },
      timestamp: new Date(),
      durationMs: responseTime,
    };
  } catch (error) {
    return {
      name: 'Database Connectivity',
      status: 'critical',
      message: 'Database connection failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemoryUsage(): DiagnosticResult {
  const start = Date.now();
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(usage.rss / 1024 / 1024);
  const heapPercentage = (usage.heapUsed / usage.heapTotal) * 100;

  if (heapPercentage > 90) {
    return {
      name: 'Memory Usage',
      status: 'critical',
      message: `Memory usage is critically high: ${heapPercentage.toFixed(1)}%`,
      details: { heapUsedMB, heapTotalMB, rssMB, heapPercentage },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  }

  if (heapPercentage > 75) {
    return {
      name: 'Memory Usage',
      status: 'warning',
      message: `Memory usage is elevated: ${heapPercentage.toFixed(1)}%`,
      details: { heapUsedMB, heapTotalMB, rssMB, heapPercentage },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  }

  return {
    name: 'Memory Usage',
    status: 'healthy',
    message: `Memory usage is normal: ${heapPercentage.toFixed(1)}%`,
    details: { heapUsedMB, heapTotalMB, rssMB, heapPercentage },
    timestamp: new Date(),
    durationMs: Date.now() - start,
  };
}

/**
 * Check disk space (simulated)
 */
function checkDiskSpace(): DiagnosticResult {
  const start = Date.now();
  // In production, this would check actual disk space
  return {
    name: 'Disk Space',
    status: 'healthy',
    message: 'Disk space is adequate',
    details: { available: '85%', used: '15%' },
    timestamp: new Date(),
    durationMs: Date.now() - start,
  };
}

/**
 * Check agent health
 */
async function checkAgentHealth(): Promise<DiagnosticResult> {
  const start = Date.now();
  try {
    // In a real implementation, this would check actual agent status
    await new Promise(resolve => setTimeout(resolve, 30));
    
    return {
      name: 'Agent Health',
      status: 'healthy',
      message: 'All agents are operational',
      details: { totalAgents: 3, healthyAgents: 3 },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Agent Health',
      status: 'warning',
      message: 'Some agents may be experiencing issues',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Check for expired sessions that need cleanup
 */
async function checkExpiredSessions(): Promise<DiagnosticResult> {
  const start = Date.now();
  try {
    // In a real implementation, this would query the database for expired sessions
    await new Promise(resolve => setTimeout(resolve, 40));
    
    const expiredCount = Math.floor(Math.random() * 10); // Simulate 0-9 expired sessions
    
    if (expiredCount > 5) {
      return {
        name: 'Session Cleanup',
        status: 'warning',
        message: `Found ${expiredCount} expired sessions that need cleanup`,
        details: { expiredCount },
        timestamp: new Date(),
        durationMs: Date.now() - start,
      };
    }
    
    return {
      name: 'Session Cleanup',
      status: 'healthy',
      message: expiredCount === 0 ? 'No expired sessions found' : `${expiredCount} expired sessions found (normal)`,
      details: { expiredCount },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Session Cleanup',
      status: 'warning',
      message: 'Unable to check expired sessions',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Check completeness of environment variables
 */
function checkEnvironmentVariables(): DiagnosticResult {
  const start = Date.now();
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  const recommended = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'CRON_SECRET',
  ];

  const missingRequired = required.filter(v => !process.env[v]);
  const missingRecommended = recommended.filter(v => !process.env[v]);

  if (missingRequired.length > 0) {
    return {
      name: 'Environment Variables',
      status: 'critical',
      message: `Missing ${missingRequired.length} required environment variable(s)`,
      details: { missingRequired, missingRecommended },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  }

  if (missingRecommended.length > 0) {
    return {
      name: 'Environment Variables',
      status: 'warning',
      message: `Missing ${missingRecommended.length} recommended environment variable(s)`,
      details: { missingRequired: [], missingRecommended },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  }

  return {
    name: 'Environment Variables',
    status: 'healthy',
    message: 'All environment variables configured',
    details: { requiredCount: required.length, recommendedCount: recommended.length },
    timestamp: new Date(),
    durationMs: Date.now() - start,
  };
}

/**
 * Check API endpoint health (internal health endpoint)
 */
async function checkApiEndpointHealth(): Promise<DiagnosticResult> {
  const start = Date.now();
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    if (!appUrl) {
      return {
        name: 'API Endpoint Health',
        status: 'warning',
        message: 'App URL not configured, skipping API health check',
        details: { reason: 'NEXT_PUBLIC_APP_URL or VERCEL_URL not set' },
        timestamp: new Date(),
        durationMs: Date.now() - start,
      };
    }

    const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const responseTime = Date.now() - start;

      if (response.ok) {
        return {
          name: 'API Endpoint Health',
          status: responseTime > 3000 ? 'warning' : 'healthy',
          message: responseTime > 3000
            ? `API responded but slowly: ${responseTime}ms`
            : `API is healthy (${responseTime}ms)`,
          details: { responseTime, statusCode: response.status },
          timestamp: new Date(),
          durationMs: responseTime,
        };
      }

      return {
        name: 'API Endpoint Health',
        status: 'warning',
        message: `API returned non-OK status: ${response.status}`,
        details: { responseTime, statusCode: response.status },
        timestamp: new Date(),
        durationMs: responseTime,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - start;
      const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError';
      return {
        name: 'API Endpoint Health',
        status: 'warning',
        message: isTimeout ? 'API health check timed out (5s)' : 'API health check failed',
        details: {
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          isTimeout,
        },
        timestamp: new Date(),
        durationMs,
      };
    }
  } catch (error) {
    return {
      name: 'API Endpoint Health',
      status: 'warning',
      message: 'API health check encountered an error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date(),
      durationMs: Date.now() - start,
    };
  }
}
