import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/templates/[id] - Get a single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        deployments: {
          include: {
            domain: {
              select: {
                id: true,
                domainName: true,
                status: true,
              },
            },
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PATCH /api/templates/[id] - Update a template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateTemplateSchema.parse(body)

    // Check if name is being changed and if it already exists
    if (data.name) {
      const existing = await prisma.template.findUnique({
        where: { name: data.name },
      })

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'Template name already exists' },
          { status: 400 }
        )
      }
    }

    const template = await prisma.template.update({
      where: { id },
      data,
    })

    return NextResponse.json({ template })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if template has active deployments
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        deployments: {
          where: {
            status: {
              in: ['BUILT', 'DEPLOYED'],
            },
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (template.deployments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template with active deployments. Please delete deployments first.' },
        { status: 400 }
      )
    }

    await prisma.template.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

