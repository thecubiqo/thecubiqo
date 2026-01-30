import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const worldSchema = z.object({
  worldId: z.string().regex(/^[a-z][a-z0-9-]*$/, 'World ID must be lowercase alphanumeric with hyphens'),
  configJson: z.any(), // JSON object validated by schema
})

// GET /api/worlds - List all worlds
export async function GET() {
  try {
    const worlds = await prisma.world.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ worlds })
  } catch (error) {
    console.error('Error fetching worlds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch worlds' },
      { status: 500 }
    )
  }
}

// POST /api/worlds - Create a new world
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = worldSchema.parse(body)

    // Check if world already exists
    const existing = await prisma.world.findUnique({
      where: { worldId: data.worldId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'World already exists' },
        { status: 400 }
      )
    }

    const world = await prisma.world.create({
      data: {
        worldId: data.worldId,
        configJson: data.configJson,
      },
    })

    return NextResponse.json({ world }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating world:', error)
    return NextResponse.json(
      { error: 'Failed to create world' },
      { status: 500 }
    )
  }
}

