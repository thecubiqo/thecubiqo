import { NextRequest, NextResponse } from 'next/server'
import {
  enableSSLForDeployment,
  disableSSLForDeployment,
  checkSSLCertificate,
  getCertificateExpiration,
} from '@/lib/certbot'
import { prisma } from '@/lib/db'

// POST /api/ssl/[id] - Enable SSL for deployment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'enable') {
      await enableSSLForDeployment(id)
      return NextResponse.json({
        message: 'SSL enabled successfully',
        deploymentId: id,
      })
    } else if (action === 'disable') {
      await disableSSLForDeployment(id)
      return NextResponse.json({
        message: 'SSL disabled successfully',
        deploymentId: id,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "enable" or "disable"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error managing SSL:', error)
    return NextResponse.json(
      { error: 'Failed to manage SSL', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/ssl/[id] - Get SSL status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        domain: true,
      },
    })

    if (!deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      )
    }

    const hasCertificate = await checkSSLCertificate(deployment.domain.domainName)
    const expiration = hasCertificate
      ? await getCertificateExpiration(deployment.domain.domainName)
      : null

    return NextResponse.json({
      sslEnabled: deployment.sslEnabled,
      hasCertificate,
      certPath: deployment.sslCertPath,
      keyPath: deployment.sslKeyPath,
      expiration: expiration?.toISOString() || null,
    })
  } catch (error: any) {
    console.error('Error fetching SSL status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SSL status' },
      { status: 500 }
    )
  }
}

