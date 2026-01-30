import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { env } from '@/lib/env'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const uploadSchema = z.object({
  deploymentId: z.string(),
  fileType: z.enum(['IMAGE', 'VIDEO', 'LOGO', 'OTHER']),
})

// POST /api/upload - Handle file uploads
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const deploymentId = formData.get('deploymentId') as string | null
    const fileType = formData.get('fileType') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!deploymentId || !fileType) {
      return NextResponse.json(
        { error: 'Missing deploymentId or fileType' },
        { status: 400 }
      )
    }

    // Validate file type
    const validFileType = uploadSchema.shape.fileType.parse(fileType)

    // Validate deployment exists
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    })

    if (!deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      )
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      )
    }

    // Create upload directory structure
    const uploadDir = join(env.uploadsDir, deploymentId)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${sanitizedName}`
    const filePath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save metadata to database
    const upload = await prisma.upload.create({
      data: {
        deploymentId,
        fileType: validFileType,
        filePath,
        originalName: file.name,
        mimeType: file.type || null,
        size: file.size,
      },
    })

    return NextResponse.json({
      upload: {
        id: upload.id,
        filePath: `/uploads/${deploymentId}/${filename}`,
        originalName: upload.originalName,
        fileType: upload.fileType,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

