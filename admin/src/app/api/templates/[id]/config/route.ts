import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const configSchema = z.record(z.any()) // Flexible JSON schema

// GET /api/templates/[id]/config - Get template config schema
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await prisma.template.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Return default config schema based on template
    // This can be extended to read from template files
    const defaultConfig = {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#10b981',
      },
      text: {
        siteName: '',
        tagline: '',
        description: '',
      },
      images: {
        logo: '',
        hero: '',
      },
      videos: {
        hero: '',
      },
    }

    return NextResponse.json({ configSchema: defaultConfig })
  } catch (error) {
    console.error('Error fetching template config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template config' },
      { status: 500 }
    )
  }
}

