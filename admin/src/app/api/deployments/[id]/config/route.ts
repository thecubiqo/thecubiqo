import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const configSchema = z.record(z.any())

// POST /api/deployments/[id]/config - Save deployment configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { configJson } = body

    // Validate config
    configSchema.parse(configJson)

    // Upsert config
    await prisma.templateConfig.upsert({
      where: { deploymentId: id },
      update: { configJson },
      create: {
        deploymentId: id,
        configJson,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid config', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error saving config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

// GET /api/deployments/[id]/config - Get deployment configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const config = await prisma.templateConfig.findUnique({
      where: { deploymentId: id },
    })

    if (!config) {
      return NextResponse.json({ configJson: null })
    }

    return NextResponse.json({ configJson: config.configJson })
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

