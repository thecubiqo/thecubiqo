import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { env } from '@/lib/env'
import { promises as fs } from 'fs'
import path from 'path'

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  description: z.string().optional(),
  sourceTemplate: z.string().optional(), // Template to copy from
})

// GET /api/templates - List all templates
export async function GET() {
  try {
    // Get templates from database
    const dbTemplates = await prisma.template.findMany({
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

    // Also check filesystem for templates
    try {
      const templateDirs = await fs.readdir(env.templatesDir, { withFileTypes: true })
      const fsTemplates = templateDirs
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)

      // Sync: add templates from filesystem that aren't in DB
      for (const templateName of fsTemplates) {
        const exists = dbTemplates.find((t: { name: string }) => t.name === templateName)
        if (!exists) {
          await prisma.template.create({
            data: {
              name: templateName,
              templatePath: path.join(env.templatesDir, templateName),
              description: `Template: ${templateName}`,
              isActive: true,
            },
          })
        }
      }
    } catch (error) {
      console.warn('Could not read templates directory:', error)
    }

    const allTemplates = await prisma.template.findMany({
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

    return NextResponse.json({ templates: allTemplates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createTemplateSchema.parse(body)

    // Check if template already exists
    const existing = await prisma.template.findUnique({
      where: { name: data.name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Template already exists' },
        { status: 400 }
      )
    }

    const templatePath = path.join(env.templatesDir, data.name)

    // If sourceTemplate is provided, copy from it
    if (data.sourceTemplate) {
      const sourcePath = path.join(env.templatesDir, data.sourceTemplate)
      try {
        await fs.access(sourcePath)
        // Copy directory recursively
        await copyDirectory(sourcePath, templatePath)
      } catch (error) {
        return NextResponse.json(
          { error: 'Source template not found' },
          { status: 400 }
        )
      }
    } else {
      // Create empty template directory
      await fs.mkdir(templatePath, { recursive: true })
    }

    const template = await prisma.template.create({
      data: {
        name: data.name,
        templatePath,
        description: data.description || `Template: ${data.name}`,
        isActive: true,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

// Helper function to copy directory recursively
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

