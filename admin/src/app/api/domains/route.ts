import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDnsInstructions } from '@/lib/settings'
import { z } from 'zod'

const domainSchema = z.object({
  domainName: z.string().min(1).max(255).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/),
  dnsInstructions: z.string().optional(),
})

// GET /api/domains - List all domains
export async function GET() {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        deployments: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

// POST /api/domains - Create a new domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = domainSchema.parse(body)

    // Check if domain already exists
    const existing = await prisma.domain.findUnique({
      where: { domainName: data.domainName },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      )
    }

    // Generate DNS instructions dynamically if not provided
    const dnsInstructions = data.dnsInstructions || await generateDnsInstructions(data.domainName)

    const domain = await prisma.domain.create({
      data: {
        domainName: data.domainName,
        dnsInstructions,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ domain }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating domain:', error)
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    )
  }
}

