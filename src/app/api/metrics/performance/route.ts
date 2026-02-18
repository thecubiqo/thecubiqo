// Performance metrics API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceMonitor } from '@/lib/cache/performance';

/**
 * GET /api/metrics/performance
 * Get performance metrics and statistics
 */
export async function GET(req: NextRequest) {
  try {
    const monitor = getPerformanceMonitor();
    const summary = monitor.getSummary();
    const slowOps = monitor.getSlowOperations();
    const hasIssues = monitor.hasPerformanceIssues();

    return NextResponse.json({
      summary,
      slowOperations: slowOps.slice(0, 10), // Top 10 slowest
      hasPerformanceIssues: hasIssues,
      threshold: 200, // ms
      metrics: {
        totalOperations: Object.values(summary).reduce(
          (sum, m) => sum + (m?.count || 0),
          0,
        ),
        averageResponseTime:
          Object.values(summary).reduce(
            (sum, m) => sum + (m?.average || 0),
            0,
          ) / Object.keys(summary).length || 0,
      },
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/metrics/performance
 * Clear performance metrics
 */
export async function DELETE() {
  try {
    const monitor = getPerformanceMonitor();
    monitor.clear();

    return NextResponse.json({ success: true, message: 'Metrics cleared' });
  } catch (error) {
    console.error('Clear metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to clear metrics' },
      { status: 500 },
    );
  }
}
