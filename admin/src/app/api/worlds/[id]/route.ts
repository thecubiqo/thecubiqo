import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateWorldSchema = z.object({
  worldId: z.string().regex(/^[a-z][a-z0-9-]*$/).optional(),
  configJson: z.any().optional(),
})

// GET /api/worlds/[id] - Get a single world
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const world = await prisma.world.findUnique({
      where: { id },
    })

    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ world })
  } catch (error) {
    console.error('Error fetching world:', error)
    return NextResponse.json(
      { error: 'Failed to fetch world' },
      { status: 500 }
    )
  }
}

// PATCH /api/worlds/[id] - Update a world
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateWorldSchema.parse(body)

    // Check if worldId is being changed and if it already exists
    if (data.worldId) {
      const existing = await prisma.world.findUnique({
        where: { worldId: data.worldId },
      })

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'World ID already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (data.worldId !== undefined) updateData.worldId = data.worldId
    if (data.configJson !== undefined) updateData.configJson = data.configJson

    const world = await prisma.world.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ world })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating world:', error)
    return NextResponse.json(
      { error: 'Failed to update world' },
      { status: 500 }
    )
  }
}

// DELETE /api/worlds/[id] - Delete a world
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const world = await prisma.world.findUnique({
      where: { id },
    })

    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      )
    }

    await prisma.world.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting world:', error)
    return NextResponse.json(
      { error: 'Failed to delete world' },
      { status: 500 }
    )
  }
}

