import { NextRequest, NextResponse } from 'next/server'
import { deploy } from '@/lib/deployment'
import { z } from 'zod'

const deploySchema = z.object({
  enableSSL: z.boolean().optional().default(false),
})

// POST /api/deployments/[id]/deploy - Deploy a deployment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { enableSSL } = deploySchema.parse(body)

    // Start deployment asynchronously
    deploy(id, { enableSSL }).catch((error) => {
      console.error('Deployment error:', error)
    })

    return NextResponse.json({
      message: 'Deployment started',
      deploymentId: id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error starting deployment:', error)
    return NextResponse.json(
      { error: 'Failed to start deployment' },
      { status: 500 }
    )
  }
}

