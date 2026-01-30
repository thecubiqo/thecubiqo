/**
 * Nginx configuration generator and manager
 */

import { promises as fs } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { env } from './env'
import { prisma } from './db'

const execAsync = promisify(exec)

export interface NginxConfigOptions {
  domain: string
  port: number
  sslEnabled: boolean
  sslCertPath?: string
  sslKeyPath?: string
}

/**
 * Generate Nginx configuration for a deployment
 */
export function generateNginxConfig(options: NginxConfigOptions): string {
  const { domain, port, sslEnabled, sslCertPath, sslKeyPath } = options

  let config = `server {
    listen 80;
    server_name ${domain};

`

  if (sslEnabled && sslCertPath && sslKeyPath) {
    config += `    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};

    ssl_certificate ${sslCertPath};
    ssl_certificate_key ${sslKeyPath};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

`
  }

  config += `    # Proxy to Next.js standalone server
    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /_next/static {
        proxy_pass http://127.0.0.1:${port};
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
`

  return config
}

/**
 * Write Nginx configuration file
 */
export async function writeNginxConfig(
  domain: string,
  config: string
): Promise<string> {
  const configPath = path.join(env.nginxConfigDir, `${domain}.conf`)
  
  // Ensure directory exists
  await fs.mkdir(env.nginxConfigDir, { recursive: true })
  
  // Write config file
  await fs.writeFile(configPath, config, 'utf-8')
  
  return configPath
}

/**
 * Enable Nginx site (create symlink)
 */
export async function enableNginxSite(domain: string): Promise<void> {
  const configPath = path.join(env.nginxConfigDir, `${domain}.conf`)
  const enabledPath = path.join(env.nginxEnabledDir, `${domain}.conf`)
  
  // Ensure enabled directory exists
  await fs.mkdir(env.nginxEnabledDir, { recursive: true })
  
  // Create symlink
  try {
    await fs.unlink(enabledPath) // Remove existing symlink if any
  } catch {
    // Ignore if doesn't exist
  }
  
  await fs.symlink(configPath, enabledPath)
}

/**
 * Test Nginx configuration
 */
export async function testNginxConfig(): Promise<boolean> {
  try {
    await execAsync('nginx -t')
    return true
  } catch (error) {
    console.error('Nginx config test failed:', error)
    return false
  }
}

/**
 * Reload Nginx
 */
export async function reloadNginx(): Promise<void> {
  try {
    // Try systemctl first (systemd)
    await execAsync('systemctl reload nginx')
  } catch {
    // Fallback to nginx -s reload
    try {
      await execAsync('nginx -s reload')
    } catch (error) {
      throw new Error(`Failed to reload Nginx: ${error}`)
    }
  }
}

/**
 * Apply Nginx configuration for a deployment
 */
export async function applyNginxConfig(deploymentId: string): Promise<void> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      domain: true,
    },
  })

  if (!deployment) {
    throw new Error('Deployment not found')
  }

  if (!deployment.port) {
    throw new Error('Deployment port not set')
  }

  const config = generateNginxConfig({
    domain: deployment.domain.domainName,
    port: deployment.port,
    sslEnabled: deployment.sslEnabled,
    sslCertPath: deployment.sslCertPath || undefined,
    sslKeyPath: deployment.sslKeyPath || undefined,
  })

  // Write config
  const configPath = await writeNginxConfig(deployment.domain.domainName, config)

  // Enable site
  await enableNginxSite(deployment.domain.domainName)

  // Test config
  const isValid = await testNginxConfig()
  if (!isValid) {
    throw new Error('Nginx configuration test failed')
  }

  // Reload Nginx
  await reloadNginx()

  // Update deployment
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      nginxConfigPath: configPath,
    },
  })
}

