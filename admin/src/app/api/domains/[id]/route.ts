import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDnsInstructions } from '@/lib/settings'
import { z } from 'zod'

const updateDomainSchema = z.object({
  domainName: z.string().min(1).max(255).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/).optional(),
  dnsInstructions: z.string().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'DEPLOYED']).optional(),
  googleAnalyticsId: z.string().optional(),
})

// GET /api/domains/[id] - Get a single domain
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: {
        deployments: {
          include: {
            template: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Dynamically generate DNS instructions if they contain placeholder or if server IP is now configured
    let dnsInstructions = domain.dnsInstructions
    if (!dnsInstructions || dnsInstructions.includes('YOUR_SERVER_IP')) {
      dnsInstructions = await generateDnsInstructions(domain.domainName)
    }

    // Return domain with dynamically generated DNS instructions
    return NextResponse.json({
      domain: {
        ...domain,
        dnsInstructions,
      },
    })
  } catch (error) {
    console.error('Error fetching domain:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    )
  }
}

// PATCH /api/domains/[id] - Update a domain
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateDomainSchema.parse(body)

    // Check if domain name is being changed and if it already exists
    if (data.domainName) {
      const existing = await prisma.domain.findUnique({
        where: { domainName: data.domainName },
      })

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'Domain name already exists' },
          { status: 400 }
        )
      }
    }

    // Only include fields that exist in the schema
    const updateData: any = {}
    if (data.domainName !== undefined) updateData.domainName = data.domainName
    if (data.dnsInstructions !== undefined) updateData.dnsInstructions = data.dnsInstructions
    if (data.status !== undefined) updateData.status = data.status
    if (data.googleAnalyticsId !== undefined) updateData.googleAnalyticsId = data.googleAnalyticsId

    const domain = await prisma.domain.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ domain })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating domain:', error)
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    )
  }
}

// DELETE /api/domains/[id] - Delete a domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if domain has active deployments
    const domain = await prisma.domain.findUnique({
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

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    if (domain.deployments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete domain with active deployments. Please delete deployments first.' },
        { status: 400 }
      )
    }

    await prisma.domain.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    )
  }
}

