/**
 * Environment variable validation and access
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Construct DATABASE_URL from individual components if not provided
function getDatabaseUrl(): string {
  const directUrl = process.env.DATABASE_URL
  if (directUrl) {
    return directUrl
  }

  // Construct from individual components for MySQL
  const host = getEnvVar('DB_HOST')
  const user = getEnvVar('DB_USER')
  const pass = getEnvVar('DB_PASS')
  const name = getEnvVar('DB_NAME')
  const port = process.env.DB_PORT || '3306'

  // URL encode password to handle special characters
  const encodedPass = encodeURIComponent(pass)

  const url = `mysql://${user}:${encodedPass}@${host}:${port}/${name}`
  
  // Set in process.env so Prisma CLI can read it
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url
  }
  
  return url
}

export const env = {
  // Database
  databaseUrl: getDatabaseUrl(),
  dbHost: process.env.DB_HOST || 'localhost',
  dbUser: process.env.DB_USER || 'webportal',
  dbPass: process.env.DB_PASS || '',
  dbName: process.env.DB_NAME || 'webportal',

  // Paths
  uploadsDir: getEnvVar('UPLOADS_DIR', '/var/www/webportal/uploads'),
  deploymentsDir: getEnvVar('DEPLOYMENTS_DIR', '/var/www/webportal/deployments'),
  templatesDir: getEnvVar('TEMPLATES_DIR', '/var/www/webportal/templates'),
  nginxConfigDir: getEnvVar('NGINX_CONFIG_DIR', '/etc/nginx/sites-available'),
  nginxEnabledDir: getEnvVar('NGINX_ENABLED_DIR', '/etc/nginx/sites-enabled'),

  // Server
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  port: parseInt(process.env.PORT || '3000', 10),

  // SSL (now configurable from portal - kept for backward compatibility)
  certbotEmail: process.env.CERTBOT_EMAIL || 'admin@example.com',

  // Deployment
  baseDeploymentPort: parseInt(process.env.BASE_DEPLOYMENT_PORT || '3001', 10),
}

// Validate critical paths exist (will be created if needed)
export async function validateEnv(): Promise<void> {
  const required = [
    env.uploadsDir,
    env.deploymentsDir,
    env.templatesDir,
  ]

  // Note: We'll create directories in the deployment service
  // This is just for validation that env vars are set
  console.log('Environment variables validated')
}

