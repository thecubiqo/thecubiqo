/**
 * Integrations API
 * GET /api/integrations - List all integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with real DB after migrations applied
    // Mock data for now
    return NextResponse.json({
      integrations: [],
      note: 'Mock mode - apply migrations to enable'
    })
  } catch (error) {
    console.error('Integrations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
