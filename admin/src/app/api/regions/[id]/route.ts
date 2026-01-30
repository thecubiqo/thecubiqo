import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateRegionSchema = z.object({
  regionId: z.string().regex(/^[a-z]{2,3}$/).optional(),
  configJson: z.any().optional(),
})

// GET /api/regions/[id] - Get a single region
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const region = await prisma.region.findUnique({
      where: { id },
    })

    if (!region) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ region })
  } catch (error) {
    console.error('Error fetching region:', error)
    return NextResponse.json(
      { error: 'Failed to fetch region' },
      { status: 500 }
    )
  }
}

// PATCH /api/regions/[id] - Update a region
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateRegionSchema.parse(body)

    // Check if regionId is being changed and if it already exists
    if (data.regionId) {
      const existing = await prisma.region.findUnique({
        where: { regionId: data.regionId },
      })

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'Region ID already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (data.regionId !== undefined) updateData.regionId = data.regionId
    if (data.configJson !== undefined) updateData.configJson = data.configJson

    const region = await prisma.region.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ region })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating region:', error)
    return NextResponse.json(
      { error: 'Failed to update region' },
      { status: 500 }
    )
  }
}

// DELETE /api/regions/[id] - Delete a region
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const region = await prisma.region.findUnique({
      where: { id },
    })

    if (!region) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      )
    }

    await prisma.region.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting region:', error)
    return NextResponse.json(
      { error: 'Failed to delete region' },
      { status: 500 }
    )
  }
}

