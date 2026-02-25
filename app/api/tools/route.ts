/**
 * Tools API Route
 * Handles tool listing operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { ToolRegistry } from '@/lib/engine/tools';
import '@/lib/engine/init';

export const dynamic = 'force-dynamic';

// GET /api/tools - List available tools
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolIdsParam = searchParams.get('ids');
    const userId = searchParams.get('userId');
    
    // Parse tool IDs if provided
    const toolIds = toolIdsParam ? toolIdsParam.split(',').map(id => id.trim()) : undefined;
    
    const registry = new ToolRegistry();
    const tools = await registry.getTools(toolIds, userId || undefined);
    
    return NextResponse.json({ tools });
  } catch (error) {
    console.error('[Tools API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}
