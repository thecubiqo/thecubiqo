/**
 * Integration Management API - MOCK MODE
 * GET /api/integrations/[service] - Get specific integration
 * PATCH /api/integrations/[service] - Update integration  
 * DELETE /api/integrations/[service] - Disconnect integration
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ServiceType } from '@/types/integrations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params
  return NextResponse.json({
    integration: { service, connected: false, read_access: false, write_access: false },
    note: 'Mock mode - apply migrations to enable'
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params
  const body = await request.json()
  return NextResponse.json({
    success: true,
    integration: { service, ...body },
    note: 'Mock mode - changes not persisted'
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params
  return NextResponse.json({
    success: true,
    note: 'Mock mode - nothing to delete'
  })
}
