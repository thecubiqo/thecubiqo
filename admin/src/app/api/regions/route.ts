import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const regionSchema = z.object({
  regionId: z.string().regex(/^[a-z]{2,3}$/, 'Region ID must be 2-3 lowercase letters'),
  configJson: z.any(), // JSON object validated by schema
})

// GET /api/regions - List all regions
export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ regions })
  } catch (error) {
    console.error('Error fetching regions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    )
  }
}

// POST /api/regions - Create a new region
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = regionSchema.parse(body)

    // Check if region already exists
    const existing = await prisma.region.findUnique({
      where: { regionId: data.regionId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Region already exists' },
        { status: 400 }
      )
    }

    const region = await prisma.region.create({
      data: {
        regionId: data.regionId,
        configJson: data.configJson,
      },
    })

    return NextResponse.json({ region }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating region:', error)
    return NextResponse.json(
      { error: 'Failed to create region' },
      { status: 500 }
    )
  }
}

