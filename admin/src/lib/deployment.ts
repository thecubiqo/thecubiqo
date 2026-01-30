/**
 * Deployment orchestration service
 * Orchestrates: config → build → Nginx → SSL
 */

import { prisma } from './db'
import { buildDeployment, getNextAvailablePort } from './build'
import { applyNginxConfig } from './nginx'
import { enableSSLForDeployment } from './certbot'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { promises as fs } from 'fs'

const execAsync = promisify(exec)


export interface DeploymentProgress {
  stage: 'config' | 'build' | 'nginx' | 'ssl' | 'complete'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  message: string
  error?: string
}

/**
 * Full deployment workflow
 */
export async function deploy(
  deploymentId: string,
  options: {
    enableSSL?: boolean
    onProgress?: (progress: DeploymentProgress) => void
  } = {}
): Promise<DeploymentProgress> {
  const { enableSSL = false, onProgress } = options

  // Stage 1: Ensure configuration exists
  let progress: DeploymentProgress = {
    stage: 'config',
    status: 'in_progress',
    message: 'Preparing configuration...',
  }
  onProgress?.(progress)

  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      domain: true,
      template: true,
      config: true,
    },
  })

  if (!deployment) {
    progress = {
      stage: 'config',
      status: 'failed',
      message: 'Deployment not found',
      error: 'Deployment not found',
    }
    onProgress?.(progress)
    return progress
  }

  // Ensure port is assigned
  if (!deployment.port) {
    const port = await getNextAvailablePort()
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { port },
    })
  }

  progress = {
    stage: 'config',
    status: 'completed',
    message: 'Configuration ready',
  }
  onProgress?.(progress)

  // Stage 2: Build
  progress = {
    stage: 'build',
    status: 'in_progress',
    message: 'Building deployment...',
  }
  onProgress?.(progress)

  const buildResult = await buildDeployment(deploymentId)

  if (!buildResult.success) {
    progress = {
      stage: 'build',
      status: 'failed',
      message: 'Build failed',
      error: buildResult.error,
    }
    onProgress?.(progress)
    return progress
  }

  progress = {
    stage: 'build',
    status: 'completed',
    message: 'Build completed successfully',
  }
  onProgress?.(progress)

  // Stage 3: Configure Nginx
  progress = {
    stage: 'nginx',
    status: 'in_progress',
    message: 'Configuring Nginx...',
  }
  onProgress?.(progress)

  try {
    await applyNginxConfig(deploymentId)
    progress = {
      stage: 'nginx',
      status: 'completed',
      message: 'Nginx configured successfully',
    }
    onProgress?.(progress)
  } catch (error: any) {
    console.warn('Nginx configuration failed (skipping):', error)
    progress = {
      stage: 'nginx',
      status: 'failed',
      message: 'Nginx configuration failed (skipping)',
      error: error.message,
    }
    onProgress?.(progress)
    // Continue despite Nginx failure (server can still start)
  }

  // Stage 4: SSL (if requested)
  // Only try SSL if Nginx succeeded? Or try anyway?
  // Usually SSL needs Nginx to be working for challenge or config update.
  if (enableSSL) {
    progress = {
      stage: 'ssl',
      status: 'in_progress',
      message: 'Obtaining SSL certificate...',
    }
    onProgress?.(progress)

    try {
      await enableSSLForDeployment(deploymentId)
      progress = {
        stage: 'ssl',
        status: 'completed',
        message: 'SSL certificate obtained',
      }
      onProgress?.(progress)
    } catch (error: any) {
      progress = {
        stage: 'ssl',
        status: 'failed',
        message: 'SSL certificate failed',
        error: error.message,
      }
      onProgress?.(progress)
      // Don't fail entire deployment if SSL fails
    }
  }

  // Update deployment status
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { status: 'DEPLOYED' },
  })

  // Start the Next.js server
  try {
    await startDeploymentServer(deploymentId)
  } catch (error: any) {
    progress = {
      stage: 'complete',
      status: 'failed',
      message: 'Failed to start server',
      error: error.message,
    }
    onProgress?.(progress)
    return progress
  }

  progress = {
    stage: 'complete',
    status: 'completed',
    message: 'Deployment completed successfully',
  }
  onProgress?.(progress)

  return progress
}

/**
 * Start Next.js server for a deployment
 */
async function startDeploymentServer(deploymentId: string): Promise<void> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      domain: true,
    },
  })

  if (!deployment || !deployment.buildPath || !deployment.port) {
    throw new Error('Deployment not ready to start')
  }

  const standaloneDir = path.join(deployment.buildPath, '.next/standalone')
  let serverPath = path.join(standaloneDir, 'server.js')

  // Check if server.js exists at root, if not search for it
  // Check if server.js exists at root, if not search for it
  try {
    await fs.access(serverPath)
  } catch {
    // Search recursively for server.js
    const findServer = async (dir: string): Promise<string | null> => {
      // Check if server.js exists in this directory directly
      try {
        const directPath = path.join(dir, 'server.js')
        await fs.access(directPath)
        return directPath
      } catch {
        // Continue to search subdirectories
      }

      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          const fullPath = path.join(dir, entry.name)
          const found = await findServer(fullPath)
          if (found) return found
        }
      }
      return null
    }

    const foundPath = await findServer(standaloneDir)
    if (foundPath) {
      serverPath = foundPath
    } else {
      throw new Error('Could not find server.js in standalone directory')
    }
  }

  const pm2Path = path.join(process.cwd(), 'node_modules/.bin/pm2')
  const name = `deployment-${deploymentId}`

  console.log(`Starting server for ${name} on port ${deployment.port} using ${serverPath}...`)

  // Stop existing if any
  try {
    await execAsync(`${pm2Path} delete ${name}`)
  } catch (e) {
    // Ignore if not found
  }

  // Start
  // Note: We set PORT env var for the process
  await execAsync(`PORT=${deployment.port} ${pm2Path} start ${serverPath} --name "${name}"`)

  console.log(`Server started for deployment ${deploymentId} on port ${deployment.port}`)
}

/**
 * Stop deployment server
 */
export async function stopDeploymentServer(deploymentId: string): Promise<void> {
  const pm2Path = path.join(process.cwd(), 'node_modules/.bin/pm2')
  const name = `deployment-${deploymentId}`

  try {
    await execAsync(`${pm2Path} stop ${name}`)
    await execAsync(`${pm2Path} delete ${name}`)
    console.log(`Server stopped for deployment ${deploymentId}`)
  } catch (error) {
    console.warn(`Could not stop server for deployment ${deploymentId}:`, error)
  }
}


