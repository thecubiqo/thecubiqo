/**
 * Tool Schema API Route
 * Handles tool schema retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { ToolRegistry } from '@/lib/engine/tools';
import '@/lib/engine/init';

// GET /api/tools/:id/schema - Get tool input schema
export async function GET(
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
    
    const registry = new ToolRegistry();
    const tools = await registry.getTools([id]);
    
    if (tools.length === 0) {
      return NextResponse.json(
        { error: `Tool not found: ${id}` },
        { status: 404 }
      );
    }
    
    const tool = tools[0];
    
    return NextResponse.json({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    });
  } catch (error) {
    console.error('[Tool Schema API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool schema' },
      { status: 500 }
    );
  }
}
