/**
 * Tool Execution API Route
 * Handles direct tool execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { ToolRegistry } from '@/lib/engine/tools';
import { ToolContext } from '@/types/tool';
import '@/lib/engine/init';

// POST /api/tools/:id/execute - Execute tool directly
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { params: toolParams, context } = body;
    
    if (!toolParams) {
      return NextResponse.json(
        { error: 'Tool params are required' },
        { status: 400 }
      );
    }
    
    // Build tool context with defaults
    const toolContext: ToolContext = {
      agentId: context?.agentId || 'api-direct',
      sessionId: context?.sessionId || 'api-session',
      workspace: context?.workspace || process.cwd(),
      userId: context?.userId,
    };
    
    const registry = new ToolRegistry();
    const result = await registry.execute(id, toolParams, toolContext);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Tool execution failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('[Tool Execute API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute tool' },
      { status: 500 }
    );
  }
}
