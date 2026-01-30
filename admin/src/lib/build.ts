/**
 * Build manager - executes npm install and npm run build in deployment directories
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import { env } from './env'
import { prisma } from './db'
import { copyTemplateToDeployment, injectConfiguration, copyUploadsToTemplate, generateDynamicCSS } from './template-builder'
import { TemplateConfig } from './config-schema'

const execAsync = promisify(exec)

export interface BuildResult {
  success: boolean
  buildPath?: string
  error?: string
  logs?: string[]
}

/**
 * Build a deployment
 */
export async function buildDeployment(deploymentId: string): Promise<BuildResult> {
  const logs: string[] = []

  try {
    // Get deployment with relations
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        domain: true,
        template: true,
        config: true,
        uploads: true,
      },
    })

    if (!deployment) {
      return {
        success: false,
        error: 'Deployment not found',
      }
    }

    // Update status to BUILDING
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: 'BUILDING' },
    })

    logs.push(`Starting build for ${deployment.domain.domainName}`)

    // Get configuration
    const config: TemplateConfig = deployment.config?.configJson as TemplateConfig || {}

    // Copy template to deployment directory
    const deploymentPath = await copyTemplateToDeployment({
      deploymentId,
      domainName: deployment.domain.domainName,
      templatePath: deployment.template.templatePath,
      config,
      uploads: deployment.uploads.map((u) => ({
        filePath: u.filePath,
        originalName: u.originalName,
        fileType: u.fileType,
      })),
    })

    logs.push(`Template copied to ${deploymentPath}`)

    // Inject configuration
    await injectConfiguration(deploymentPath, config)
    logs.push('Configuration injected')

    // Copy uploads
    if (deployment.uploads.length > 0) {
      await copyUploadsToTemplate(
        deploymentPath,
        deployment.uploads.map((u) => ({
          filePath: u.filePath,
          originalName: u.originalName,
          fileType: u.fileType,
        }))
      )
      logs.push('Uploads copied')
    }

    // Generate dynamic CSS
    if (config.colors) {
      await generateDynamicCSS(deploymentPath, config.colors)
      logs.push('Dynamic CSS generated')
    }

    // Install dependencies
    logs.push('Installing dependencies...')
    const installResult = await execAsync('npm install', {
      cwd: deploymentPath,
      timeout: 300000, // 5 minutes
    })
    logs.push(...installResult.stdout.split('\n'))
    if (installResult.stderr) {
      logs.push(...installResult.stderr.split('\n'))
    }

    // Build
    logs.push('Building...')
    const buildResult = await execAsync('npm run build', {
      cwd: deploymentPath,
      timeout: 600000, // 10 minutes
    })
    logs.push(...buildResult.stdout.split('\n'))
    if (buildResult.stderr) {
      logs.push(...buildResult.stderr.split('\n'))
    }

    // Copy static assets to standalone directory
    const standaloneDir = path.join(deploymentPath, '.next/standalone')
    const staticSrc = path.join(deploymentPath, '.next/static')
    const staticDest = path.join(standaloneDir, '.next/static')
    const publicSrc = path.join(deploymentPath, 'public')
    const publicDest = path.join(standaloneDir, 'public')

    logs.push('Copying static assets to standalone directory...')

    try {
      // Copy .next/static -> .next/standalone/.next/static
      await copyDir(staticSrc, staticDest)
      logs.push('Static assets copied')

      // Copy public -> .next/standalone/public
      try {
        await fs.access(publicSrc)
        await copyDir(publicSrc, publicDest)
        logs.push('Public folder copied')
      } catch {
        logs.push('No public folder to copy')
      }
    } catch (err: any) {
      logs.push(`Error copying assets: ${err.message}`)
      console.error('Asset copy error:', err)
    }

    // Update deployment status
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'BUILT',
        buildPath: deploymentPath,
      },
    })

    logs.push('Build completed successfully')

    return {
      success: true,
      buildPath: deploymentPath,
      logs,
    }
  } catch (error: any) {
    // Update deployment status to FAILED
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: 'FAILED' },
    }).catch(() => { })

    logs.push(`Build failed: ${error.message}`)
    if (error.stdout) logs.push(...error.stdout.split('\n'))
    if (error.stderr) logs.push(...error.stderr.split('\n'))

    return {
      success: false,
      error: error.message,
      logs,
    }
  }
}

/**
 * Get next available port for deployment
 */
export async function getNextAvailablePort(): Promise<number> {
  const deployments = await prisma.deployment.findMany({
    where: {
      port: { not: null },
    },
    select: { port: true },
    orderBy: { port: 'asc' },
  })

  let port = env.baseDeploymentPort
  for (const deployment of deployments) {
    if (deployment.port === port) {
      port++
    } else if (deployment.port && deployment.port > port) {
      break
    }
  }

  return port
}

/**
 * Helper to copy directory recursively
 */
async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

