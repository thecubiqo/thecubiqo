/**
 * Certbot integration for SSL certificate management
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { prisma } from './db'
import { getCertbotEmail } from './settings'

const execAsync = promisify(exec)

/**
 * Request SSL certificate for a domain using Certbot
 */
export async function requestSSLCertificate(domain: string): Promise<{
  certPath: string
  keyPath: string
}> {
  try {
    // Get email from settings (with fallback to env)
    const email = await getCertbotEmail()
    
    // Run certbot to obtain certificate
    // Using --nginx plugin which automatically configures Nginx
    const command = `certbot certonly --nginx -d ${domain} --non-interactive --agree-tos --email ${email} --keep-until-expiring`
    
    await execAsync(command)

    // Standard Let's Encrypt paths
    const certPath = `/etc/letsencrypt/live/${domain}/fullchain.pem`
    const keyPath = `/etc/letsencrypt/live/${domain}/privkey.pem`

    return {
      certPath,
      keyPath,
    }
  } catch (error: any) {
    // Check if certificate already exists
    const certPath = `/etc/letsencrypt/live/${domain}/fullchain.pem`
    const keyPath = `/etc/letsencrypt/live/${domain}/privkey.pem`
    
    try {
      const { promises: fs } = await import('fs')
      await fs.access(certPath)
      // Certificate exists, return paths
      return { certPath, keyPath }
    } catch {
      // Certificate doesn't exist, throw original error
      throw new Error(`Failed to obtain SSL certificate: ${error.message}`)
    }
  }
}

/**
 * Check if SSL certificate exists for a domain
 */
export async function checkSSLCertificate(domain: string): Promise<boolean> {
  try {
    const { promises: fs } = await import('fs')
    const certPath = `/etc/letsencrypt/live/${domain}/fullchain.pem`
    await fs.access(certPath)
    return true
  } catch {
    return false
  }
}

/**
 * Get certificate expiration date
 */
export async function getCertificateExpiration(domain: string): Promise<Date | null> {
  try {
    const command = `openssl x509 -enddate -noout -in /etc/letsencrypt/live/${domain}/fullchain.pem`
    const result = await execAsync(command)
    const match = result.stdout.match(/notAfter=(.+)/)
    if (match) {
      return new Date(match[1])
    }
    return null
  } catch {
    return null
  }
}

/**
 * Enable SSL for a deployment
 */
export async function enableSSLForDeployment(deploymentId: string): Promise<void> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      domain: true,
    },
  })

  if (!deployment) {
    throw new Error('Deployment not found')
  }

  // Request certificate
  const { certPath, keyPath } = await requestSSLCertificate(deployment.domain.domainName)

  // Update deployment
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      sslEnabled: true,
      sslCertPath: certPath,
      sslKeyPath: keyPath,
    },
  })

  // Reapply Nginx config with SSL
  const { applyNginxConfig } = await import('./nginx')
  await applyNginxConfig(deploymentId)
}

/**
 * Disable SSL for a deployment
 */
export async function disableSSLForDeployment(deploymentId: string): Promise<void> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
  })

  if (!deployment) {
    throw new Error('Deployment not found')
  }

  // Update deployment
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      sslEnabled: false,
    },
  })

  // Reapply Nginx config without SSL
  const { applyNginxConfig } = await import('./nginx')
  await applyNginxConfig(deploymentId)
}

