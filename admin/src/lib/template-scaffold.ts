/**
 * Template scaffolding system
 */

import { promises as fs } from 'fs'
import path from 'path'
import { env } from './env'

export interface ScaffoldOptions {
  templateName: string
  description?: string
}

/**
 * Generate a new template structure
 */
export async function scaffoldTemplate(options: ScaffoldOptions): Promise<string> {
  const { templateName, description } = options
  const templatePath = path.join(env.templatesDir, templateName)

  // Create template directory structure
  await fs.mkdir(templatePath, { recursive: true })
  await fs.mkdir(path.join(templatePath, 'src'), { recursive: true })
  await fs.mkdir(path.join(templatePath, 'src', 'app'), { recursive: true })
  await fs.mkdir(path.join(templatePath, 'src', 'components'), { recursive: true })
  await fs.mkdir(path.join(templatePath, 'src', 'config'), { recursive: true })
  await fs.mkdir(path.join(templatePath, 'src', 'lib'), { recursive: true })
  await fs.mkdir(path.join(templatePath, 'public'), { recursive: true })

  // Create package.json
  const packageJson = {
    name: templateName,
    version: '1.0.0',
    private: true,
    description: description || `Template: ${templateName}`,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'eslint',
    },
    dependencies: {
      next: '^16.0.7',
      react: '19.2.0',
      'react-dom': '19.2.0',
    },
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^19',
      '@types/react-dom': '^19',
      typescript: '^5',
      eslint: '^9',
      'eslint-config-next': '16.0.3',
    },
  }

  await fs.writeFile(
    path.join(templatePath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  // Create next.config.ts
  const nextConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
`

  await fs.writeFile(path.join(templatePath, 'next.config.ts'), nextConfig)

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'react-jsx',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }

  await fs.writeFile(
    path.join(templatePath, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  )

  // Create basic page.tsx
  const pageContent = `export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to ${templateName}</h1>
    </div>
  )
}
`

  await fs.writeFile(path.join(templatePath, 'src', 'app', 'page.tsx'), pageContent)

  // Create layout.tsx
  const layoutContent = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${templateName}",
  description: "${description || `Template: ${templateName}`}",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
`

  await fs.writeFile(path.join(templatePath, 'src', 'app', 'layout.tsx'), layoutContent)

  // Create globals.css
  const globalsCss = `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #000000;
}

body {
  background: var(--background);
  color: var(--foreground);
}
`

  await fs.writeFile(path.join(templatePath, 'src', 'app', 'globals.css'), globalsCss)

  // Create config loader (copy from template1)
  const configLoader = `/**
 * Deployment configuration loader
 */

export interface DeploymentConfig {
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  text?: {
    siteName?: string
    tagline?: string
    description?: string
  }
  images?: {
    logo?: string
    hero?: string
  }
  videos?: {
    hero?: string
  }
}

let cachedConfig: DeploymentConfig | null = null

export async function getDeploymentConfig(): Promise<DeploymentConfig> {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    const configModule = await import('@/config/deployment-config.json')
    cachedConfig = configModule.default || configModule
    return cachedConfig
  } catch (error) {
    cachedConfig = {
      colors: { primary: '#3b82f6', secondary: '#8b5cf6', accent: '#10b981' },
      text: { siteName: 'My Site', tagline: 'Welcome', description: '' },
      images: {},
      videos: {},
    }
    return cachedConfig
  }
}
`

  await fs.writeFile(path.join(templatePath, 'src', 'lib', 'config.ts'), configLoader)

  // Create README
  const readme = `# ${templateName}

${description || `Template: ${templateName}`}

## Configuration

This template supports configuration through the deployment-config.json file.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm start
\`\`\`
`

  await fs.writeFile(path.join(templatePath, 'README.md'), readme)

  return templatePath
}

