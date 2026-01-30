/**
 * Template builder - copies templates and injects configuration
 */

import { promises as fs } from 'fs'
import path from 'path'
import { env } from './env'
import { TemplateConfig } from './config-schema'

export interface BuildOptions {
  deploymentId: string
  domainName: string
  templatePath: string
  config: TemplateConfig
  uploads: Array<{ filePath: string; originalName: string; fileType: string }>
}

/**
 * Copy template to deployment directory
 */
export async function copyTemplateToDeployment(options: BuildOptions): Promise<string> {
  const { deploymentId, domainName, templatePath } = options
  const deploymentPath = path.join(env.deploymentsDir, domainName)

  // Create deployment directory
  await fs.mkdir(deploymentPath, { recursive: true })

  // Copy template files recursively
  await copyDirectory(templatePath, deploymentPath)

  return deploymentPath
}

/**
 * Inject configuration into template files
 */
export async function injectConfiguration(
  deploymentPath: string,
  config: TemplateConfig
): Promise<void> {
  // Create config file
  const configPath = path.join(deploymentPath, 'src', 'config', 'deployment-config.json')
  const configDir = path.dirname(configPath)
  await fs.mkdir(configDir, { recursive: true })
  await fs.writeFile(configPath, JSON.stringify(config, null, 2))

  // Update next.config.ts to use standalone output
  const nextConfigPath = path.join(deploymentPath, 'next.config.ts')
  try {
    const nextConfigContent = await fs.readFile(nextConfigPath, 'utf-8')
    const updatedConfig = nextConfigContent.replace(
      /const nextConfig: NextConfig = \{[\s\S]*?\}/,
      `const nextConfig: NextConfig = {
  output: 'standalone',
}`
    )
    await fs.writeFile(nextConfigPath, updatedConfig)
  } catch (error) {
    // If next.config.ts doesn't exist, create it
    await fs.writeFile(
      nextConfigPath,
      `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
`
    )
  }

  // Copy uploaded files to public directory
  // This would be done separately when files are uploaded
}

/**
 * Copy uploaded files to template public directory
 */
export async function copyUploadsToTemplate(
  deploymentPath: string,
  uploads: Array<{ filePath: string; originalName: string; fileType: string }>
): Promise<void> {
  const publicDir = path.join(deploymentPath, 'public')
  await fs.mkdir(publicDir, { recursive: true })

  for (const upload of uploads) {
    const fileName = path.basename(upload.filePath)
    const destPath = path.join(publicDir, fileName)
    await fs.copyFile(upload.filePath, destPath)
  }
}

/**
 * Generate dynamic CSS from color configuration
 */
export async function generateDynamicCSS(
  deploymentPath: string,
  colors: TemplateConfig['colors']
): Promise<void> {
  if (!colors) return

  const cssPath = path.join(deploymentPath, 'src', 'app', 'dynamic-colors.css')
  const cssDir = path.dirname(cssPath)
  await fs.mkdir(cssDir, { recursive: true })

  const cssContent = `
:root {
  --color-primary: ${colors.primary || '#3b82f6'};
  --color-secondary: ${colors.secondary || '#8b5cf6'};
  --color-accent: ${colors.accent || '#10b981'};
}
`

  await fs.writeFile(cssPath, cssContent)
}

/**
 * Helper function to copy directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  // Files/directories to exclude
  const exclude = ['node_modules', '.next', '.git', 'dist', 'build']

  for (const entry of entries) {
    if (exclude.includes(entry.name)) {
      continue
    }

    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

